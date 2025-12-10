package com.alibaba.cloud.ai.studio.admin.service.impl;

import com.alibaba.cloud.ai.studio.admin.dto.response.PromptGenerationResponse;
import com.alibaba.cloud.ai.studio.admin.dto.request.PromptGenerationRequest;
import com.alibaba.cloud.ai.studio.admin.service.PromptGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromptGenerationServiceImpl implements PromptGenerationService {

    private final ChatClient chatClient;

    @Override
    public PromptGenerationResponse generatePrompt(PromptGenerationRequest request) {
        log.info("开始生成提示词，输入: {}", request.getInputPrompt());

        try {
            // 构建生成提示词的系统提示
            String systemPrompt = """
                你是一个专业的提示词工程师。请按照以下步骤生成高质量的提示词：
                
                1. 首先分析用户的需求，提取关键意图信息
                2. 基于关键意图为用户生成一个初版提示词
                3. 对初版提示词进行优化，生成最终的高质量提示词
                
                请严格按照以下JSON格式返回结果，不要包含任何其他内容：
                {
                    "keyIntent": "关键意图信息",
                    "initialPrompt": "初版提示词",
                    "finalPrompt": "最终提示词"
                }
                
                用户需求：{inputPrompt}
                """;

            // 创建提示词模板
            Map<String, Object> variables = new HashMap<>();
            variables.put("inputPrompt", request.getInputPrompt());

            // 调用AI模型生成结果
            String response = chatClient.prompt()
                    .user(systemPrompt.formatted(request.getInputPrompt()))
                    .call()
                    .content();

            log.info("AI模型响应: {}", response);

            // 解析响应并创建结果对象
            PromptGenerationResponse result = parseResponse(response);
            
            log.info("提示词生成完成");
            return result;
            
        } catch (Exception e) {
            log.error("生成提示词失败", e);
            throw new RuntimeException("生成提示词失败: " + e.getMessage(), e);
        }
    }

    @Override
    public Flux<PromptGenerationResponse> generatePromptStream(PromptGenerationRequest request) {
        log.info("开始流式生成提示词，输入: {}", request.getInputPrompt());

        return Flux.create(sink -> {
            try {
                // 构建生成提示词的系统提示
                String systemPrompt = """
                    你是一个专业的提示词工程师。请按照以下步骤生成高质量的提示词：
                    
                    1. 首先分析用户的需求，提取关键意图信息
                    2. 基于关键意图为用户生成一个初版提示词
                    3. 对初版提示词进行优化，生成最终的高质量提示词
                    
                    请严格按照以下JSON格式返回结果，不要包含任何其他内容：
                    {
                        "keyIntent": "关键意图信息",
                        "initialPrompt": "初版提示词",
                        "finalPrompt": "最终提示词"
                    }
                    
                    用户需求：{inputPrompt}
                    """;

                // 创建提示词模板
                Map<String, Object> variables = new HashMap<>();
                variables.put("inputPrompt", request.getInputPrompt());

                // 调用AI模型生成结果
                String response = chatClient.prompt()
                        .user(String.format(systemPrompt, request.getInputPrompt()))
                        .call()
                        .content();

                log.info("AI模型响应: {}", response);

                // 解析响应并创建结果对象
                PromptGenerationResponse result = parseResponse(response);
                
                // 发送结果
                sink.next(result);
                
                log.info("提示词流式生成完成");
            } catch (Exception e) {
                log.error("流式生成提示词失败", e);
                sink.error(new RuntimeException("流式生成提示词失败: " + e.getMessage()));
            } finally {
                sink.complete();
            }
        });
    }

    /**
     * 解析AI模型的响应
     */
    private PromptGenerationResponse parseResponse(String response) {
        try {
            // 尝试直接解析JSON
            String jsonStr = extractJson(response);
            if (jsonStr != null && !jsonStr.isEmpty()) {
                return parseJson(jsonStr);
            }
            
            // 如果直接解析失败，使用默认值
            log.warn("无法解析AI响应的JSON格式，使用默认值。响应内容: {}", response);
            PromptGenerationResponse result = new PromptGenerationResponse();
            result.setKeyIntent("从用户需求中提取的关键意图信息");
            result.setInitialPrompt("基于用户需求生成的初版提示词");
            result.setFinalPrompt("经过优化的最终提示词");
            return result;
        } catch (Exception e) {
            log.error("解析AI响应失败", e);
            PromptGenerationResponse result = new PromptGenerationResponse();
            result.setKeyIntent("从用户需求中提取的关键意图信息");
            result.setInitialPrompt("基于用户需求生成的初版提示词");
            result.setFinalPrompt("经过优化的最终提示词");
            return result;
        }
    }

    /**
     * 提取JSON字符串
     */
    private String extractJson(String text) {
        // 匹配大括号包围的JSON对象
        Pattern pattern = Pattern.compile("\\{[\\s\\S]*\\}");
        Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            return matcher.group(0);
        }
        
        return null;
    }

    /**
     * 解析JSON字符串为对象
     */
    private PromptGenerationResponse parseJson(String jsonStr) {
        // 这里简化实现，实际应用中可以使用Jackson或Gson进行解析
        // 为了不引入额外依赖，我们使用简单的正则表达式解析
        
        PromptGenerationResponse result = new PromptGenerationResponse();
        
        // 提取keyIntent
        Pattern keyIntentPattern = Pattern.compile("\"keyIntent\"\\s*:\\s*\"([^\"]+)\"");
        Matcher keyIntentMatcher = keyIntentPattern.matcher(jsonStr);
        if (keyIntentMatcher.find()) {
            result.setKeyIntent(keyIntentMatcher.group(1).replace("\\\"", "\""));
        }
        
        // 提取initialPrompt
        Pattern initialPromptPattern = Pattern.compile("\"initialPrompt\"\\s*:\\s*\"([^\"]+)\"");
        Matcher initialPromptMatcher = initialPromptPattern.matcher(jsonStr);
        if (initialPromptMatcher.find()) {
            result.setInitialPrompt(initialPromptMatcher.group(1).replace("\\\"", "\""));
        }
        
        // 提取finalPrompt
        Pattern finalPromptPattern = Pattern.compile("\"finalPrompt\"\\s*:\\s*\"([^\"]+)\"");
        Matcher finalPromptMatcher = finalPromptPattern.matcher(jsonStr);
        if (finalPromptMatcher.find()) {
            result.setFinalPrompt(finalPromptMatcher.group(1).replace("\\\"", "\""));
        }
        
        return result;
    }
}
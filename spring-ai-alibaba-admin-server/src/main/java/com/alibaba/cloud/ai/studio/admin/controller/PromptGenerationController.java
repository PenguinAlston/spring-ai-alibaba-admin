package com.alibaba.cloud.ai.studio.admin.controller;

import com.alibaba.cloud.ai.studio.admin.dto.response.PromptGenerationResponse;
import com.alibaba.cloud.ai.studio.admin.dto.request.PromptGenerationRequest;
import com.alibaba.cloud.ai.studio.admin.service.PromptGenerationService;
import com.alibaba.cloud.ai.studio.admin.common.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 提示词生成控制器
 * 提供提示词生成相关的API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/prompt/generate")
@RequiredArgsConstructor
public class PromptGenerationController {

    private final PromptGenerationService promptGenerationService;
    
    @Autowired
    private ChatClient chatClient;

    /**
     * 生成提示词
     * @param request 生成请求
     * @return 生成结果
     */
    @PostMapping("/complete")
    public Result<PromptGenerationResponse> generateCompletePrompt(@RequestBody PromptGenerationRequest request) {
        log.info("接收完整提示词生成请求: {}", request.getInputPrompt());
        try {
            PromptGenerationResponse response = promptGenerationService.generatePrompt(request);
            return Result.success(response);
        } catch (Exception e) {
            log.error("生成提示词失败", e);
            return Result.error("生成提示词失败: " + e.getMessage());
        }
    }

    /**
     * 流式生成提示词
     * @param request 生成请求
     * @return 流式响应
     */
    @PostMapping("/complete/stream")
    public Flux<PromptGenerationResponse> generateCompletePromptStream(@RequestBody PromptGenerationRequest request) {
        log.info("接收流式提示词生成请求: {}", request.getInputPrompt());
        return promptGenerationService.generatePromptStream(request);
    }

    /**
     * 获取系统提示词关键指令
     * @param params 包含描述、语言等参数的Map
     * @return 关键指令列表
     */
    @PostMapping("/thinking-points")
    public Result<List<String>> getSystemPromptThinkingPoints(@RequestBody Map<String, Object> params) {
        log.info("接收关键指令生成请求: {}", params.get("description"));

        try {
            String description = (String) params.get("description");
            String language = (String) params.get("language");
            if (language == null) language = "zh";

            // 构建系统提示词来生成关键指令
            String systemPrompt = buildThinkingPointsPrompt(description, language);

            // 调用AI服务
            String response = chatClient.prompt()
                    .user(systemPrompt)
                    .call()
                    .content();

            // 解析响应为列表
            List<String> thinkingPoints = parseListResponse(response);

            return Result.success(thinkingPoints);
        } catch (Exception e) {
            log.error("生成关键指令失败", e);
            return Result.error("生成关键指令失败: " + e.getMessage());
        }
    }

    /**
     * 生成系统提示词
     * @param params 包含描述、语言、关键指令等参数的Map
     * @return 生成的系统提示词
     */
    @PostMapping("/system-prompt")
    public Result<String> generateSystemPrompt(@RequestBody Map<String, Object> params) {
        log.info("接收系统提示词生成请求: {}", params.get("description"));

        try {
            String description = (String) params.get("description");
            String language = (String) params.get("language");
            Object thinkingPointsObj = params.get("thinkingPoints");
            if (language == null) language = "zh";

            List<String> thinkingPoints = null;
            if (thinkingPointsObj instanceof List) {
                thinkingPoints = (List<String>) thinkingPointsObj;
            } else {
                thinkingPoints = List.of();
            }

            // 构建系统提示词来生成系统提示词
            String systemPrompt = buildSystemPromptGenerationPrompt(description, language, thinkingPoints);

            // 调用AI服务
            String generatedPrompt = chatClient.prompt()
                    .user(systemPrompt)
                    .call()
                    .content();

            return Result.success(generatedPrompt);
        } catch (Exception e) {
            log.error("生成系统提示词失败", e);
            return Result.error("生成系统提示词失败: " + e.getMessage());
        }
    }

    /**
     * 获取优化建议
     * @param params 包含待分析提示词、提示词类型、语言等参数的Map
     * @return 优化建议列表
     */
    @PostMapping("/optimization-advice")
    public Result<List<String>> getOptimizationAdvice(@RequestBody Map<String, Object> params) {
        log.info("接收优化建议生成请求: {}", params.get("promptType"));

        try {
            String promptToAnalyze = (String) params.get("promptToAnalyze");
            String promptType = (String) params.get("promptType");
            String language = (String) params.get("language");
            if (language == null) language = "zh";

            // 构建系统提示词来生成优化建议
            String systemPrompt = buildOptimizationAdvicePrompt(promptToAnalyze, promptType, language);

            // 调用AI服务
            String response = chatClient.prompt()
                    .user(systemPrompt)
                    .call()
                    .content();

            // 解析响应为列表
            List<String> advice = parseListResponse(response);

            return Result.success(advice);
        } catch (Exception e) {
            log.error("生成优化建议失败", e);
            return Result.error("生成优化建议失败: " + e.getMessage());
        }
    }

    /**
     * 应用优化建议
     * @param params 包含原始提示词、优化建议、提示词类型等参数的Map
     * @return 应用建议后的优化提示词
     */
    @PostMapping("/apply-optimization")
    public Result<String> applyOptimizationAdvice(@RequestBody Map<String, Object> params) {
        log.info("接收优化建议应用请求: {}", params.get("promptType"));

        try {
            String originalPrompt = (String) params.get("originalPrompt");
            Object adviceObj = params.get("advice");
            String promptType = (String) params.get("promptType");
            String language = (String) params.get("language");
            if (language == null) language = "zh";

            List<String> advice = null;
            if (adviceObj instanceof List) {
                advice = (List<String>) adviceObj;
            } else {
                advice = List.of();
            }

            // 构建系统提示词来应用优化建议
            String systemPrompt = buildApplyOptimizationPrompt(originalPrompt, advice, promptType, language);

            // 调用AI服务
            String optimizedPrompt = chatClient.prompt()
                    .user(systemPrompt)
                    .call()
                    .content();

            return Result.success(optimizedPrompt);
        } catch (Exception e) {
            log.error("应用优化建议失败", e);
            return Result.error("应用优化建议失败: " + e.getMessage());
        }
    }

    /**
     * 构建关键指令生成提示词
     */
    private String buildThinkingPointsPrompt(String description, String language) {
        String languageInstruction = "请用中文回答";
        if ("en".equalsIgnoreCase(language)) {
            languageInstruction = "Please answer in English";
        }

        return String.format(
            "你是一个专业的提示词工程师。请分析用户的需求，提取生成高质量系统提示词的关键指令点。\n\n" +
            "用户需求描述：\n%s\n\n" +
            "%s\n\n" +
            "请返回一个包含关键指令点的列表，每个指令点应该是一个独立的、具体的建议，用于指导系统提示词的生成。" +
            "请将结果以JSON数组格式返回，例如：[\"指令1\", \"指令2\", \"指令3\"]",
            description, languageInstruction
        );
    }

    /**
     * 构建系统提示词生成提示词
     */
    private String buildSystemPromptGenerationPrompt(String description, String language, List<String> thinkingPoints) {
        String languageInstruction = "请用中文回答";
        if ("en".equalsIgnoreCase(language)) {
            languageInstruction = "Please answer in English";
        }

        String thinkingPointsStr = String.join("\n", thinkingPoints);

        return String.format(
            "你是一个专业的提示词工程师。请根据用户的需求和关键指令点，生成一个高质量的系统提示词。\n\n" +
            "用户需求描述：\n%s\n\n" +
            "关键指令点：\n%s\n\n" +
            "%s\n\n" +
            "请返回生成的系统提示词，不要包含任何其他解释或标记。",
            description, thinkingPointsStr, languageInstruction
        );
    }

    /**
     * 构建优化建议生成提示词
     */
    private String buildOptimizationAdvicePrompt(String promptToAnalyze, String promptType, String language) {
        String languageInstruction = "请用中文回答";
        if ("en".equalsIgnoreCase(language)) {
            languageInstruction = "Please answer in English";
        }

        String promptTypeDesc = "系统提示词";
        if ("user".equalsIgnoreCase(promptType)) {
            promptTypeDesc = "用户提示词";
        }

        return String.format(
            "你是一个专业的提示词工程师。请分析给定的%s，提供优化建议。\n\n" +
            "待分析的提示词：\n%s\n\n" +
            "%s\n\n" +
            "请返回一个包含优化建议的列表，每个建议应该是一个独立的、具体的改进点。" +
            "请将结果以JSON数组格式返回，例如：[\"建议1\", \"建议2\", \"建议3\"]",
            promptTypeDesc, promptToAnalyze, languageInstruction
        );
    }

    /**
     * 构建应用优化建议提示词
     */
    private String buildApplyOptimizationPrompt(String originalPrompt, List<String> advice, String promptType, String language) {
        String languageInstruction = "请用中文回答";
        if ("en".equalsIgnoreCase(language)) {
            languageInstruction = "Please answer in English";
        }

        String promptTypeDesc = "系统提示词";
        if ("user".equalsIgnoreCase(promptType)) {
            promptTypeDesc = "用户提示词";
        }

        String adviceStr = String.join("\n", advice);

        return String.format(
            "你是一个专业的提示词工程师。请将给定的优化建议应用到原始的%s中，生成优化后的提示词。\n\n" +
            "原始提示词：\n%s\n\n" +
            "优化建议：\n%s\n\n" +
            "%s\n\n" +
            "请返回应用优化建议后的提示词，不要包含任何其他解释或标记。",
            promptTypeDesc, originalPrompt, adviceStr, languageInstruction
        );
    }
    
    /**
     * 解析列表响应
     */
    private List<String> parseListResponse(String response) {
        try {
            // 尝试解析JSON数组格式
            String jsonStr = extractJsonArray(response);
            if (jsonStr != null && !jsonStr.isEmpty()) {
                return parseJsonArray(jsonStr);
            }
            
            // 如果JSON解析失败，尝试按行解析
            String[] lines = response.split("\n");
            List<String> result = java.util.Arrays.asList(lines);
            // 过滤掉空行和编号
            return result.stream()
                    .map(line -> line.replaceAll("^\\d+\\.\\s*|^[-*]\\s*", "").trim())
                    .filter(line -> !line.isEmpty())
                    .toList();
        } catch (Exception e) {
            log.warn("无法解析列表响应，使用原始内容", e);
            // 如果所有解析都失败，返回单个元素的列表
            return List.of(response);
        }
    }

    /**
     * 提取JSON数组字符串
     */
    private String extractJsonArray(String text) {
        // 匹配方括号包围的JSON数组
        Pattern pattern = Pattern.compile("\\[[\\s\\S]*\\]");
        Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            return matcher.group(0);
        }
        
        return null;
    }

    /**
     * 解析JSON数组字符串为列表
     */
    private List<String> parseJsonArray(String jsonStr) {
        try {
            // 简单解析JSON数组，实际应用中建议使用Jackson或Gson
            jsonStr = jsonStr.trim();
            if (jsonStr.startsWith("[") && jsonStr.endsWith("]")) {
                jsonStr = jsonStr.substring(1, jsonStr.length() - 1);
            }
            
            java.util.List<String> result = new java.util.ArrayList<>();
            // 按逗号分割，但需要处理引号内的逗号
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"([^\"]*)\"");
            java.util.regex.Matcher matcher = pattern.matcher(jsonStr);
            
            int lastIndex = 0;
            while (matcher.find()) {
                String item = matcher.group(1).replace("\\\"", "\"");
                result.add(item);
            }
            
            // 如果没有匹配到JSON格式，尝试简单分割
            if (result.isEmpty()) {
                String[] items = jsonStr.split(",\\s*");
                for (String item : items) {
                    item = item.trim();
                    if (item.startsWith("\"") && item.endsWith("\"")) {
                        item = item.substring(1, item.length() - 1);
                    }
                    item = item.replace("\\\"", "\"");
                    if (!item.isEmpty()) {
                        result.add(item);
                    }
                }
            }
            
            return result;
        } catch (Exception e) {
            log.warn("JSON数组解析失败", e);
            // 如果JSON解析失败，返回空列表
            return List.of();
        }
    }
}
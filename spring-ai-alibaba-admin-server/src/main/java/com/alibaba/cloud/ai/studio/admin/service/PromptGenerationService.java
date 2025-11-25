package com.alibaba.cloud.ai.studio.admin.service;

import com.alibaba.cloud.ai.studio.admin.dto.response.PromptGenerationResponse;
import com.alibaba.cloud.ai.studio.admin.dto.request.PromptGenerationRequest;
import reactor.core.publisher.Flux;

public interface PromptGenerationService {
    /**
     * 生成提示词
     * @param request 生成请求
     * @return 生成的提示词响应
     */
    PromptGenerationResponse generatePrompt(PromptGenerationRequest request);

    /**
     * 流式生成提示词
     * @param request 生成请求
     * @return 流式响应
     */
    Flux<PromptGenerationResponse> generatePromptStream(PromptGenerationRequest request);
}
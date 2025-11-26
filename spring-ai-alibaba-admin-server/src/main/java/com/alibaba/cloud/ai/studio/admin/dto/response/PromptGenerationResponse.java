package com.alibaba.cloud.ai.studio.admin.dto.response;

import lombok.Data;

@Data
public class PromptGenerationResponse {

    /**
     * 关键意图信息
     */
    private String keyIntent;

    /**
     * 初版提示词
     */
    private String initialPrompt;

    /**
     * 最终提示词
     */
    private String finalPrompt;
}
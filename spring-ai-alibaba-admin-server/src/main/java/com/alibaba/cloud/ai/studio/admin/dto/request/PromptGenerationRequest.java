package com.alibaba.cloud.ai.studio.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PromptGenerationRequest {

    /**
     * 输入的提示词需求描述
     */
    @NotBlank(message = "输入提示词不能为空")
    private String inputPrompt;
}
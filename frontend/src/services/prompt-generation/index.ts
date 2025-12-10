import { request } from '../../utils/request';
import { API_PATH } from '../../services/const';

// 提示词生成相关的API接口
export interface GeneratePromptParams {
  description: string;
  language: string;
  model?: string;
  variables?: string[];
}

export interface GenerateThinkingPointsParams extends GeneratePromptParams {
  thinkingPoints?: string[];
}

export interface GenerateOptimizationAdviceParams {
  promptToAnalyze: string;
  promptType: 'system' | 'user';
  language: string;
  model?: string;
  variables?: string[];
}

export interface ApplyOptimizationParams {
  originalPrompt: string;
  advice: string[];
  promptType: 'system' | 'user';
  language: string;
  model?: string;
  variables?: string[];
}

// 获取系统提示词关键指令
export async function getSystemPromptThinkingPoints(params: GenerateThinkingPointsParams) {
  return request<string[]>(`${API_PATH}/prompt/generate/thinking-points`, {
    method: 'POST',
    data: params,
  });
}

// 生成系统提示词
export async function generateSystemPrompt(params: GeneratePromptParams) {
  return request<string>(`${API_PATH}/prompt/generate/system-prompt`, {
    method: 'POST',
    data: params,
  });
}

// 获取优化建议
export async function getOptimizationAdvice(params: GenerateOptimizationAdviceParams) {
  return request<string[]>(`${API_PATH}/prompt/generate/optimization-advice`, {
    method: 'POST',
    data: params,
  });
}

// 应用优化建议
export async function applyOptimizationAdvice(params: ApplyOptimizationParams) {
  return request<string>(`${API_PATH}/prompt/generate/apply-optimization`, {
    method: 'POST',
    data: params,
  });
}

// 完整的提示词生成流程
export async function generateCompletePrompt(params: GeneratePromptParams) {
  return request<{
    thinkingPoints: string[];
    initialPrompt: string;
    optimizationAdvice: string[];
    finalPrompt: string;
  }>(`${API_PATH}/prompt/generate/complete`, {
    method: 'POST',
    data: params,
  });
}
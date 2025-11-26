import request from '../request';

export default {
  /**
   * 生成提示词
   */
  generatePrompt(data) {
    return request({
      url: '/api/prompt/generate',
      method: 'POST',
      data
    });
  },

  /**
   * 流式生成提示词
   */
  generatePromptStream(data) {
    return request({
      url: '/api/prompt/generate-stream',
      method: 'POST',
      data
    });
  }
};
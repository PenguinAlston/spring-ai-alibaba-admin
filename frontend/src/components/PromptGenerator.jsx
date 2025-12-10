import React, { useState } from 'react';
import { usePromptStore } from '../stores/promptStore';
import { 
  getSystemPromptThinkingPoints,
  generateSystemPrompt,
  getOptimizationAdvice,
  applyOptimizationAdvice,
  generateCompletePrompt
} from '../services/prompt-generation/index.ts';

const PromptGenerator = () => {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('zh');
  const [thinkingPoints, setThinkingPoints] = useState([]);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [advice, setAdvice] = useState([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [loadingStep, setLoadingStep] = useState(null);
  const [automationStatus, setAutomationStatus] = useState(null);
  const [error, setError] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [openStep, setOpenStep] = useState(1);
  const [copiedInitial, setCopiedInitial] = useState(false);
  const [copiedAdvice, setCopiedAdvice] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);

  const { savePrompt } = usePromptStore();

  const isBusy = loadingStep !== null;

  // 重置状态
  const resetState = () => {
    setThinkingPoints([]);
    setInitialPrompt('');
    setAdvice([]);
    setFinalPrompt('');
    setCompletedSteps([]);
    setError(null);
    setAutomationStatus(null);
  };

  // 获取关键指令
  const handleGetPoints = async () => {
    if (!description.trim()) return;

    try {
      setLoadingStep(1);
      resetState();
      setOpenStep(1);

      const response = await getSystemPromptThinkingPoints({
        description,
        language,
        variables: []
      });
      
      setThinkingPoints(response.data || []);
      setCompletedSteps([1]);
      setOpenStep(1);
    } catch (err) {
      setError(err.message || '获取关键指令失败');
    } finally {
      setLoadingStep(null);
    }
  };

  // 自动生成
  const handleAutomate = async () => {
    if (!description.trim()) return;

    try {
      setLoadingStep(0);
      resetState();
      setOpenStep(1);

      // 步骤1: 生成关键指令
      setAutomationStatus('步骤 1/4: 生成关键指令...');
      const thinkingPointsResponse = await getSystemPromptThinkingPoints({
        description,
        language,
        variables: []
      });
      const points = thinkingPointsResponse.data || [];
      setThinkingPoints(points);
      setCompletedSteps([1]);

      // 步骤2: 生成初始提示词
      setAutomationStatus('步骤 2/4: 生成初始提示词...');
      const initialResponse = await generateSystemPrompt({
        description,
        language,
        variables: [],
        thinkingPoints: points
      });
      const initial = initialResponse.data || '';
      setInitialPrompt(initial);
      setCompletedSteps([1, 2]);

      // 步骤3: 获取优化建议
      setAutomationStatus('步骤 3/4: 获取优化建议...');
      const adviceResponse = await getOptimizationAdvice({
        promptToAnalyze: initial,
        promptType: 'system',
        language,
        variables: []
      });
      const adviceResult = adviceResponse.data || [];
      setAdvice(adviceResult);
      setCompletedSteps([1, 2, 3]);

      // 步骤4: 生成最终提示词
      setAutomationStatus('步骤 4/4: 生成最终提示词...');
      const finalResponse = await applyOptimizationAdvice({
        originalPrompt: initial,
        advice: adviceResult,
        promptType: 'system',
        language,
        variables: []
      });
      const final = finalResponse.data || '';
      setFinalPrompt(final);
      setCompletedSteps([1, 2, 3, 4]);
      setOpenStep(4);
      setAutomationStatus(null);
    } catch (err) {
      setError(err.message || '自动生成失败');
      setAutomationStatus(null);
    } finally {
      setLoadingStep(null);
    }
  };

  // 生成初始提示词
  const handleGenerateInitial = async () => {
    if (!thinkingPoints.length) return;

    try {
      setLoadingStep(2);

      const response = await generateSystemPrompt({
        description,
        language,
        variables: [],
        thinkingPoints
      });
      const initial = response.data || '';
      setInitialPrompt(initial);
      setCompletedSteps(prev => [...prev, 2]);

      // 自动获取优化建议
      const adviceResponse = await getOptimizationAdvice({
        promptToAnalyze: initial,
        promptType: 'system',
        language,
        variables: []
      });
      const adviceResult = adviceResponse.data || [];
      setAdvice(adviceResult);
      setCompletedSteps(prev => [...prev, 3]);

      // 自动生成最终提示词
      const finalResponse = await applyOptimizationAdvice({
        originalPrompt: initial,
        advice: adviceResult,
        promptType: 'system',
        language,
        variables: []
      });
      const final = finalResponse.data || '';
      setFinalPrompt(final);
      setCompletedSteps(prev => [...prev, 4]);
    } catch (err) {
      setError(err.message || '生成初始提示词失败');
    } finally {
      setLoadingStep(null);
    }
  };

  // 应用建议
  const handleApplyAdvice = async () => {
    if (!initialPrompt || !advice.length) return;

    try {
      setLoadingStep(4);

      const response = await applyOptimizationAdvice({
        originalPrompt: initialPrompt,
        advice,
        promptType: 'system',
        language,
        variables: []
      });
      const final = response.data || '';
      setFinalPrompt(final);
      if (!completedSteps.includes(4)) {
        setCompletedSteps(prev => [...prev, 4]);
      }
      setOpenStep(4);
    } catch (err) {
      setError(err.message || '应用建议失败');
    } finally {
      setLoadingStep(null);
    }
  };

  // 添加关键指令
  const addThinkingPoint = () => {
    setThinkingPoints(prev => [...prev, '']);
  };

  // 添加优化建议
  const addAdvice = () => {
    setAdvice(prev => [...prev, '']);
  };

  // 更新关键指令
  const updateThinkingPoint = (index, value) => {
    setThinkingPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = value;
      return newPoints;
    });
  };

  // 更新优化建议
  const updateAdvice = (index, value) => {
    setAdvice(prev => {
      const newAdvice = [...prev];
      newAdvice[index] = value;
      return newAdvice;
    });
  };

  // 复制到剪贴板
  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 保存提示词
  const handleSavePrompt = async () => {
    if (!finalPrompt.trim()) {
      setError('请先生成最终提示词');
      return;
    }

    try {
      await savePrompt({
        title: `提示词_${description.slice(0, 20)}${description.length > 20 ? '...' : ''}`,
        description: description,
        requirement_report: description,
        thinking_points: thinkingPoints,
        initial_prompt: initialPrompt,
        advice: advice,
        final_prompt: finalPrompt,
        language: language,
        format: 'markdown',
        tags: []
      });
      alert('提示词保存成功！');
    } catch (err) {
      setError(err.message || '保存失败');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">系统提示词生成器</h2>
        <p className="text-sm text-gray-600">按照GPrompt方式生成高质量AI系统提示词</p>
      </div>

      {/* 用户输入区域 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI角色描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请描述您希望AI扮演的角色和主要任务..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="4"
          />
        </div>

        {/* 语言选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输出语言
          </label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="zh">中文</option>
            <option value="en">英文</option>
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-3">
          <button
            onClick={handleGetPoints}
            disabled={isBusy || !description.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingStep === 1 ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                获取关键指令...
              </span>
            ) : (
              <span>获取关键指令</span>
            )}
          </button>

          <button
            onClick={handleAutomate}
            disabled={isBusy || !description.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingStep === 0 ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                自动生成中...
              </span>
            ) : (
              <span>自动生成提示词</span>
            )}
          </button>
        </div>

        {/* 自动化进度显示 */}
        {automationStatus && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-blue-700">{automationStatus}</p>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* 步骤1: 关键指令 */}
      {completedSteps.includes(1) && (
        <div className="mt-6">
          <div className="border rounded-lg">
            <div 
              onClick={() => setOpenStep(openStep === 1 ? 0 : 1)}
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 rounded-t-lg"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-3">
                  ✓
                </div>
                <h3 className="font-medium text-gray-800">步骤1: 关键指令</h3>
              </div>
              <div className="text-gray-500">
                {openStep === 1 ? '−' : '+'}
              </div>
            </div>
            
            {openStep === 1 && (
              <div className="p-4 border-t">
                <div className="space-y-2">
                  {thinkingPoints.map((point, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-gray-500 mr-2">•</span>
                      <input
                        value={point}
                        onChange={(e) => updateThinkingPoint(index, e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={addThinkingPoint}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + 添加指令
                    </button>
                    
                    <button
                      onClick={handleGenerateInitial}
                      disabled={loadingStep === 2}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingStep === 2 ? (
                        <span className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          生成初始提示词...
                        </span>
                      ) : (
                        <span>生成初始提示词</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 步骤2: 初始提示词 */}
      {completedSteps.includes(2) && (
        <div className="mt-4">
          <div className="border rounded-lg">
            <div 
              onClick={() => setOpenStep(openStep === 2 ? 0 : 2)}
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 rounded-t-lg"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-3">
                  ✓
                </div>
                <h3 className="font-medium text-gray-800">步骤2: 初始提示词</h3>
              </div>
              <div className="text-gray-500">
                {openStep === 2 ? '−' : '+'}
              </div>
            </div>
            
            {openStep === 2 && (
              <div className="p-4 border-t">
                <div className="space-y-4">
                  <textarea
                    value={initialPrompt}
                    onChange={(e) => setInitialPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="8"
                  />

                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        copyToClipboard(initialPrompt);
                        setCopiedInitial(true);
                        setTimeout(() => setCopiedInitial(false), 2000);
                      }}
                      disabled={!initialPrompt || initialPrompt.trim() === ''}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copiedInitial ? '已复制!' : '复制'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 步骤3: 优化建议 */}
      {completedSteps.includes(3) && (
        <div className="mt-4">
          <div className="border rounded-lg">
            <div 
              onClick={() => setOpenStep(openStep === 3 ? 0 : 3)}
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 rounded-t-lg"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-3">
                  ✓
                </div>
                <h3 className="font-medium text-gray-800">步骤3: 优化建议</h3>
              </div>
              <div className="text-gray-500">
                {openStep === 3 ? '−' : '+'}
              </div>
            </div>
            
            {openStep === 3 && (
              <div className="p-4 border-t">
                <div className="space-y-2">
                  {advice.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-gray-500 mr-2">•</span>
                      <input
                        value={item}
                        onChange={(e) => updateAdvice(index, e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => {
                        copyToClipboard(advice.join('\n'));
                        setCopiedAdvice(true);
                        setTimeout(() => setCopiedAdvice(false), 2000);
                      }}
                      disabled={!advice || advice.length === 0 || advice.every(a => !a || a.trim() === '')}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copiedAdvice ? '已复制!' : '复制建议'}
                    </button>
                    
                    <button
                      onClick={handleApplyAdvice}
                      disabled={loadingStep === 4}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingStep === 4 ? (
                        <span className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          应用建议...
                        </span>
                      ) : (
                        <span>应用建议</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 步骤4: 最终提示词 */}
      {completedSteps.includes(4) && (
        <div className="mt-4">
          <div className="border rounded-lg">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
              <div 
                onClick={() => setOpenStep(openStep === 4 ? 0 : 4)}
                className="flex items-center cursor-pointer hover:bg-gray-100 -m-4 p-4 flex-1"
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-3">
                    ✓
                  </div>
                  <h3 className="font-medium text-gray-800">步骤4: 最终提示词</h3>
                </div>
                <div className="text-gray-500 ml-2">
                  {openStep === 4 ? '−' : '+'}
                </div>
              </div>
              
            </div>
            
            {openStep === 4 && (
              <div className="p-4 border-t">
                <div className="space-y-4">
                  <textarea
                    value={finalPrompt}
                    onChange={(e) => setFinalPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="12"
                  />

                  <div className="flex justify-between">
                    <button
                      onClick={handleSavePrompt}
                      disabled={!finalPrompt || finalPrompt.trim() === ''}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      保存最终提示词
                    </button>
                    <button
                      onClick={() => {
                        copyToClipboard(finalPrompt);
                        setCopiedFinal(true);
                        setTimeout(() => setCopiedFinal(false), 2000);
                      }}
                      disabled={!finalPrompt || finalPrompt.trim() === ''}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copiedFinal ? '已复制!' : '复制最终提示词'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptGenerator;
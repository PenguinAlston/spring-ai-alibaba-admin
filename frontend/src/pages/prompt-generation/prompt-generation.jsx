import React, { useState } from 'react';
import { Card, Input, Button, Space, Typography, Steps, Alert, Spin } from 'antd';
import { SendOutlined, SyncOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PromptGenerationPage = () => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleGeneratePrompt = async () => {
    if (!inputPrompt.trim()) {
      setError('请输入提示词内容');
      return;
    }

    setLoading(true);
    setError(null);
    setIsStreaming(true);

    try {
      // 使用流式API避免超时问题
      const response = await fetch('/api/prompt/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputPrompt: inputPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // 查找完整的JSON对象
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留不完整的行

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.code === 200 && data.data) {
                setGeneratedData(data.data);
              } else if (data.code !== undefined && data.code !== 200) {
                throw new Error(data.message || '生成提示词失败');
              }
            } catch (e) {
              console.error('解析流式响应失败:', e);
            }
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.code === 200 && data.data) {
            setGeneratedData(data.data);
          } else if (data.code !== undefined && data.code !== 200) {
            throw new Error(data.message || '生成提示词失败');
          }
        } catch (e) {
          console.error('解析流式响应失败:', e);
        }
      }
    } catch (err) {
      console.error('生成提示词错误:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleClear = () => {
    setInputPrompt('');
    setGeneratedData(null);
    setError(null);
  };

  // 步骤数据
  const steps = generatedData ? [
    {
      title: '关键意图信息',
      description: generatedData.keyIntent,
    },
    {
      title: '初版提示词',
      description: generatedData.initialPrompt,
    },
    {
      title: '最终提示词',
      description: generatedData.finalPrompt,
    }
  ] : [];

  return (
    <div className="p-6">
      <Title level={2} className="mb-6 text-gray-800">
        提示词生成
      </Title>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左半部分 - 输入区域 */}
        <Card 
          title="输入提示词" 
          className="shadow-sm rounded-lg border border-gray-200"
          extra={
            <Space>
              <Button 
                icon={<SyncOutlined spin={loading} />} 
                onClick={handleGeneratePrompt}
                loading={loading}
                disabled={loading}
              >
                生成提示词
              </Button>
              <Button onClick={handleClear}>
                清空
              </Button>
            </Space>
          }
        >
          <TextArea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="请输入您的需求描述，例如：'创建一个用于分析用户评论情感的提示词'"
            rows={12}
            className="mb-4"
            disabled={loading}
          />
          
          <div className="text-sm text-gray-500">
            <Paragraph type="secondary">
              请输入您对提示词的需求描述，系统将基于您的描述生成结构化的提示词。
            </Paragraph>
          </div>
        </Card>

        {/* 右半部分 - 生成结果 */}
        <Card 
          title="生成的提示词" 
          className="shadow-sm rounded-lg border border-gray-200"
        >
          {error && (
            <Alert
              message="错误"
              description={error}
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          {isStreaming && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Spin size="large" className="mb-4" />
              <Title level={4} className="text-blue-600">
                正在生成提示词...
              </Title>
              <Text type="secondary">
                AI正在分析您的需求并生成高质量的提示词，请稍候
              </Text>
            </div>
          )}

          {generatedData && !isStreaming && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Title level={4} className="text-blue-700 mb-3">
                  生成过程
                </Title>
                <Steps
                  current={2}
                  direction="vertical"
                  size="small"
                  items={steps.map((step, index) => ({
                    title: step.title,
                    description: (
                      <div className="mt-2">
                        <Text code className="text-sm break-words whitespace-pre-wrap">
                          {step.description}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <Title level={4} className="text-green-700 mb-3">
                  最终结果
                </Title>
                <div className="bg-white p-4 rounded border border-gray-200">
                  <Text strong className="block mb-2">
                    最终提示词:
                  </Text>
                  <Paragraph 
                    className="whitespace-pre-wrap break-words" 
                    copyable={{ text: generatedData.finalPrompt }}
                  >
                    {generatedData.finalPrompt}
                  </Paragraph>
                </div>
              </div>
            </div>
          )}

          {!generatedData && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
              <SendOutlined className="text-4xl mb-4 text-gray-300" />
              <Title level={4} className="text-gray-400">
                尚未生成提示词
              </Title>
              <Text type="secondary">
                请在左侧输入您的需求，然后点击"生成提示词"按钮
              </Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PromptGenerationPage;
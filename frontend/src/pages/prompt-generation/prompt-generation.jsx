import React from 'react';
import PromptGenerator from '../../components/PromptGenerator';

const PromptGenerationPage = () => {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">系统提示词生成器</h1>
        <PromptGenerator />
      </div>
    </div>
  );
};

export default PromptGenerationPage;
import React from 'react';
import { VariableInput } from './common';
import { BookOpen, Settings2, Database } from 'lucide-react';

interface KnowledgeRetrievalConfigProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

const MOCK_DATASETS = [
  { id: 'ds_1', name: '产品使用手册' },
  { id: 'ds_2', name: '公司内部政策' },
  { id: 'ds_3', name: '技术文档库' },
  { id: 'ds_4', name: '常见问题答疑' },
];

const KnowledgeRetrievalConfig: React.FC<KnowledgeRetrievalConfigProps> = ({ config, onConfigChange }) => {
  const currentConfig = {
    query: config?.query || '',
    dataset_ids: config?.dataset_ids || [],
    top_k: config?.top_k || 3,
    score_threshold: config?.score_threshold || 0.5,
    retrieval_mode: config?.retrieval_mode || 'semantic',
  };

  const handleDatasetChange = (datasetId: string) => {
    const newDatasetIds = currentConfig.dataset_ids.includes(datasetId)
      ? currentConfig.dataset_ids.filter((id: string) => id !== datasetId)
      : [...currentConfig.dataset_ids, datasetId];
    onConfigChange('dataset_ids', newDatasetIds);
  };

  return (
    <div className="space-y-4">
      {/* Dataset Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Database size={16} className="text-indigo-500" />
          选择知识库
          <span className="text-xs text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            value=""
            onChange={(e) => {
              if (e.target.value) handleDatasetChange(e.target.value);
            }}
          >
            <option value="">添加知识库...</option>
            {MOCK_DATASETS.filter(ds => !currentConfig.dataset_ids.includes(ds.id)).map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
        </div>
        
        {/* Selected Datasets Tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {currentConfig.dataset_ids.map((dsId: string) => {
            const ds = MOCK_DATASETS.find(d => d.id === dsId);
            return (
              <div key={dsId} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs">
                <span>{ds?.name || dsId}</span>
                <button 
                  onClick={() => handleDatasetChange(dsId)}
                  className="hover:text-indigo-900 font-bold"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Query Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          查询关键词
          <span className="text-xs text-rose-500">*</span>
        </label>
        <VariableInput
          value={currentConfig.query}
          onChange={(val) => onConfigChange('query', val)}
          placeholder="请输入用户问题或关键词..."
        />
        <p className="text-xs text-slate-500">
          检索模型将基于此输入在知识库中查找相关内容。
        </p>
      </div>

      <hr className="border-slate-100" />

      {/* Retrieval Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Settings2 size={16} />
          <span>检索设置</span>
        </div>

        {/* Retrieval Mode */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">检索模式</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            value={currentConfig.retrieval_mode}
            onChange={(e) => onConfigChange('retrieval_mode', e.target.value)}
          >
            <option value="semantic">语义检索 (Vector Search)</option>
            <option value="full_text">全文检索 (Full-Text Search)</option>
            <option value="hybrid">混合检索 (Hybrid Search)</option>
          </select>
        </div>

        {/* Top K */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-slate-600">Top K</label>
            <span className="text-xs text-slate-500">{currentConfig.top_k}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            value={currentConfig.top_k}
            onChange={(e) => onConfigChange('top_k', parseInt(e.target.value))}
          />
        </div>

        {/* Score Threshold */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-slate-600">相似度阈值</label>
            <span className="text-xs text-slate-500">{currentConfig.score_threshold}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            value={currentConfig.score_threshold}
            onChange={(e) => onConfigChange('score_threshold', parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeRetrievalConfig;

import React from 'react';
import { VariableInput } from './common';
import { Settings2 } from 'lucide-react';

interface DocumentExtractorConfigProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

const DocumentExtractorConfig: React.FC<DocumentExtractorConfigProps> = ({ config, onConfigChange }) => {
  const currentConfig = {
    file_url: config?.file_url || '',
    extraction_mode: config?.extraction_mode || 'text',
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          输入文件
          <span className="text-xs text-rose-500">*</span>
        </label>
        <VariableInput
          value={currentConfig.file_url}
          onChange={(val) => onConfigChange('file_url', val)}
          placeholder="请输入文件URL或选择文件变量..."
        />
        <p className="text-xs text-slate-500">
          支持 PDF, DOCX, TXT, MD 等格式文件。
        </p>
      </div>

      <hr className="border-slate-100" />

      {/* Extraction Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Settings2 size={16} />
          <span>提取设置</span>
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">提取模式</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            value={currentConfig.extraction_mode}
            onChange={(e) => onConfigChange('extraction_mode', e.target.value)}
          >
            <option value="text">纯文本 (Plain Text)</option>
            <option value="markdown">Markdown 格式</option>
            <option value="json">结构化数据 (JSON)</option>
          </select>
          <p className="text-xs text-slate-400">
            选择提取后的数据格式。Markdown 模式将保留标题、列表等格式。
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentExtractorConfig;

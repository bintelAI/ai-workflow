import React from 'react';
import { Bot } from 'lucide-react';
import { VariableSelector } from './common';
import { AIButton } from './common';

interface LLMConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
    loadingField: string | null;
    onAIGenerate: (field: string, isConfig: boolean) => void;
}

export const LLMConfig: React.FC<LLMConfigProps> = ({ config, onConfigChange, loadingField, onAIGenerate }) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">模型选择</label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    value={config?.model || 'gpt-4'}
                    onChange={(e) => onConfigChange('model', e.target.value)}
                >
                    <option value="gpt-4">GPT-4 Turbo</option>
                    <option value="gpt-3.5">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3 Opus</option>
                    <option value="gemini-pro">Gemini Pro</option>
                </select>
            </div>
            <div>
                 <label className="block text-xs font-medium text-slate-500 mb-2 uppercase flex items-center justify-between">
                     <span>温度系数 (Temperature)</span>
                     <span className="text-slate-900 font-mono">{config?.temperature || 0.7}</span>
                 </label>
                 <input 
                     type="range" 
                     min="0" max="1" step="0.1"
                     className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                     value={config?.temperature || 0.7}
                     onChange={(e) => onConfigChange('temperature', parseFloat(e.target.value))}
                 />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                     <label className="block text-xs font-medium text-slate-500 uppercase">系统提示词 (System)</label>
                     <AIButton field="systemPrompt" isConfig loadingField={loadingField} onGenerate={onAIGenerate} />
                </div>
                <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs resize-y"
                    rows={3}
                    placeholder="设定 AI 的角色和行为准则..."
                    value={config?.systemPrompt || ''}
                    onChange={(e) => onConfigChange('systemPrompt', e.target.value)}
                />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                     <label className="block text-xs font-medium text-slate-500 uppercase">用户提示词 (User)</label>
                     <AIButton field="userPrompt" isConfig loadingField={loadingField} onGenerate={onAIGenerate} />
                </div>
                <div className="flex flex-col gap-2">
                    <textarea
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs resize-y"
                        rows={4}
                        placeholder="输入具体任务..."
                        value={config?.userPrompt || ''}
                        onChange={(e) => onConfigChange('userPrompt', e.target.value)}
                    />
                    <div className="w-full">
                        <VariableSelector 
                            value="" 
                            onChange={(val) => onConfigChange('userPrompt', (config?.userPrompt || '') + ` {{${val}}}`)}
                            placeholder="插入变量..." 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

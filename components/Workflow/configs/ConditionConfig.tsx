import React from 'react';
import { GitFork } from 'lucide-react';
import { VariableSelector } from './common';

interface ConditionConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const ConditionConfig: React.FC<ConditionConfigProps> = ({ config, onConfigChange }) => {
    return (
        <div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4 text-xs text-amber-700">
               <GitFork className="inline-block w-3 h-3 mr-1" />
               若表达式结果为 Truthy，则执行“是”分支；否则执行“否”分支。
            </div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">条件表达式 (JavaScript)</label>
            <div className="w-full mb-2">
               <VariableSelector 
                   value="" 
                   onChange={(val) => onConfigChange('expression', (config?.expression || '') + ` ${val}`)}
                   placeholder="插入变量..."
               />
            </div>
            <textarea
               className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-700 bg-white"
               rows={3}
               placeholder="e.g. payload.amount > 5000"
               value={config?.expression || ''}
               onChange={(e) => onConfigChange('expression', e.target.value)}
            />
        </div>
    );
};

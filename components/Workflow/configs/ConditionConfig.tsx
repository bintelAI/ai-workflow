import React, { useState } from 'react';
import { GitFork, Plus, Trash2, Settings2, Code2, Layers } from 'lucide-react';
import { VariableSelector, VariableInput } from './common';
import { ConditionBuilder, ConditionGroup } from './ConditionBuilder';

interface ConditionConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const ConditionConfig: React.FC<ConditionConfigProps> = ({ config, onConfigChange }) => {
    const [mode, setMode] = useState<'builder' | 'manual'>(config?.conditionGroups ? 'builder' : 'manual');

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-700 flex items-start gap-2">
               <GitFork className="w-4 h-4 mt-0.5 shrink-0" />
               <p>若表达式结果为 Truthy，则执行“是”分支；否则执行“否”分支。您可以使用可视化编辑器或直接编写 JavaScript。</p>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
                    <button
                        onClick={() => setMode('builder')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                            mode === 'builder' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Layers size={13} />
                        可视化编辑器
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                            mode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Code2 size={13} />
                        JS 表达式
                    </button>
                </div>
            </div>

            {mode === 'builder' ? (
                <ConditionBuilder 
                    conditionGroups={config.conditionGroups || []}
                    onChange={(groups) => onConfigChange('conditionGroups', groups.length > 0 ? groups : undefined)}
                />
            ) : (

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">JavaScript 表达式</label>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Code2 size={10} />
                            <span>Return boolean</span>
                        </div>
                    </div>
                    <div className="w-full">
                        <VariableSelector 
                            value="" 
                            onChange={(val) => onConfigChange('expression', (config?.expression || '') + ` ${val}`)}
                            placeholder="插入变量..."
                        />
                    </div>
                    <textarea
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]"
                        placeholder="e.g. payload.amount > 5000"
                        value={config?.expression || ''}
                        onChange={(e) => onConfigChange('expression', e.target.value)}
                    />
                    <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 italic">
                            提示: 系统会自动处理变量占位符，例如 {"{{payload.id}}"} 将被视为 payload.id。
                        </div>
                        <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-500 font-mono space-y-1">
                            <div>• payload.amount {'>'} 5000</div>
                            <div>• payload.status === 'active' && payload.role === 'admin'</div>
                            <div>• nodes.api_1.data.success === true</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

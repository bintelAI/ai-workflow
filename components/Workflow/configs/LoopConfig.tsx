import React from 'react';
import { Repeat, ArrowRightFromLine, LogOut } from 'lucide-react';
import { VariableSelector } from './common';

interface LoopConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const LoopConfig: React.FC<LoopConfigProps> = ({ config, onConfigChange }) => {
    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start gap-3">
                <div className="bg-white p-2 rounded-md border border-indigo-200 shadow-sm">
                     <Repeat className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-indigo-900">循环节点 (Iterator)</h4>
                    <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                        遍历数组，并聚合内部节点的执行结果。
                        内部节点使用 <code>loop.item</code> 访问当前项。
                    </p>
                </div>
            </div>

            {/* Input Configuration */}
            <div>
                 <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                     <ArrowRightFromLine size={12} className="text-indigo-500"/> 输入：目标数组
                 </label>
                 <VariableSelector 
                      value={config?.targetArray || ''}
                      onChange={(val) => onConfigChange('targetArray', val)}
                      placeholder="选择要遍历的数组 (e.g. payload.items)"
                  />
            </div>

            <div className="h-px bg-slate-100"></div>

            {/* Output Configuration (New) */}
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                     <LogOut size={12} className="text-emerald-500"/> 输出：结果聚合
                 </label>
                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 mb-2">选择循环内部的变量作为单次迭代的输出结果。节点执行结束后将返回一个包含所有结果的数组。</p>
                      <VariableSelector 
                          value={config?.exportOutput || ''}
                          onChange={(val) => onConfigChange('exportOutput', val)}
                          placeholder="选择内部输出变量..."
                      />
                 </div>
            </div>
        </div>
    );
};

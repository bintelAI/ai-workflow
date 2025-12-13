import React from 'react';
import { StopCircle, LogOut } from 'lucide-react';
import { KeyValueEditor } from './common';

interface EndConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const EndConfig: React.FC<EndConfigProps> = ({ config, onConfigChange }) => {
    return (
        <div className="space-y-4">
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 mb-2 flex items-start gap-2">
               <StopCircle className="w-5 h-5 text-rose-500 shrink-0" />
               <div>
                    <h4 className="text-xs font-bold text-rose-800">结束节点 (End)</h4>
                    <p className="text-[10px] text-rose-600 mt-1">
                        定义工作流最终返回的数据结构。若为空，则默认返回最后执行节点的输出。
                    </p>
               </div>
            </div>

            <KeyValueEditor 
               title="输出变量配置"
               description="定义返回给调用方的 JSON 字段"
               keyPlaceholder="输出字段名 (Key)"
               valuePlaceholder="映射变量 (Value)"
               items={config?.outputs || []}
               onChange={(items) => onConfigChange('outputs', items)}
               icon={LogOut}
               addButtonLabel="添加输出字段"
            />
        </div>
    );
};

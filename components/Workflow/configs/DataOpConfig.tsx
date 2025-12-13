import React from 'react';
import { Database } from 'lucide-react';
import { VariableSelector } from './common';

interface DataOpConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const DataOpConfig: React.FC<DataOpConfigProps> = ({ config, onConfigChange }) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">操作类型</label>
                <select
                   className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                   value={config?.opType || 'transform'}
                   onChange={(e) => onConfigChange('opType', e.target.value)}
                >
                    <option value="transform">数据转换 (Transform)</option>
                    <option value="filter">数据过滤 (Filter)</option>
                    <option value="aggregate">聚合统计 (Aggregate)</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">目标字段</label>
                <VariableSelector 
                    value={config?.targetField || ''}
                    onChange={(val) => onConfigChange('targetField', val)}
                />
            </div>
        </div>
    );
}
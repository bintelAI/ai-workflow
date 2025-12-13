import React from 'react';

interface DelayConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const DelayConfig: React.FC<DelayConfigProps> = ({ config, onConfigChange }) => {
    return (
        <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">时长数值</label>
                <input
                   type="number"
                   className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                   value={config?.duration || 1000}
                   onChange={(e) => onConfigChange('duration', parseInt(e.target.value))}
                />
            </div>
            <div className="w-32">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">单位</label>
                <select
                   className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                   value={config?.unit || 'ms'}
                   onChange={(e) => onConfigChange('unit', e.target.value)}
                >
                    <option value="ms">毫秒 (ms)</option>
                    <option value="s">秒 (s)</option>
                    <option value="m">分钟 (m)</option>
                </select>
            </div>
        </div>
    );
};

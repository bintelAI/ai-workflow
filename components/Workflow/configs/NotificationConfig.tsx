import React from 'react';
import { Bell } from 'lucide-react';
import { VariableSelector } from './common';

interface NotificationConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const NotificationConfig: React.FC<NotificationConfigProps> = ({ config, onConfigChange }) => {
    return (
        <div className="space-y-4">
             <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">通知渠道</label>
                 <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    value={config?.channel || 'email'}
                    onChange={(e) => onConfigChange('channel', e.target.value)}
                 >
                     <option value="email">邮件 (Email)</option>
                     <option value="slack">Slack / 飞书</option>
                     <option value="sms">短信 (SMS)</option>
                 </select>
             </div>
             <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">接收人</label>
                 <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="admin@example.com"
                    value={config?.recipient || ''}
                    onChange={(e) => onConfigChange('recipient', e.target.value)}
                 />
             </div>
             <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">消息内容模板</label>
                 <div className="flex flex-col gap-2">
                    <textarea
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs resize-y"
                        rows={4}
                        placeholder="支持使用变量 {{payload.key}}"
                        value={config?.message || ''}
                        onChange={(e) => onConfigChange('message', e.target.value)}
                    />
                    <div className="w-full">
                        <VariableSelector 
                            value="" 
                            onChange={(val) => onConfigChange('message', (config?.message || '') + ` {{${val}}}`)}
                            placeholder="插入变量..."
                        />
                    </div>
                 </div>
             </div>
        </div>
    );
};

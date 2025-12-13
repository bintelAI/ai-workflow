import React from 'react';
import { Send, User } from 'lucide-react';

interface CCConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const CCConfig: React.FC<CCConfigProps> = ({ config, onConfigChange }) => {
    return (
        <div className="space-y-4">
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-2">
                <Send className="inline-block w-3 h-3 mr-1 text-indigo-600" />
                <span className="text-xs text-indigo-700">
                    配置抄送人员和抄送方式
                </span>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                    <User size={12} className="text-indigo-500" />
                    抄送人配置
                </label>
                <div className="flex items-center gap-2">
                    <User className="text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                        placeholder="e.g. U-8821, U-9932 or 'DEPARTMENT_MANAGER'"
                        value={config?.recipient || ''}
                        onChange={(e) => onConfigChange('recipient', e.target.value)}
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">抄送方式</label>
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
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">抄送时机</label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    value={config?.timing || 'immediate'}
                    onChange={(e) => onConfigChange('timing', e.target.value)}
                >
                    <option value="immediate">立即抄送</option>
                    <option value="after_approval">审批后抄送</option>
                    <option value="on_failure">失败时抄送</option>
                </select>
            </div>
        </div>
    );
};

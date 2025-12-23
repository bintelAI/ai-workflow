import React, { useState } from 'react';
import { Database, Play, AlertCircle } from 'lucide-react';
import { VariableTextArea, AIButton } from './common';

export interface SQLConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

const MOCK_DATABASES = [
    { id: 'db_1', name: 'Main PostgreSQL (Production)', type: 'PostgreSQL' },
    { id: 'db_2', name: 'User Data (MySQL)', type: 'MySQL' },
    { id: 'db_3', name: 'Analytics (ClickHouse)', type: 'ClickHouse' },
    { id: 'db_4', name: 'Local SQLite', type: 'SQLite' },
];

export const SQLConfig: React.FC<SQLConfigProps> = ({ config, onConfigChange }) => {
    const [loadingField, setLoadingField] = useState<string | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');

    const handleGenerateSQL = async () => {
        if (!aiPrompt.trim()) return;
        
        setLoadingField('sql');
        // Mock AI Generation
        setTimeout(() => {
            const mockSQL = `-- Generated based on: ${aiPrompt}\nSELECT * FROM users \nWHERE created_at > '{{payload.start_date}}' \nAND status = 'active'\nLIMIT 100;`;
            onConfigChange('sql', mockSQL);
            setLoadingField(null);
            setAiPrompt('');
        }, 1500);
    };

    return (
        <div className="space-y-4">
            {/* Database Selection */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Database size={12} className="text-indigo-500" />
                    选择数据库
                </label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={config.databaseId || ''}
                    onChange={(e) => onConfigChange('databaseId', e.target.value)}
                >
                    <option value="" disabled>请选择数据库连接...</option>
                    {MOCK_DATABASES.map(db => (
                        <option key={db.id} value={db.id}>
                            {db.name}
                        </option>
                    ))}
                </select>
                {!config.databaseId && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <AlertCircle size={12} />
                        <span>请先选择一个数据库以执行 SQL</span>
                    </div>
                )}
            </div>

            {/* AI SQL Generation */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <span className="text-indigo-500">✨</span>
                        AI 生成 SQL
                    </label>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="描述你想查询的内容 (例如: 查询最近注册的用户)"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateSQL()}
                    />
                    <button
                        onClick={handleGenerateSQL}
                        disabled={!!loadingField || !aiPrompt.trim()}
                        className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                    >
                        {loadingField === 'sql' ? '生成中...' : '生成'}
                    </button>
                </div>
            </div>

            {/* SQL Editor */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                        SQL 语句
                    </label>
                    <span className="text-[10px] text-slate-400">支持 {"{{变量}}"}</span>
                </div>
                <VariableTextArea
                    value={config.sql || ''}
                    onChange={(val) => onConfigChange('sql', val)}
                    placeholder="SELECT * FROM table WHERE id = {{payload.id}}"
                    className="min-h-[150px] font-mono text-xs"
                    rows={8}
                />
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="rounded text-indigo-500 focus:ring-indigo-500"
                        checked={config.returnSingleRecord || false}
                        onChange={(e) => onConfigChange('returnSingleRecord', e.target.checked)}
                    />
                    <span className="text-sm text-slate-700">仅返回第一条记录</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="rounded text-indigo-500 focus:ring-indigo-500"
                        checked={config.unsafeMode || false}
                        onChange={(e) => onConfigChange('unsafeMode', e.target.checked)}
                    />
                    <div className="text-sm text-slate-700">
                        <span>开启不安全模式 (允许 DROP/DELETE)</span>
                        <p className="text-[10px] text-slate-400">慎用！可能导致数据丢失</p>
                    </div>
                </label>
            </div>
        </div>
    );
};

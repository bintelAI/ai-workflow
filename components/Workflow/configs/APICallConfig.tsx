import React, { useState, useEffect, useRef } from 'react';
import { Globe, Plus, Trash2, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react';
import { APICallConfig as APICallConfigType, QueryParam, HeaderParam } from '../../../types';

interface APICallConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

const defaultConfig: APICallConfigType = {
    method: 'GET',
    url: '',
    queryParams: [],
    headers: [],
    bodyType: 'none',
    body: '',
    auth: {
        type: 'none'
    },
    timeout: 30000,
    retry: {
        enabled: false,
        maxRetries: 3,
        delay: 1000,
        retryOnStatusCodes: [500, 502, 503, 504]
    },
    responseHandling: {
        followRedirects: true,
        parseResponse: true,
        statusCodeBranching: false
    }
};

// 变量类型定义
interface Variable {
    name: string;
    description: string;
    source: 'payload' | 'step' | 'node' | 'global';
    nodeId?: string;
}

// 合并payload中的变量到变量列表
const getVariablesFromPayload = (payload: any): Variable[] => {
    if (!payload || typeof payload !== 'object') return [];
    return Object.keys(payload).map(key => ({
        name: key,
        description: `来自请求负载的${key}`,
        source: 'payload'
    }));
};

// 合并steps中的变量到变量列表
const getVariablesFromSteps = (steps: any): Variable[] => {
    if (!steps || typeof steps !== 'object') return [];
    return Object.keys(steps).flatMap(nodeId => {
        const stepOutput = steps[nodeId];
        if (!stepOutput || typeof stepOutput !== 'object') return [];
        return Object.keys(stepOutput).map(key => ({
            name: key,
            description: `来自节点${nodeId}的${key}`,
            source: 'step',
            nodeId
        }));
    });
};

// 合并nodes中的变量到变量列表
const getVariablesFromNodes = (nodes: any): Variable[] => {
    if (!nodes || typeof nodes !== 'object') return [];
    return Object.keys(nodes).flatMap(nodeId => {
        const nodeOutput = nodes[nodeId];
        if (!nodeOutput || typeof nodeOutput !== 'object') return [];
        return Object.keys(nodeOutput).map(key => ({
            name: key,
            description: `来自节点${nodeId}的${key}`,
            source: 'node',
            nodeId
        }));
    });
};

// 全局变量列表
const globalVariables: Variable[] = [
    { name: 'payload', description: '整个请求负载', source: 'global' },
    { name: 'status', description: '状态码', source: 'global' },
    { name: 'token', description: '认证令牌', source: 'global' }
];

interface VariableSelectProps {
    onVariableSelect: (variable: string) => void;
    position: { left: number; top: number };
    onClose: () => void;
    variables: Variable[];
}

const VariableSelect: React.FC<VariableSelectProps> = ({ onVariableSelect, position, onClose, variables }) => {
    // 按来源分组变量
    const groupedVariables = variables.reduce((acc, variable) => {
        if (!acc[variable.source]) {
            acc[variable.source] = [];
        }
        acc[variable.source].push(variable);
        return acc;
    }, {} as Record<string, Variable[]>);

    // 来源名称映射
    const sourceNames: Record<string, string> = {
        payload: '请求负载',
        step: '节点输出',
        node: '节点日志',
        global: '全局变量'
    };

    return (
        <div className="fixed z-50" style={{ left: position.left, top: position.top }}>
            <div className="bg-white rounded-md shadow-xl border border-slate-200 min-w-[200px] max-w-[300px]">
                <div className="p-2 border-b border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-700">选择变量</h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                    {Object.entries(groupedVariables).map(([source, vars]) => (
                        <div key={source} className="border-b border-slate-100 last:border-b-0">
                            <div className="px-3 py-1 bg-slate-50 text-xs font-semibold text-slate-600">
                                {sourceNames[source]}
                            </div>
                            {vars.map((variable, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onVariableSelect(`{{${variable.name}}}`);
                                        onClose();
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                >
                                    <div className="font-medium">{'{{'}{variable.name}{'}}'}</div>
                                    <div className="text-xs text-slate-500">{variable.description}</div>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ParamEditor = <T extends { key: string; value: string; enabled: boolean }>({
    params,
    onParamsChange,
    availableVariables = [...globalVariables]
}: { params: T[]; onParamsChange: (params: T[]) => void; availableVariables?: Variable[] }) => {
    const [variableSelectOpen, setVariableSelectOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [selectPosition, setSelectPosition] = useState({ left: 0, top: 0 });
    const valueInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleAddParam = () => {
        onParamsChange([...params, { key: '', value: '', enabled: true } as T]);
    };

    const handleRemoveParam = (index: number) => {
        onParamsChange(params.filter((_, i) => i !== index));
    };

    const handleParamChange = (index: number, field: keyof T, value: any) => {
        const newParams = [...params];
        newParams[index] = { ...newParams[index], [field]: value };
        onParamsChange(newParams);
    };

    const handleVariableButtonClick = (index: number, event: React.MouseEvent) => {
        event.stopPropagation();
        const inputElement = valueInputRefs.current[index];
        if (inputElement) {
            const rect = inputElement.getBoundingClientRect();
            setSelectPosition({
                left: rect.right + window.scrollX,
                top: rect.top + window.scrollY
            });
            setSelectedIndex(index);
            setVariableSelectOpen(true);
        }
    };

    const handleVariableSelect = (variable: string) => {
        if (selectedIndex !== null) {
            const newParams = [...params];
            const currentValue = newParams[selectedIndex].value || '';
            // 插入变量到当前值后面
            newParams[selectedIndex].value = currentValue + variable;
            onParamsChange(newParams);
        }
    };

    // 点击外部关闭变量选择
    useEffect(() => {
        const handleClickOutside = () => {
            setVariableSelectOpen(false);
        };

        if (variableSelectOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [variableSelectOpen]);

    return (
        <div className="space-y-2 relative">
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-3 py-2 text-left font-medium text-slate-500 uppercase">键</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500 uppercase">值</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-500 uppercase">启用</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {params.map((param, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2">
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                                        value={param.key}
                                        onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                                        placeholder="键"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-1">
                                        <input
                                            ref={el => valueInputRefs.current[index] = el}
                                            type="text"
                                            className="flex-1 px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                                            value={param.value}
                                            onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                                            placeholder="值"
                                        />
                                        <button
                                            onClick={(e) => handleVariableButtonClick(index, e)}
                                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-colors"
                                            title="选择变量"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={param.enabled}
                                        onChange={(e) => handleParamChange(index, 'enabled', e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button
                                        onClick={() => handleRemoveParam(index)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                        title="删除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button
                onClick={handleAddParam}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
                <Plus size={14} />
                添加参数
            </button>
            
            {variableSelectOpen && selectedIndex !== null && (
                <VariableSelect
                    onVariableSelect={handleVariableSelect}
                    position={selectPosition}
                    onClose={() => setVariableSelectOpen(false)}
                    variables={availableVariables}
                />
            )}
        </div>
    );
};

interface TestResult {
    status: 'idle' | 'testing' | 'success' | 'error';
    response?: {
        status: number;
        data: any;
        headers: Record<string, string>;
        responseTime: number;
    };
    error?: string;
}

export const APICallConfig: React.FC<APICallConfigProps> = ({ config, onConfigChange }) => {
    const [localConfig, setLocalConfig] = useState<APICallConfigType>(defaultConfig);
    const [expandedSections, setExpandedSections] = useState({
        queryParams: false,
        headers: true,
        auth: false,
        advanced: false
    });
    const [testResult, setTestResult] = useState<TestResult>({
        status: 'idle'
    });
    const [testInput, setTestInput] = useState('');
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([...globalVariables]);

    useEffect(() => {
        // Merge incoming config with default config
        setLocalConfig({
            ...defaultConfig,
            ...config,
            queryParams: config?.queryParams || [],
            headers: config?.headers || [],
            auth: { ...defaultConfig.auth, ...config?.auth },
            retry: { ...defaultConfig.retry, ...config?.retry },
            responseHandling: { ...defaultConfig.responseHandling, ...config?.responseHandling }
        });
    }, [config]);

    // 模拟从工作流上下文中获取可用变量
    useEffect(() => {
        // 这里应该从工作流上下文获取实际的payload、steps和nodes
        // 目前使用模拟数据
        const mockPayload = { user_id: '123', username: 'testuser', email: 'test@example.com' };
        const mockSteps = {
            'node-1': { status: 'success', data: { order_id: 'ORD-001', amount: 100 } },
            'node-2': { status: 'success', data: { token: 'abc123' } }
        };
        const mockNodes = {
            'node-1': { status: 200, data: { order_id: 'ORD-001', amount: 100 } },
            'node-2': { status: 200, data: { token: 'abc123' } }
        };

        // 生成可用变量列表
        const variables = [
            ...globalVariables,
            ...getVariablesFromPayload(mockPayload),
            ...getVariablesFromSteps(mockSteps),
            ...getVariablesFromNodes(mockNodes)
        ];

        setAvailableVariables(variables);
    }, []);

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig);
        onConfigChange(key, value);
    };

    const handleQueryParamsChange = (params: QueryParam[]) => {
        handleConfigChange('queryParams', params);
    };

    const handleHeadersChange = (headers: HeaderParam[]) => {
        handleConfigChange('headers', headers);
    };

    const handleAuthChange = (authKey: string, value: any) => {
        const newAuth = { ...localConfig.auth, [authKey]: value };
        handleConfigChange('auth', newAuth);
    };

    const handleRetryChange = (retryKey: string, value: any) => {
        const newRetry = { ...localConfig.retry, [retryKey]: value };
        handleConfigChange('retry', newRetry);
    };

    const handleResponseHandlingChange = (key: string, value: any) => {
        const newResponseHandling = { ...localConfig.responseHandling, [key]: value };
        handleConfigChange('responseHandling', newResponseHandling);
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleTestAPI = async () => {
        setTestResult({ status: 'testing' });
        
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Parse test input
            let inputData = {};
            if (testInput) {
                inputData = JSON.parse(testInput);
            }
            
            // Helper function to replace variables in strings
            const replaceVariables = (str: string) => {
                if (typeof str !== 'string') return str;
                return str.replace(/\{\{(.*?)\}\}/g, (match, variableName) => {
                    const trimmedName = variableName.trim();
                    // Check if variable exists in input data
                    if (trimmedName in inputData) {
                        return inputData[trimmedName];
                    }
                    // Check if variable is "payload"
                    if (trimmedName === 'payload') {
                        return inputData;
                    }
                    // Return original match if variable not found
                    return match;
                });
            };
            
            // Build URL with query parameters
            let url = localConfig.url || 'https://api.example.com';
            url = replaceVariables(url);
            
            const enabledQueryParams = localConfig.queryParams.filter(param => param.enabled);
            if (enabledQueryParams.length > 0) {
                const queryString = new URLSearchParams(
                    enabledQueryParams.map(param => [
                        replaceVariables(param.key),
                        replaceVariables(param.value)
                    ])
                ).toString();
                url += (url.includes('?') ? '&' : '?') + queryString;
            }

            // Process headers
            const enabledHeaders = localConfig.headers.filter(header => header.enabled);
            const headersObj = enabledHeaders.reduce((acc, header) => {
                acc[replaceVariables(header.key)] = replaceVariables(header.value);
                return acc;
            }, {} as Record<string, string>);

            // Mock API call response
            const mockResponse = {
                status: 200,
                data: inputData || { success: true, message: 'API调用成功', timestamp: new Date().toISOString() },
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': Math.random().toString(36).substring(2, 15),
                    'X-Server-Time': new Date().toISOString()
                },
                responseTime: Math.floor(Math.random() * 500) + 100
            };

            setTestResult({
                status: 'success',
                response: mockResponse
            });
        } catch (error) {
            setTestResult({
                status: 'error',
                error: error instanceof Error ? error.message : '发生未知错误'
            });
        }
    };

    const formatJSON = (data: any) => {
        try {
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return String(data);
        }
    };

    return (
        <div className="space-y-4">
            {/* 基础配置 */}
            <div className="space-y-3">
                <div className="flex gap-2 items-center">
                    <div className="w-28 shrink-0">
                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">请求方法</label>
                        <select
                            className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm bg-white font-mono"
                            value={localConfig.method}
                            onChange={(e) => {
                                handleConfigChange('method', e.target.value);
                                // 根据方法更新请求体类型
                                if (['GET', 'HEAD', 'OPTIONS'].includes(e.target.value)) {
                                    handleConfigChange('bodyType', 'none');
                                } else if (localConfig.bodyType === 'none') {
                                    handleConfigChange('bodyType', 'json');
                                }
                            }}
                        >
                            <option>GET</option>
                            <option>POST</option>
                            <option>PUT</option>
                            <option>DELETE</option>
                            <option>PATCH</option>
                            <option>HEAD</option>
                            <option>OPTIONS</option>
                            <option>TRACE</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">URL</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-indigo-600"
                            placeholder="https://api.example.com/v1/..."
                            value={localConfig.url}
                            onChange={(e) => handleConfigChange('url', e.target.value)}
                        />
                    </div>
                </div>

                {/* 查询参数 */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleSection('queryParams')}
                        className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
                    >
                        <span>查询参数</span>
                        {expandedSections.queryParams ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.queryParams && (
                        <div className="p-4 bg-white">
                            <ParamEditor
                                params={localConfig.queryParams}
                                onParamsChange={handleQueryParamsChange}
                                availableVariables={availableVariables}
                            />
                        </div>
                    )}
                </div>

                {/* 请求头 */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleSection('headers')}
                        className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
                    >
                        <span>请求头</span>
                        {expandedSections.headers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.headers && (
                        <div className="p-4 bg-white">
                            <ParamEditor
                                params={localConfig.headers}
                                onParamsChange={handleHeadersChange}
                                availableVariables={availableVariables}
                            />
                        </div>
                    )}
                </div>

                {/* 请求体 */}
                {!['GET', 'HEAD', 'OPTIONS'].includes(localConfig.method) && (
                    <div className="space-y-3">
                        <div className="w-32">
                            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">请求体类型</label>
                            <select
                                className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm bg-white font-mono"
                                value={localConfig.bodyType}
                                onChange={(e) => handleConfigChange('bodyType', e.target.value)}
                            >
                                <option value="none">无</option>
                                <option value="json">JSON</option>
                                <option value="form">表单数据</option>
                                <option value="x-www-form-urlencoded">表单编码</option>
                                <option value="raw">原始数据</option>
                                <option value="binary">二进制</option>
                            </select>
                        </div>

                        {localConfig.bodyType !== 'none' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">请求体</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-slate-50 resize-y"
                                    rows={5}
                                    placeholder={localConfig.bodyType === 'json' ? '{ "key": "value" }' : ''}
                                    value={localConfig.body}
                                    onChange={(e) => handleConfigChange('body', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 认证配置 */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleSection('auth')}
                        className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
                    >
                        <span>认证配置</span>
                        {expandedSections.auth ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.auth && (
                        <div className="p-4 bg-white space-y-3">
                            <div className="w-40">
                                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">认证类型</label>
                                <select
                                    className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm bg-white font-mono"
                                    value={localConfig.auth.type}
                                    onChange={(e) => handleAuthChange('type', e.target.value)}
                                >
                                    <option value="none">无</option>
                                    <option value="basic">基础认证</option>
                                    <option value="api_key">API 密钥</option>
                                    <option value="bearer">Bearer 令牌</option>
                                    <option value="oauth2">OAuth2</option>
                                </select>
                            </div>

                            {localConfig.auth.type === 'basic' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">用户名</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm"
                                            value={localConfig.auth.username || ''}
                                            onChange={(e) => handleAuthChange('username', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">密码</label>
                                        <input
                                            type="password"
                                            className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm"
                                            value={localConfig.auth.password || ''}
                                            onChange={(e) => handleAuthChange('password', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {localConfig.auth.type === 'api_key' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">API 密钥</label>
                                        <input
                                            type="password"
                                            className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm"
                                            value={localConfig.auth.apiKey || ''}
                                            onChange={(e) => handleAuthChange('apiKey', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">密钥名称</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm"
                                                value={localConfig.auth.apiKeyName || ''}
                                                onChange={(e) => handleAuthChange('apiKeyName', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">位置</label>
                                            <select
                                                className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm bg-white"
                                                value={localConfig.auth.apiKeyLocation || 'header'}
                                                onChange={(e) => handleAuthChange('apiKeyLocation', e.target.value)}
                                            >
                                                <option value="header">请求头</option>
                                                <option value="query">查询参数</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {localConfig.auth.type === 'bearer' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">令牌</label>
                                    <input
                                        type="password"
                                        className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm"
                                        value={localConfig.auth.token || ''}
                                        onChange={(e) => handleAuthChange('token', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 高级配置 */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleSection('advanced')}
                        className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
                    >
                        <span>高级配置</span>
                        {expandedSections.advanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.advanced && (
                        <div className="p-4 bg-white space-y-4">
                            {/* 超时设置 */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">超时时间 (ms)</label>
                                <input
                                    type="number"
                                    className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm"
                                    value={localConfig.timeout}
                                    onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value) || 30000)}
                                    min="1000"
                                    max="300000"
                                />
                            </div>

                            {/* 重试配置 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="retryEnabled"
                                        checked={localConfig.retry.enabled}
                                        onChange={(e) => handleRetryChange('enabled', e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="retryEnabled" className="text-sm font-medium text-slate-700">
                                        启用重试
                                    </label>
                                </div>

                                {localConfig.retry.enabled && (
                                    <div className="space-y-3 pl-6 border-l border-slate-200">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">最大重试次数</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm"
                                                    value={localConfig.retry.maxRetries}
                                                    onChange={(e) => handleRetryChange('maxRetries', parseInt(e.target.value) || 3)}
                                                    min="1"
                                                    max="10"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">重试间隔 (ms)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm"
                                                    value={localConfig.retry.delay}
                                                    onChange={(e) => handleRetryChange('delay', parseInt(e.target.value) || 1000)}
                                                    min="100"
                                                    max="10000"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">重试状态码</label>
                                            <input
                                                type="text"
                                                className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm font-mono"
                                                placeholder="500, 502, 503, 504"
                                                value={localConfig.retry.retryOnStatusCodes.join(', ')}
                                                onChange={(e) => handleRetryChange(
                                                    'retryOnStatusCodes',
                                                    e.target.value.split(',').map(code => parseInt(code.trim())).filter(Boolean)
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 响应处理 */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-700">响应处理</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="followRedirects"
                                            checked={localConfig.responseHandling.followRedirects}
                                            onChange={(e) => handleResponseHandlingChange('followRedirects', e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="followRedirects" className="text-sm font-medium text-slate-700">
                                            跟随重定向
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="parseResponse"
                                            checked={localConfig.responseHandling.parseResponse}
                                            onChange={(e) => handleResponseHandlingChange('parseResponse', e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="parseResponse" className="text-sm font-medium text-slate-700">
                                            解析响应
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="statusCodeBranching"
                                            checked={localConfig.responseHandling.statusCodeBranching}
                                            onChange={(e) => handleResponseHandlingChange('statusCodeBranching', e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="statusCodeBranching" className="text-sm font-medium text-slate-700">
                                            状态码分支
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">提取路径 (JSONPath)</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm font-mono"
                                            placeholder="$.data.items[0].id"
                                            value={localConfig.responseHandling.extractPath || ''}
                                            onChange={(e) => handleResponseHandlingChange('extractPath', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 测试部分 */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-white">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">测试 API 调用</h4>
                    
                    {/* 测试输入 */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">测试输入 (JSON)</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-slate-50 resize-y"
                            rows={3}
                            placeholder='{ "key": "value" }'
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                        />
                    </div>

                    {/* 测试按钮 */}
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleTestAPI}
                            disabled={testResult.status === 'testing'}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testResult.status === 'testing' ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <RefreshCcw size={14} />
                            )}
                            {testResult.status === 'testing' ? '测试中...' : '测试 API 调用'}
                        </button>
                    </div>

                    {/* 测试结果 */}
                    {testResult.status !== 'idle' && (
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <h5 className="text-sm font-medium text-slate-700">测试结果</h5>
                                {testResult.status === 'success' && (
                                    <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">成功</span>
                                )}
                                {testResult.status === 'error' && (
                                    <span className="text-xs font-medium bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">错误</span>
                                )}
                            </div>
                            
                            {testResult.response && (
                                <div className="space-y-3">
                                    {/* 响应状态 */}
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-slate-50 p-2 rounded-md">
                                            <span className="text-slate-500">状态码:</span>
                                            <span className="ml-2 font-medium text-emerald-600">{testResult.response.status}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-md">
                                            <span className="text-slate-500">响应时间:</span>
                                            <span className="ml-2 font-medium">{testResult.response.responseTime} ms</span>
                                        </div>
                                    </div>

                                    {/* 响应头 */}
                                    <div>
                                        <h6 className="text-xs font-semibold text-slate-600 mb-1">响应头</h6>
                                        <div className="bg-slate-50 p-2 rounded-md text-xs font-mono text-slate-700 max-h-24 overflow-y-auto">
                                            {Object.entries(testResult.response.headers).map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="text-indigo-600">{key}:</span> {value}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 响应体 */}
                                    <div>
                                        <h6 className="text-xs font-semibold text-slate-600 mb-1">响应体</h6>
                                        <pre className="bg-slate-50 p-3 rounded-md text-xs font-mono text-slate-700 max-h-48 overflow-y-auto">
                                            {formatJSON(testResult.response.data)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {testResult.error && (
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-md text-sm text-rose-700">
                                    <div className="font-semibold mb-1">错误:</div>
                                    <div>{testResult.error}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

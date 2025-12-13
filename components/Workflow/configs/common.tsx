import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkflowStore, DEFAULT_DEV_INPUT } from '../store/useWorkflowStore';
import { WorkflowNodeType } from '../../../types';
import { 
    FileText, Hash, Calendar, ToggleLeft, Box, Plus, Trash2, ListPlus,
    ChevronDown, Repeat, PlayCircle, ArrowRightFromLine, LogOut
} from 'lucide-react';

// --- Helper: Flatten JSON object to dot notation ---
export const flattenObject = (obj: any, parentKey = '', res: any[] = []) => {
    if (!obj || typeof obj !== 'object') {
        return res;
    }

    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const propPath = parentKey ? `${parentKey}.${key}` : key;
        const displayPath = `payload.${propPath}`;
        
        let type: string = typeof value;
        if (value === null) type = 'null';
        else if (Array.isArray(value)) type = 'array';
        
        res.push({
            label: key,
            path: displayPath,
            type: type,
            value: value
        });

        if (type === 'object' && value !== null) {
            flattenObject(value, propPath, res);
        } else if (type === 'array' && value.length > 0) {
             // Handle array first item if it's an object for schema inference
             const firstItem = value[0];
             if (typeof firstItem === 'object' && firstItem !== null) {
                 flattenObject(firstItem, `${propPath}.0`, res);
             }
        }
    });
    return res;
};

// --- Variable Selector Component --- 
export interface VariableSelectorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({ value, onChange, placeholder = "选择变量..." }) => {
    const { nodes, edges, selectedNodeId } = useWorkflowStore();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 1. Get Start Node (Global Context)
    const startNode = nodes.find(n => n.type === WorkflowNodeType.START);
    
    // 2. Check if we are inside a loop
    const currentNode = nodes.find(n => n.id === selectedNodeId);
    const parentLoopNode = currentNode?.parentNode ? nodes.find(n => n.id === currentNode.parentNode && n.type === WorkflowNodeType.LOOP) : null;

    const getIconForType = (type: string) => {
        switch (type) {
            case 'string': return <FileText size={12} className="text-slate-400" />;
            case 'number': return <Hash size={12} className="text-blue-400" />;
            case 'boolean': return <ToggleLeft size={12} className="text-orange-400" />;
            case 'date': return <Calendar size={12} className="text-purple-400" />;
            case 'array': return <Box size={12} className="text-teal-400" />;
            case 'object': return <Box size={12} className="text-indigo-400" />;
            default: return <Box size={12} className="text-slate-400" />;
        }
    }

    // Generate Variables from Start Node (Parsed JSON)
    const getStartNodeVariables = () => {
        const devInput = startNode?.data.config?.devInput || DEFAULT_DEV_INPUT;
        let vars: any[] = [];
        try {
            const parsed = JSON.parse(devInput);
            vars = flattenObject(parsed);
        } catch (e) {
            vars.push({ label: '(JSON 格式错误)', path: 'payload', type: 'error' });
        }
        return vars;
    };

    // Get upstream nodes and their variables
    const getUpstreamNodeVariables = () => {
        if (!selectedNodeId || !currentNode) return [];
        
        // Find all edges that target the current node
        const incomingEdges = edges.filter(edge => edge.target === selectedNodeId);
        
        // Get unique source node IDs
        const sourceNodeIds = [...new Set(incomingEdges.map(edge => edge.source))];
        
        // Get the actual source nodes
        const sourceNodes = nodes.filter(node => sourceNodeIds.includes(node.id));
        
        // Collect variables from source nodes
        const upstreamVars: any[] = [];
        
        sourceNodes.forEach(node => {
            // Get node output variables (simulated for now, will be replaced with actual output later)
            const nodeLabel = node.data.label || getNodeTypeLabel(node.type);
            
            // Simulated output variables based on node type
            let outputVars = [];
            
            if (node.type === WorkflowNodeType.API_CALL) {
                outputVars = [
                    { label: 'API 响应', path: `nodes.${node.id}.response`, type: 'object' },
                    { label: 'API 状态码', path: `nodes.${node.id}.status`, type: 'number' },
                ];
            } else if (node.type === WorkflowNodeType.DATA_OP) {
                outputVars = [
                    { label: '处理结果', path: `nodes.${node.id}.result`, type: 'object' },
                ];
            } else if (node.type === WorkflowNodeType.SCRIPT) {
                outputVars = [
                    { label: '脚本输出', path: `nodes.${node.id}.output`, type: 'object' },
                ];
            } else if (node.type === WorkflowNodeType.LLM) {
                outputVars = [
                    { label: '模型响应', path: `nodes.${node.id}.response`, type: 'string' },
                    { label: '完整输出', path: `nodes.${node.id}.full_output`, type: 'object' },
                ];
            } else if (node.type === WorkflowNodeType.CONDITION) {
                outputVars = [
                    { label: '条件结果', path: `nodes.${node.id}.result`, type: 'boolean' },
                ];
            } else if (node.type === WorkflowNodeType.LOOP) {
                outputVars = [
                    { label: '循环结果', path: `nodes.${node.id}.result`, type: 'array' },
                ];
            } else if (node.type === WorkflowNodeType.PARALLEL) {
                outputVars = [
                    { label: '并行结果', path: `nodes.${node.id}.results`, type: 'object' },
                ];
            }
            
            // Add node prefix to variables
            const nodeVars = outputVars.map(varItem => ({
                ...varItem,
                nodeId: node.id,
                nodeLabel: nodeLabel,
            }));
            
            upstreamVars.push(...nodeVars);
        });
        
        return upstreamVars;
    };

    const startVars = getStartNodeVariables();
    const upstreamVars = getUpstreamNodeVariables();
    const systemVars = [
        { label: '当前时间', path: 'system.timestamp', type: 'date' },
        { label: '流程 ID', path: 'system.workflow_id', type: 'string' },
    ];

    // Group upstream variables by node
    const upstreamVarsByNode = upstreamVars.reduce((acc, varItem) => {
        if (!acc[varItem.nodeId]) {
            acc[varItem.nodeId] = {
                nodeId: varItem.nodeId,
                nodeLabel: varItem.nodeLabel,
                variables: []
            };
        }
        acc[varItem.nodeId].variables.push(varItem);
        return acc;
    }, {} as Record<string, { nodeId: string; nodeLabel: string; variables: any[] }>);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white cursor-pointer flex items-center justify-between transition-all ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : 'border-slate-300 hover:border-slate-400'}`}
            >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {value ? (
                        <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 rounded text-xs truncate max-w-full block">
                            {value}
                        </span>
                    ) : (
                        <span className="text-slate-400 truncate">{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute z-50 top-full mt-1 left-0 w-full max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    
                    {/* Loop Context Variable */}
                    {parentLoopNode && (
                        <>
                             <div className="sticky top-0 bg-indigo-50/95 backdrop-blur z-10 border-b border-indigo-100 px-3 py-2">
                                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                    <Repeat size={10} /> 循环内部变量
                                </div>
                            </div>
                            <div className="p-2 space-y-0.5">
                                <div 
                                    onClick={() => { onChange('loop.item'); setIsOpen(false); }}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-indigo-50 rounded cursor-pointer group"
                                >
                                    <Box size={12} className="text-indigo-500" />
                                    <span className="text-xs text-slate-700 flex-1 font-semibold">当前项 (Current Item)</span>
                                    <span className="text-[10px] text-indigo-400 font-mono">loop.item</span>
                                </div>
                                <div 
                                    onClick={() => { onChange('loop.index'); setIsOpen(false); }}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-indigo-50 rounded cursor-pointer group"
                                >
                                    <Hash size={12} className="text-indigo-500" />
                                    <span className="text-xs text-slate-700 flex-1">当前索引 (Index)</span>
                                    <span className="text-[10px] text-indigo-400 font-mono">loop.index</span>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100 mx-2"></div>
                        </>
                    )}

                    {/* Upstream Node Variables */}
                    {Object.values(upstreamVarsByNode).length > 0 && (
                        <>
                            {Object.values(upstreamVarsByNode).map(group => (
                                <>
                                    <div className="sticky top-0 bg-blue-50/95 backdrop-blur z-10 border-y border-blue-100 px-3 py-2">
                                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                            上游节点: {group.nodeLabel}
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-0.5">
                                        {group.variables.map((v, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => { onChange(v.path); setIsOpen(false); }}
                                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 rounded cursor-pointer group"
                                            >
                                                {getIconForType(v.type)}
                                                <span className="text-xs text-slate-700 flex-1 truncate">{v.label}</span>
                                                <span className="text-[10px] text-blue-600/50 font-mono group-hover:text-blue-600 truncate max-w-[120px]">{v.path}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-px bg-slate-100 mx-2"></div>
                                </>
                            ))}
                        </>
                    )}

                    {/* Global Start Parameters */}
                    <div className="sticky top-0 bg-slate-50/95 backdrop-blur z-10 border-y border-slate-100 px-3 py-2">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-between">
                             <div className="flex items-center gap-1">
                                <PlayCircle size={10} />
                                全局参数 (Global)
                             </div>
                        </div>
                    </div>
                    <div className="p-2 space-y-0.5">
                         {startVars.map((v, i) => (
                            <div 
                                key={i} 
                                onClick={() => { onChange(v.path); setIsOpen(false); }}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-emerald-50 rounded cursor-pointer group"
                            >
                                {getIconForType(v.type)}
                                <span className="text-xs text-slate-700 flex-1 truncate">{v.label}</span>
                                <span className="text-[10px] text-emerald-600/50 font-mono group-hover:text-emerald-600 truncate max-w-[120px]">{v.path}</span>
                            </div>
                        ))}
                    </div>

                    <div className="h-px bg-slate-100 mx-2"></div>
                    
                    {/* System Vars */}
                     <div className="sticky top-0 bg-slate-50/95 backdrop-blur z-10 border-y border-slate-100 px-3 py-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">系统变量</div>
                    </div>
                    <div className="p-2 space-y-0.5">
                        {systemVars.map((v, i) => (
                            <div 
                                key={i} 
                                onClick={() => { onChange(v.path); setIsOpen(false); }}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer group"
                            >
                                {getIconForType(v.type)}
                                <span className="text-xs text-slate-700 flex-1">{v.label}</span>
                                <span className="text-[10px] text-slate-400 font-mono group-hover:text-slate-600">{v.path}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Key-Value List Editor (Dify Style) --- 
export interface KeyValueEditorProps {
    items: Array<{ key: string; value: string }>;
    onChange: (items: Array<{ key: string; value: string }>) => void;
    title: string;
    description?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    icon?: any;
    addButtonLabel?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ 
    items = [], 
    onChange, 
    title, 
    description,
    keyPlaceholder = "Key", 
    valuePlaceholder = "Value",
    icon: Icon = ListPlus,
    addButtonLabel = "添加参数"
}) => {
    const handleAdd = () => {
        onChange([...items, { key: '', value: '' }]);
    };

    const handleRemove = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    const handleChange = (index: number, field: 'key' | 'value', val: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: val };
        onChange(newItems);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Icon size={12} className="text-indigo-500" />
                    {title}
                </label>
                {description && <span className="text-[10px] text-slate-400">{description}</span>}
            </div>
            
            <div className="space-y-2">
                {items.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-2 bg-slate-50 rounded border border-dashed border-slate-200">
                        暂无配置
                    </div>
                )}
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start group">
                        <div className="w-1/3 shrink-0">
                            <input
                                type="text"
                                className="w-full px-2 py-2 border border-slate-300 rounded-md text-xs font-mono bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                placeholder={keyPlaceholder}
                                value={item.key}
                                onChange={(e) => handleChange(index, 'key', e.target.value)}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <VariableSelector
                                value={item.value}
                                onChange={(val) => handleChange(index, 'value', val)}
                                placeholder={valuePlaceholder}
                            />
                        </div>
                        <button 
                            onClick={() => handleRemove(index)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <button 
                onClick={handleAdd}
                className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded border border-dashed border-indigo-200 transition-colors"
            >
                <Plus size={12} /> {addButtonLabel}
            </button>
        </div>
    );
};

// --- Variable Parsing and Replacement System --- 

/**
 * 从对象中根据路径获取值
 * @param obj 源对象
 * @param path 路径，如 "a.b.c" 或 "nodes.123.response"
 * @returns 对应的值，若路径不存在则返回undefined
 */
export const getValueByPath = (obj: any, path: string): any => {
    if (!path || !obj) return undefined;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    
    return current;
};

/**
 * 替换字符串中的变量占位符
 * 支持格式：{{ variable.path }} 或 ${{ variable.path }}
 * @param str 包含变量占位符的字符串
 * @param context 变量上下文对象
 * @returns 替换后的字符串
 */
export const replaceVariables = (str: string, context: any): string => {
    if (!str || typeof str !== 'string') return str;
    
    // 支持两种格式：{{ variable.path }} 和 ${{ variable.path }}
    const variableRegex = /\$?\{\{\s*([^}]+?)\s*\}\}/g;
    
    return str.replace(variableRegex, (match, variablePath) => {
        const value = getValueByPath(context, variablePath);
        // 如果值不存在，保留原始占位符
        return value !== undefined ? String(value) : match;
    });
};

/**
 * 递归替换对象中所有字符串值的变量占位符
 * @param obj 源对象
 * @param context 变量上下文对象
 * @returns 替换后的对象
 */
export const replaceVariablesInObject = (obj: any, context: any): any => {
    if (typeof obj === 'string') {
        return replaceVariables(obj, context);
    } else if (Array.isArray(obj)) {
        return obj.map(item => replaceVariablesInObject(item, context));
    } else if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = replaceVariablesInObject(obj[key], context);
            }
        }
        return result;
    }
    return obj;
};

// --- AI Button Component --- 
export interface AIButtonProps {
    field: string;
    isConfig?: boolean;
    loadingField?: string | null;
    onGenerate: (field: string, isConfig: boolean) => void;
}

export const AIButton: React.FC<AIButtonProps> = ({ field, isConfig = false, loadingField, onGenerate }) => (
    <button 
        onClick={() => onGenerate(field, isConfig)}
        disabled={!!loadingField}
        className="text-indigo-500 hover:text-indigo-700 p-1 rounded-md hover:bg-indigo-50 transition-colors"
    >
        {loadingField === field ? <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <span className="w-3.5 h-3.5 text-indigo-500">✨</span>}
    </button>
);

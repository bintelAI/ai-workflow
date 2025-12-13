import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkflowStore, DEFAULT_DEV_INPUT } from './store/useWorkflowStore';
import { WorkflowNodeType } from '../../types';
import { ConfigPanelProps, NodeConfigProps } from './Workflow.types';
import { 
    X, Save, Trash2, Sparkles, Loader2, Wand2, Braces, Bug,
    Plus, Split, ChevronRight, ChevronDown,
    PlayCircle, FileText, Hash, ToggleLeft, Calendar, LayoutList, Box, Repeat, ListPlus
} from 'lucide-react';
import styles from './ConfigPanel.module.css';

// Import configuration components
import { LoopConfig } from './configs/LoopConfig';
import { StartConfig } from './configs/StartConfig';
import { EndConfig } from './configs/EndConfig';
import { ScriptConfig } from './configs/ScriptConfig';
import { LLMConfig } from './configs/LLMConfig';
import { APICallConfig } from './configs/APICallConfig';
import { ConditionConfig } from './configs/ConditionConfig';
import { DelayConfig } from './configs/DelayConfig';
import { NotificationConfig } from './configs/NotificationConfig';
import { ApprovalConfig } from './configs/ApprovalConfig';
import { DataOpConfig } from './configs/DataOpConfig';
import { CCConfig } from './configs/CCConfig';

// Import common components from configs/common.tsx
import { AIButton } from './configs/common';

// --- Helper: Flatten JSON object to dot notation ---
const flattenObject = (obj: any, parentKey = '', res: any[] = []) => {
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
interface VariableSelectorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({ value, onChange, placeholder = "选择变量..." }) => {
    const { nodes, selectedNodeId } = useWorkflowStore();
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
            case 'array': return <LayoutList size={12} className="text-teal-400" />;
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

    const startVars = getStartNodeVariables();
    const systemVars = [
        { label: '当前时间', path: 'system.timestamp', type: 'date' },
        { label: '流程 ID', path: 'system.workflow_id', type: 'string' },
    ];

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
}

// --- Key-Value List Editor (Dify Style) ---
interface KeyValueEditorProps {
    items: Array<{ key: string; value: string }>;
    onChange: (items: Array<{ key: string; value: string }>) => void;
    title: string;
    description?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    icon?: any;
    addButtonLabel?: string;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ 
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

/**
 * 节点配置面板组件
 * 用于配置选中节点的属性和高级设置
 */
export const ConfigPanel: React.FC = () => {
  const { nodes, selectedNodeId, updateNodeData, setSelectedNode, deleteNode, aiAutocompleteConfig } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  // ... (Resizing logic kept same)
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
      if (isResizing) {
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth > 300 && newWidth < 800) setPanelWidth(newWidth);
      }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  if (!selectedNode) return null; // Or empty state

  const handleChange = (field: string, value: any) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  const handleConfigChange = (key: string, value: any) => {
    // 获取最新的节点数据，而不是闭包中的旧数据
    const currentNode = nodes.find((n) => n.id === selectedNodeId);
    const currentConfig = currentNode?.data.config || {};
    updateNodeData(selectedNodeId, {
      config: { ...currentConfig, [key]: value }
    });
  };

  const handleAIGenerate = async (field: string, isConfig: boolean = false) => {
      setLoadingField(field);
      try {
          const context = selectedNode.data.label || selectedNode.type || 'generic';
          const result = await aiAutocompleteConfig(field, context);
          if (isConfig) handleConfigChange(field, result);
          else handleChange(field, result);
      } finally { setLoadingField(null); }
  };

  // AIButton is imported from configs/common.tsx

  const renderAdvancedConfig = () => {
      const config = selectedNode.data.config || {};
      
      switch (selectedNode.type) {
          case WorkflowNodeType.LOOP:
              return <LoopConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.START:
              return <StartConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.END:
              return <EndConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.SCRIPT:
              return <ScriptConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.LLM:
              return <LLMConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.API_CALL:
              return <APICallConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.CONDITION:
              return <ConditionConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.DELAY:
              return <DelayConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.NOTIFICATION:
              return <NotificationConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.APPROVAL:
              return <ApprovalConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.DATA_OP:
              return <DataOpConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.CC:
              return <CCConfig config={config} onConfigChange={handleConfigChange} />;
          default:
              return (
                 <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                     当前节点类型 ({selectedNode.type}) 暂无特定高级配置。
                 </div>
              );
      }
  };

  return (
    <aside 
        className={`${styles.configPanel} relative group`}
        style={{ width: panelWidth }}
    >
      <div 
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-30 flex items-center justify-center opacity-0 group-hover:opacity-100"
        onMouseDown={startResizing}
      />

      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
        <div>
           <h2 className="font-bold text-slate-800 flex items-center gap-2">
               节点配置
           </h2>
           <p className="text-xs text-slate-500">Type: {selectedNode.type}</p>
        </div>
        <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-5 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <label className={styles.label}>节点名称</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => handleChange('label', e.target.value)}
                  className={styles.input}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className={styles.label}>描述</label>
                    <AIButton field="description" />
                </div>
                <textarea
                  rows={2}
                  value={selectedNode.data.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`${styles.textarea} resize-none`}
                />
              </div>
            </div>

            <div className="h-px bg-slate-200 my-2"></div>

            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                 <Wand2 size={14} className="text-indigo-500" /> 高级设置
               </h3>
               {renderAdvancedConfig()}
            </div>
         </div>
      </div>

      <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
        <button 
            onClick={() => setSelectedNode(null)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
        >
            <Save size={16} /> 完成
        </button>
        <button 
            onClick={() => deleteNode(selectedNode.id)}
            className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
            <Trash2 size={16} />
        </button>
      </div>
    </aside>
  );
};


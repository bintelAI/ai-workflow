
import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from './store/useWorkflowStore';
import { WorkflowNodeType, WorkflowCategory } from '../../types';
import { 
    X, Plus, Trash2, Check, Settings, Layout, 
    Bot, CheckSquare, GitFork, GitMerge, Send, Database, Clock, Globe, Bell, Code, PlayCircle, StopCircle, Repeat
} from 'lucide-react';

const NODE_META: Record<WorkflowNodeType, { label: string; icon: any; color: string }> = {
    [WorkflowNodeType.START]: { label: '开始节点', icon: PlayCircle, color: 'text-emerald-500' },
    [WorkflowNodeType.END]: { label: '结束节点', icon: StopCircle, color: 'text-rose-500' },
    [WorkflowNodeType.APPROVAL]: { label: '审批节点', icon: CheckSquare, color: 'text-blue-500' },
    [WorkflowNodeType.CC]: { label: '抄送节点', icon: Send, color: 'text-indigo-500' },
    [WorkflowNodeType.CONDITION]: { label: '条件分支', icon: GitFork, color: 'text-amber-500' },
    [WorkflowNodeType.PARALLEL]: { label: '并行分支', icon: GitMerge, color: 'text-teal-500' },
    [WorkflowNodeType.API_CALL]: { label: 'API 调用', icon: Globe, color: 'text-violet-500' },
    [WorkflowNodeType.NOTIFICATION]: { label: '消息通知', icon: Bell, color: 'text-orange-500' },
    [WorkflowNodeType.DELAY]: { label: '延时等待', icon: Clock, color: 'text-yellow-500' },
    [WorkflowNodeType.DATA_OP]: { label: '数据操作', icon: Database, color: 'text-cyan-500' },
    [WorkflowNodeType.SCRIPT]: { label: '脚本代码', icon: Code, color: 'text-slate-700' },
    [WorkflowNodeType.LLM]: { label: 'LLM 模型', icon: Bot, color: 'text-fuchsia-500' },
    [WorkflowNodeType.LOOP]: { label: '循环执行', icon: Repeat, color: 'text-indigo-600' },
};

export const SettingsModal: React.FC = () => {
    const { 
        isSettingsOpen, toggleSettings, 
        categories, activeCategoryId, setActiveCategory,
        addCategory, updateCategory, deleteCategory
    } = useWorkflowStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<WorkflowCategory>>({});

    // Reset state when opening
    useEffect(() => {
        if (isSettingsOpen) {
            setEditingId(activeCategoryId);
            const active = categories.find(c => c.id === activeCategoryId);
            setEditForm(active || {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSettingsOpen]);

    // Update form when editingId changes or categories update (e.g. checkbox toggle)
    useEffect(() => {
        const cat = categories.find(c => c.id === editingId);
        if (cat) {
            setEditForm(cat);
        }
    }, [editingId, categories]);

    if (!isSettingsOpen) return null;

    const handleCreate = () => {
        const newId = `custom_${Date.now()}`;
        const newCat: WorkflowCategory = {
            id: newId,
            name: '新工作流类型',
            description: '自定义工作流配置',
            allowedNodeTypes: Object.values(WorkflowNodeType),
            isSystem: false
        };
        addCategory(newCat);
        setEditingId(newId);
    };

    const handleSave = () => {
        if (editingId && editForm) {
            updateCategory(editingId, editForm);
        }
    };

    const toggleNodeType = (type: WorkflowNodeType) => {
        const currentTypes = new Set(editForm.allowedNodeTypes || []);
        if (currentTypes.has(type)) {
            currentTypes.delete(type);
        } else {
            currentTypes.add(type);
        }
        setEditForm({ ...editForm, allowedNodeTypes: Array.from(currentTypes) });
        // Auto save on toggle for better UX
        if (editingId) {
            updateCategory(editingId, { allowedNodeTypes: Array.from(currentTypes) });
        }
    };

    const handleSetActive = (id: string) => {
        setActiveCategory(id);
        setEditingId(id);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[900px] h-[600px] flex overflow-hidden border border-slate-200">
                
                {/* Left Sidebar: Categories */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
                    <div className="p-5 border-b border-slate-200">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Settings size={20} className="text-indigo-600" />
                            工作流配置
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">定义不同的业务场景模式</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {categories.map(cat => (
                            <div 
                                key={cat.id}
                                onClick={() => setEditingId(cat.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                                    editingId === cat.id 
                                    ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500/20' 
                                    : 'border-transparent hover:bg-white hover:border-slate-200'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium ${editingId === cat.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {cat.name}
                                    </span>
                                    {activeCategoryId === cat.id && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">使用中</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1">{cat.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-200">
                        <button 
                            onClick={handleCreate}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus size={16} /> 新建类型
                        </button>
                    </div>
                </div>

                {/* Right Content: Details */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Toolbar */}
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                         <div className="flex items-center gap-3">
                             {/* Activation Switch */}
                             {activeCategoryId !== editingId ? (
                                 <button 
                                     onClick={() => handleSetActive(editingId!)}
                                     className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-sm font-medium transition-colors"
                                 >
                                     <Layout size={16} /> 设为当前模式
                                 </button>
                             ) : (
                                 <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md text-sm font-medium border border-emerald-100">
                                     <Check size={16} /> 当前正在使用
                                 </div>
                             )}

                             {!editForm.isSystem && (
                                 <button 
                                     onClick={() => { deleteCategory(editingId!); setEditingId(categories[0].id); }}
                                     className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                     title="删除此类型"
                                 >
                                     <Trash2 size={16} />
                                 </button>
                             )}
                         </div>
                         <button onClick={() => toggleSettings(false)} className="text-slate-400 hover:text-slate-600">
                             <X size={20} />
                         </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {/* Basic Info */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">类型名称</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editForm.name || ''}
                                    onChange={(e) => {
                                        setEditForm({ ...editForm, name: e.target.value });
                                        updateCategory(editingId!, { name: e.target.value });
                                    }}
                                    disabled={editForm.isSystem}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">描述说明</label>
                                <textarea 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    rows={2}
                                    value={editForm.description || ''}
                                    onChange={(e) => {
                                        setEditForm({ ...editForm, description: e.target.value });
                                        updateCategory(editingId!, { description: e.target.value });
                                    }}
                                    disabled={editForm.isSystem}
                                />
                            </div>
                        </div>

                        {/* Node Permissions */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Layout size={16} className="text-indigo-500" />
                                节点权限配置
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.values(WorkflowNodeType).map(type => {
                                    const meta = NODE_META[type];
                                    const isAllowed = editForm.allowedNodeTypes?.includes(type);
                                    
                                    return (
                                        <div 
                                            key={type}
                                            onClick={() => toggleNodeType(type)}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none
                                                ${isAllowed 
                                                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/30' 
                                                    : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                                                }
                                            `}
                                        >
                                            <div className={`p-1.5 rounded-md ${isAllowed ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                <meta.icon size={16} className={meta.color} />
                                            </div>
                                            <span className={`text-xs font-medium ${isAllowed ? 'text-indigo-900' : 'text-slate-500'}`}>
                                                {meta.label}
                                            </span>
                                            {isAllowed && <Check size={14} className="ml-auto text-indigo-600" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



import React, { useState } from 'react';
import { CheckSquare, Users, Clock, Bell, FileText, User, LayoutGrid, PlayCircle, Activity, Save } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { WorkflowNodeType } from '../../../types';

interface ApprovalConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

type TabKey = 'personnel' | 'approval' | 'buttons' | 'fields' | 'execution' | 'node';

export const ApprovalConfig: React.FC<ApprovalConfigProps> = ({ config, onConfigChange }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('personnel');
    const [showMore, setShowMore] = useState(false);
    
    // 点击外部区域关闭下拉菜单
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const moreButton = document.querySelector('.more-tab-button');
            const dropdown = document.querySelector('.more-tab-dropdown');
            
            if (moreButton && dropdown && !moreButton.contains(event.target as Node) && !dropdown.contains(event.target as Node)) {
                setShowMore(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 按钮配置数据
    const buttonConfig = config?.buttonConfig || {
        save: true,
        submit: true,
        approve: true,
        reject: true,
        return: true,
        jump: true,
        addSign: true,
        print: true,
        transfer: true,
        copy: false
    };

    // 从store获取全局数据
    const workflowStore = useWorkflowStore();
    const startNode = workflowStore.nodes.find(node => node.type === WorkflowNodeType.START);
    
    // 提取全局数据的字段结构
    const extractFields = (obj: any, prefix: string = ''): Array<{ key: string, label: string }> => {
        const fields: Array<{ key: string, label: string }> = [];
        
        if (typeof obj !== 'object' || obj === null) {
            return fields;
        }
        
        Object.entries(obj).forEach(([key, value]) => {
            const fieldKey = prefix ? `${prefix}_${key}` : key;
            const fieldLabel = prefix ? `${prefix} ${key}` : key;
            
            fields.push({ key: fieldKey, label: fieldLabel });
            
            // 递归提取嵌套对象的字段
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                fields.push(...extractFields(value, fieldKey));
            }
        });
        
        return fields;
    };
    
    // 获取全局数据并提取字段
    let globalFields: Array<{ key: string, label: string }> = [];
    try {
        if (startNode?.data.config?.devInput) {
            const globalData = JSON.parse(startNode.data.config.devInput);
            globalFields = extractFields(globalData);
        }
    } catch (e) {
        console.error('Failed to parse global data:', e);
    }
    
    // 如果没有提取到字段，使用默认字段
    if (globalFields.length === 0) {
        globalFields = [
            { key: 'order_id', label: '订单ID' },
            { key: 'amount', label: '金额' },
            { key: 'currency', label: '货币' },
            { key: 'requester', label: '申请人' },
            { key: 'requester_name', label: '申请人姓名' },
            { key: 'requester_department', label: '申请部门' }
        ];
    }
    
    // 初始化字段配置，使用全局字段
    const initialFieldConfig: Record<string, 'editable' | 'readonly' | 'hidden'> = {};
    globalFields.forEach(field => {
        initialFieldConfig[field.key] = 'editable';
    });
    
    // 字段配置数据
    const fieldConfig = config?.fieldConfig || initialFieldConfig;

    const handleButtonChange = (buttonName: keyof typeof buttonConfig) => {
        onConfigChange('buttonConfig', {
            ...buttonConfig,
            [buttonName]: !buttonConfig[buttonName]
        });
    };

    const handleFieldChange = (fieldName: string, value: 'editable' | 'readonly' | 'hidden') => {
        onConfigChange('fieldConfig', {
            ...fieldConfig,
            [fieldName]: value
        });
    };

    return (
        <div className="space-y-5">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
               <CheckSquare className="inline-block w-3 h-3 mr-1 text-blue-600" />
               <span className="text-xs text-blue-700">
                   配置审批规则、审批人和通知设置
               </span>
            </div>

            {/* 标签页导航 */}
            <div className="border-b border-slate-200 relative w-full">
                <nav className="flex space-x-4 w-full">
                    {
                        [
                            { key: 'personnel' as TabKey, label: '人员配置', icon: Users },
                            { key: 'approval' as TabKey, label: '审批配置', icon: CheckSquare },
                            { key: 'buttons' as TabKey, label: '按钮配置', icon: CheckSquare },
                            { key: 'fields' as TabKey, label: '字段配置', icon: LayoutGrid }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))
                    }
                    
                    {/* 更多下拉菜单 */}
                    <div className="relative ml-auto">
                        <button
                            className="more-tab-button flex items-center gap-1.5 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            onClick={() => setShowMore(!showMore)}
                        >
                            <span>更多</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-down">
                                <path d="m6 9 6 6 6-6"/>
                            </svg>
                        </button>
                        
                        {showMore && (
                            <div className="more-tab-dropdown absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 min-w-[150px]">
                                {
                                    [
                                        { key: 'execution' as TabKey, label: '执行监听', icon: PlayCircle },
                                        { key: 'node' as TabKey, label: '节点监听', icon: Activity }
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                setActiveTab(tab.key);
                                                setShowMore(false);
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${activeTab === tab.key ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <tab.icon size={16} />
                                            {tab.label}
                                        </button>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            {/* 标签页内容 */}
            <div className="space-y-5">
                {/* 人员配置 */}
                {activeTab === 'personnel' && (
                    <div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <Users size={12} className="text-blue-500" />
                                审批人配置
                            </label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                   <User className="text-slate-400 w-4 h-4" />
                                   <input
                                       type="text"
                                       className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                                       placeholder="e.g. U-8821, U-9932 or 'MANAGER'"
                                       value={config?.approver || ''}
                                       onChange={(e) => onConfigChange('approver', e.target.value)}
                                   />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 审批配置 */}
                {activeTab === 'approval' && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <CheckSquare size={12} className="text-blue-500" />
                                审批规则
                            </label>
                            <div className="space-y-3">
                                {/* 审批方式 */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">审批方式</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                                        value={config?.approvalType || 'single'}
                                        onChange={(e) => onConfigChange('approvalType', e.target.value)}
                                    >
                                        <option value="single">单人审批</option>
                                        <option value="parallel">并行审批</option>
                                        <option value="serial">串行审批</option>
                                    </select>
                                </div>
                                
                                {/* 审批策略 */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">审批策略</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                                        value={config?.approvalStrategy || 'all'}
                                        onChange={(e) => onConfigChange('approvalStrategy', e.target.value)}
                                    >
                                        <option value="all">全部通过</option>
                                        <option value="any">任意通过</option>
                                        <option value="majority">多数通过</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {/* 超时设置 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <Clock size={12} className="text-blue-500" />
                                超时设置
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                       type="number"
                                       className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                       placeholder="时长"
                                       value={config?.timeout || 24}
                                       onChange={(e) => onConfigChange('timeout', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                                        value={config?.timeoutUnit || 'hours'}
                                        onChange={(e) => onConfigChange('timeoutUnit', e.target.value)}
                                    >
                                        <option value="hours">小时</option>
                                        <option value="days">天</option>
                                        <option value="minutes">分钟</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {/* 通知设置 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <Bell size={12} className="text-blue-500" />
                                通知设置
                            </label>
                            <div className="space-y-3">
                                {/* 审批通知 */}
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-slate-600">发送审批通知</label>
                                    <div 
                                        onClick={() => onConfigChange('sendApprovalNotice', !config?.sendApprovalNotice)}
                                        className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${config?.sendApprovalNotice !== false ? 'bg-blue-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config?.sendApprovalNotice !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                
                                {/* 超时通知 */}
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-slate-600">发送超时通知</label>
                                    <div 
                                        onClick={() => onConfigChange('sendTimeoutNotice', !config?.sendTimeoutNotice)}
                                        className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${config?.sendTimeoutNotice !== false ? 'bg-blue-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config?.sendTimeoutNotice !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                
                                {/* 通知接收人 */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">通知接收人</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                        placeholder="e.g. requester, admin@example.com"
                                        value={config?.noticeRecipient || ''}
                                        onChange={(e) => onConfigChange('noticeRecipient', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* 审批表单配置 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <FileText size={12} className="text-blue-500" />
                                审批表单配置
                            </label>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">表单标题</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                        placeholder="e.g. 费用审批单"
                                        value={config?.formTitle || ''}
                                        onChange={(e) => onConfigChange('formTitle', e.target.value)}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">表单描述</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs resize-y"
                                        rows={2}
                                        placeholder="审批表单的描述信息"
                                        value={config?.formDescription || ''}
                                        onChange={(e) => onConfigChange('formDescription', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 按钮配置 */}
                {activeTab === 'buttons' && (
                    <div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <CheckSquare size={12} className="text-blue-500" />
                                参与者可以看见或操作哪些按钮
                            </label>
                        </div>

                        <div className="space-y-3">
                            {
                                [
                                    { key: 'save' as const, label: '保存', icon: Save },
                                    { key: 'submit' as const, label: '提交', icon: CheckSquare },
                                    { key: 'approve' as const, label: '同意', icon: CheckSquare, color: 'text-green-500' },
                                    { key: 'reject' as const, label: '拒绝', icon: CheckSquare, color: 'text-red-500' },
                                    { key: 'return' as const, label: '退回', icon: CheckSquare },
                                    { key: 'jump' as const, label: '跳转', icon: CheckSquare },
                                    { key: 'addSign' as const, label: '加签', icon: CheckSquare },
                                    { key: 'print' as const, label: '打印', icon: CheckSquare },
                                    { key: 'transfer' as const, label: '转办', icon: CheckSquare },
                                    { key: 'copy' as const, label: '抄送', icon: CheckSquare }
                                ].map((button) => (
                                    <div key={button.key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`button-${button.key}`}
                                                checked={buttonConfig[button.key]}
                                                onChange={() => handleButtonChange(button.key)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                                            />
                                            <label htmlFor={`button-${button.key}`} className="text-sm text-slate-700 flex items-center gap-1">
                                                <button.icon size={16} className={button.color || 'text-slate-400'} />
                                                {button.label}
                                            </label>
                                        </div>
                                        <div className="text-xs text-slate-500">{buttonConfig[button.key] ? '2/10' : '0/10'}</div>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="mt-6">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <CheckSquare size={12} className="text-blue-500" />
                                自定义跳转按钮
                            </label>
                            <div className="text-xs text-slate-500 py-2 bg-slate-50 rounded border border-slate-200">
                                暂无自定义跳转按钮配置
                            </div>
                        </div>
                    </div>
                )}

                {/* 字段配置 */}
                {activeTab === 'fields' && (
                    <div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <LayoutGrid size={12} className="text-blue-500" />
                                参与者可以看见或操作哪些字段
                            </label>
                            <p className="text-xs text-slate-500 mt-1">
                                字段来源于全局数据，可配置每个字段的访问权限（可编辑、只读或隐藏）
                            </p>
                        </div>

                        <div className="space-y-4">
                            {
                                globalFields.map((field) => (
                                    <div key={field.key} className="flex items-center justify-between">
                                        <label className="text-sm text-slate-700">{field.label}</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-1 text-xs text-slate-600">
                                                <input
                                                    type="radio"
                                                    name={`field-${field.key}`}
                                                    value="editable"
                                                    checked={fieldConfig[field.key] === 'editable'}
                                                    onChange={() => handleFieldChange(field.key, 'editable')}
                                                    className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-slate-300"
                                                />
                                                可编辑
                                            </label>
                                            <label className="flex items-center gap-1 text-xs text-slate-600">
                                                <input
                                                    type="radio"
                                                    name={`field-${field.key}`}
                                                    value="readonly"
                                                    checked={fieldConfig[field.key] === 'readonly'}
                                                    onChange={() => handleFieldChange(field.key, 'readonly')}
                                                    className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-slate-300"
                                                />
                                                只读
                                            </label>
                                            <label className="flex items-center gap-1 text-xs text-slate-600">
                                                <input
                                                    type="radio"
                                                    name={`field-${field.key}`}
                                                    value="hidden"
                                                    checked={fieldConfig[field.key] === 'hidden'}
                                                    onChange={() => handleFieldChange(field.key, 'hidden')}
                                                    className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-slate-300"
                                                />
                                                隐藏
                                            </label>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* 执行监听 */}
                {activeTab === 'execution' && (
                    <div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <PlayCircle size={12} className="text-blue-500" />
                                执行监听配置
                            </label>
                        </div>

                        <div className="text-xs text-slate-500 py-4 bg-slate-50 rounded border border-slate-200 text-center">
                            暂无执行监听配置
                        </div>
                    </div>
                )}

                {/* 节点监听 */}
                {activeTab === 'node' && (
                    <div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                <Activity size={12} className="text-blue-500" />
                                节点监听配置
                            </label>
                        </div>

                        <div className="text-xs text-slate-500 py-4 bg-slate-50 rounded border border-slate-200 text-center">
                            暂无节点监听配置
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

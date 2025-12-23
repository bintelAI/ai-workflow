import React from 'react';
import { Trash2, Plus, Layers, Settings2, AlertCircle } from 'lucide-react';
import { VariableSelector, VariableInput } from './common';

export interface Condition {
    variable: string;
    operator: string;
    value: string;
}

export interface ConditionGroup {
    id: string;
    logicalOperator: 'AND' | 'OR';
    conditions: Condition[];
}

interface ConditionBuilderProps {
    conditionGroups: ConditionGroup[];
    onChange: (groups: ConditionGroup[]) => void;
    title?: string;
    description?: string;
    scope?: 'upstream' | 'internal' | 'all';
}

export const OPERATORS = [
    { label: '等于', value: '==' },
    { label: '不等于', value: '!=' },
    { label: '大于', value: '>' },
    { label: '小于', value: '<' },
    { label: '大于等于', value: '>=' },
    { label: '小于等于', value: '<=' },
    { label: '包含', value: 'contains' },
    { label: '不包含', value: 'not_contains' },
    { label: '为空', value: 'empty' },
    { label: '不为空', value: 'not_empty' },
];

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ 
    conditionGroups = [], 
    onChange,
    title,
    description,
    scope = 'upstream'
}) => {
    const validateCondition = (cond: Condition) => {
        if (!cond.variable) return false;
        if (!['empty', 'not_empty'].includes(cond.operator) && !cond.value) return false;
        return true;
    };

    const addGroup = () => {
        const groups = [...conditionGroups];
        groups.push({
            id: Math.random().toString(36).substr(2, 9),
            logicalOperator: 'AND',
            conditions: [{ variable: '', operator: '==', value: '' }]
        });
        onChange(groups);
    };

    const removeGroup = (index: number) => {
        const groups = [...conditionGroups];
        groups.splice(index, 1);
        onChange(groups);
    };

    const updateGroup = (index: number, field: string, value: any) => {
        const groups = [...conditionGroups];
        groups[index] = { ...groups[index], [field]: value };
        onChange(groups);
    };

    const addCondition = (groupIndex: number) => {
        const groups = [...conditionGroups];
        groups[groupIndex].conditions.push({ variable: '', operator: '==', value: '' });
        onChange(groups);
    };

    const removeCondition = (groupIndex: number, condIndex: number) => {
        const groups = [...conditionGroups];
        groups[groupIndex].conditions.splice(condIndex, 1);
        if (groups[groupIndex].conditions.length === 0) {
            groups.splice(groupIndex, 1);
        }
        onChange(groups);
    };

    const updateCondition = (groupIndex: number, condIndex: number, field: string, value: any) => {
        const groups = [...conditionGroups];
        groups[groupIndex].conditions[condIndex] = { ...groups[groupIndex].conditions[condIndex], [field]: value };
        onChange(groups);
    };

    return (
        <div className="space-y-4">
            {(title || description) && (
                <div className="space-y-1">
                    {title && <label className="block text-xs font-bold text-slate-700 uppercase">{title}</label>}
                    {description && <p className="text-[10px] text-slate-500">{description}</p>}
                </div>
            )}

            <div className="space-y-4">
                {conditionGroups.map((group, gIndex) => (
                    <div key={group.id || gIndex} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3 relative group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <select
                                    value={group.logicalOperator}
                                    onChange={(e) => updateGroup(gIndex, 'logicalOperator', e.target.value)}
                                    className="text-[10px] font-bold uppercase bg-white border border-slate-200 rounded px-1.5 py-0.5 text-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="AND">符合以下全部条件 (AND)</option>
                                    <option value="OR">符合以下任意条件 (OR)</option>
                                </select>
                            </div>
                            <button 
                                onClick={() => removeGroup(gIndex)}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {group.conditions.map((cond, cIndex) => {
                                const isValid = validateCondition(cond);
                                return (
                                    <div key={cIndex} className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <VariableSelector 
                                                value={cond.variable}
                                                onChange={(val) => updateCondition(gIndex, cIndex, 'variable', val)}
                                                placeholder="选择变量"
                                                scope={scope}
                                            />
                                        </div>
                                        <select
                                            value={cond.operator}
                                            onChange={(e) => updateCondition(gIndex, cIndex, 'operator', e.target.value)}
                                            className="w-24 px-2 py-2 border border-slate-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            {OPERATORS.map(op => (
                                                <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                        </select>
                                        {!['empty', 'not_empty'].includes(cond.operator) && (
                                            <div className="flex-1 min-w-0">
                                                <VariableInput 
                                                    value={cond.value}
                                                    onChange={(val) => updateCondition(gIndex, cIndex, 'value', val)}
                                                    placeholder="比较值"
                                                    scope={scope}
                                                />
                                            </div>
                                        )}
                                        {!isValid && cond.variable && (
                                            <div className="text-rose-500" title="条件未填写完整">
                                                <AlertCircle size={14} />
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => removeCondition(gIndex, cIndex)}
                                            className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => addCondition(gIndex)}
                            className="w-full py-1.5 border border-dashed border-slate-300 rounded-md text-[10px] text-slate-500 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-1"
                        >
                            <Plus size={12} />
                            添加条件
                        </button>
                    </div>
                ))}

                <button
                    onClick={addGroup}
                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                    <Settings2 size={14} />
                    添加条件组 (OR)
                </button>
            </div>
        </div>
    );
};

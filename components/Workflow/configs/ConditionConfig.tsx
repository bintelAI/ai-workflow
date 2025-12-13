import React, { useState, useCallback, useEffect } from 'react';
import { GitFork, Plus, Trash2, ChevronsUpDown } from 'lucide-react';
import { VariableSelector } from './common';

interface ConditionConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

interface ConditionItem {
    id: string;
    leftOperand: string;
    operator: string;
    rightOperand: string;
    logic: 'and' | 'or' | '';
}

interface ConditionGroup {
    id: string;
    conditions: ConditionItem[];
    logic: 'and' | 'or';
}

export const ConditionConfig: React.FC<ConditionConfigProps> = ({ config, onConfigChange }) => {
    // 操作符列表
    const operators = [
        { value: 'equals', label: '等于', symbol: '等于' },
        { value: 'not_equals', label: '不等于', symbol: '不等于' },
        { value: 'greater_than', label: '大于', symbol: '大于' },
        { value: 'greater_than_or_equal', label: '大于等于', symbol: '大于等于' },
        { value: 'less_than', label: '小于', symbol: '小于' },
        { value: 'less_than_or_equal', label: '小于等于', symbol: '小于等于' },
        { value: 'contains', label: '包含', symbol: '包含' },
        { value: 'not_contains', label: '不包含', symbol: '不包含' },
        { value: 'starts_with', label: '开头是', symbol: '开头是' },
        { value: 'ends_with', label: '结尾是', symbol: '结尾是' },
        { value: 'is_empty', label: '为空', symbol: '为空' },
        { value: 'is_not_empty', label: '不为空', symbol: '不为空' },
        { value: 'in', label: '在列表中', symbol: '在列表中' },
        { value: 'not_in', label: '不在列表中', symbol: '不在列表中' }
    ];

    // 逻辑操作符
    const logicOperators = [
        { value: 'and', label: '并且', symbol: 'AND' },
        { value: 'or', label: '或者', symbol: 'OR' }
    ];

    // 初始化条件组
    const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>(
        config?.conditionGroups || [{
            id: 'group_1',
            conditions: [{
                id: 'cond_1',
                leftOperand: '',
                operator: 'equals',
                rightOperand: '',
                logic: ''
            }],
            logic: 'and'
        }]
    );

    // 同步config中的conditionGroups到本地状态
    useEffect(() => {
        if (config?.conditionGroups && JSON.stringify(config.conditionGroups) !== JSON.stringify(conditionGroups)) {
            setConditionGroups(config.conditionGroups);
        }
    }, [config?.conditionGroups]);

    // 生成JavaScript表达式
    const generateExpression = useCallback((groups: ConditionGroup[]) => {
        return groups.map(group => {
            const groupLogic = group.logic;
            return `(${group.conditions.map(cond => {
                const left = cond.leftOperand;
                const op = cond.operator;
                const right = cond.rightOperand;
                let expr = '';

                // 根据操作符生成表达式
                switch (op) {
                    case 'equals':
                        expr = `${left} === ${right}`;
                        break;
                    case 'not_equals':
                        expr = `${left} !== ${right}`;
                        break;
                    case 'greater_than':
                        expr = `${left} > ${right}`;
                        break;
                    case 'greater_than_or_equal':
                        expr = `${left} >= ${right}`;
                        break;
                    case 'less_than':
                        expr = `${left} < ${right}`;
                        break;
                    case 'less_than_or_equal':
                        expr = `${left} <= ${right}`;
                        break;
                    case 'contains':
                        expr = `${left}.includes(${right})`;
                        break;
                    case 'not_contains':
                        expr = `!${left}.includes(${right})`;
                        break;
                    case 'starts_with':
                        expr = `${left}.startsWith(${right})`;
                        break;
                    case 'ends_with':
                        expr = `${left}.endsWith(${right})`;
                        break;
                    case 'is_empty':
                        expr = `${left} === '' || ${left} === null || ${left} === undefined`;
                        break;
                    case 'is_not_empty':
                        expr = `${left} !== '' && ${left} !== null && ${left} !== undefined`;
                        break;
                    case 'in':
                        expr = `${right}.includes(${left})`;
                        break;
                    case 'not_in':
                        expr = `!${right}.includes(${left})`;
                        break;
                    default:
                        expr = `${left} === ${right}`;
                }

                return expr;
            }).join(` ${groupLogic.toUpperCase()} `)})`;
        }).join(' AND '); // 组之间默认使用AND连接
    }, []);

    // 同步条件到配置
    const syncConditions = useCallback((groups: ConditionGroup[]) => {
        const expression = generateExpression(groups);
        onConfigChange('conditionGroups', groups);
        onConfigChange('expression', expression);
    }, [generateExpression, onConfigChange]);

    // 添加条件组
    const addConditionGroup = () => {
        const newGroup: ConditionGroup = {
            id: `group_${Date.now()}`,
            conditions: [{
                id: `cond_${Date.now()}`,
                leftOperand: '',
                operator: 'equals',
                rightOperand: '',
                logic: ''
            }],
            logic: 'and'
        };
        const newGroups = [...conditionGroups, newGroup];
        setConditionGroups(newGroups);
        // 立即同步
        syncConditions(newGroups);
    };

    // 删除条件组
    const removeConditionGroup = (groupId: string) => {
        if (conditionGroups.length > 1) {
            const newGroups = conditionGroups.filter(group => group.id !== groupId);
            setConditionGroups(newGroups);
            // 立即同步
            syncConditions(newGroups);
        }
    };

    // 添加条件
    const addCondition = (groupId: string) => {
        const newCondition: ConditionItem = {
            id: `cond_${Date.now()}`,
            leftOperand: '',
            operator: 'equals',
            rightOperand: '',
            logic: 'and'
        };
        const newGroups = conditionGroups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    conditions: [...group.conditions, newCondition]
                };
            }
            return group;
        });
        setConditionGroups(newGroups);
        // 立即同步
        syncConditions(newGroups);
    };

    // 删除条件
    const removeCondition = (groupId: string, conditionId: string) => {
        const newGroups = conditionGroups.map(group => {
            if (group.id === groupId && group.conditions.length > 1) {
                return {
                    ...group,
                    conditions: group.conditions.filter(cond => cond.id !== conditionId)
                };
            }
            return group;
        });
        setConditionGroups(newGroups);
        // 立即同步
        syncConditions(newGroups);
    };

    // 更新条件
    const updateCondition = (groupId: string, conditionId: string, field: keyof ConditionItem, value: any) => {
        const newGroups = conditionGroups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    conditions: group.conditions.map(cond => {
                        if (cond.id === conditionId) {
                            return {
                                ...cond,
                                [field]: value
                            };
                        }
                        return cond;
                    })
                };
            }
            return group;
        });
        setConditionGroups(newGroups);
        // 立即同步
        syncConditions(newGroups);
    };

    // 更新条件组逻辑
    const updateGroupLogic = (groupId: string, logic: 'and' | 'or') => {
        const newGroups = conditionGroups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    logic
                };
            }
            return group;
        });
        setConditionGroups(newGroups);
        // 立即同步
        syncConditions(newGroups);
    };

    return (
        <div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4 text-xs text-amber-700">
               <GitFork className="inline-block w-3 h-3 mr-1" /> 可视化条件配置
            </div>

            {/* 条件组 */}
            {conditionGroups.map((group, groupIndex) => (
                <div key={group.id} className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-600">条件组 {groupIndex + 1}</label>
                            <select
                                className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                                value={group.logic}
                                onChange={(e) => updateGroupLogic(group.id, e.target.value as 'and' | 'or')}
                            >
                                {logicOperators.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                            </select>
                            <span className="text-xs text-slate-500">连接</span>
                        </div>
                        {conditionGroups.length > 1 && (
                            <button
                                onClick={() => removeConditionGroup(group.id)}
                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                                <Trash2 size={12} />
                                删除组
                            </button>
                        )}
                    </div>

                    {/* 条件项 */}
                    {group.conditions.map((condition, condIndex) => (
                        <div key={condition.id} className="flex items-center gap-2 mb-2">
                            {/* 逻辑操作符 */}
                            {condIndex > 0 && (
                                <select
                                    className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                                    value={condition.logic}
                                    onChange={(e) => updateCondition(group.id, condition.id, 'logic', e.target.value)}
                                >
                                    {logicOperators.map(op => (
                                        <option key={op.value} value={op.value}>{op.symbol}</option>
                                    ))}
                                </select>
                            )}

                            {/* 左侧操作数 */}
                            <div className="flex-1">
                                <VariableSelector
                                    value={condition.leftOperand}
                                    onChange={(val) => updateCondition(group.id, condition.id, 'leftOperand', val)}
                                    placeholder="选择变量..."
                                />
                            </div>

                            {/* 操作符 */}
                            <select
                                className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                                value={condition.operator}
                                onChange={(e) => updateCondition(group.id, condition.id, 'operator', e.target.value)}
                            >
                                {operators.map(op => (
                                    <option key={op.value} value={op.value}>{op.symbol}</option>
                                ))}
                            </select>

                            {/* 右侧操作数 */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                                    value={condition.rightOperand}
                                    onChange={(e) => updateCondition(group.id, condition.id, 'rightOperand', e.target.value)}
                                    placeholder="输入值..."
                                />
                            </div>

                            {/* 删除按钮 */}
                            {group.conditions.length > 1 && (
                                <button
                                    onClick={() => removeCondition(group.id, condition.id)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* 添加条件按钮 */}
                    <button
                        onClick={() => addCondition(group.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                        <Plus size={12} />
                        添加条件
                    </button>
                </div>
            ))}

            {/* 添加条件组按钮 */}
            <button
                onClick={addConditionGroup}
                className="w-full py-2 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-1 border border-dashed border-indigo-200 rounded"
            >
                <Plus size={14} />
                添加条件组
            </button>

            {/* 生成的表达式 */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-xs font-medium text-slate-600 mb-1">生成的条件表达式</label>
                <pre className="text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-300 overflow-x-auto">
                    {generateExpression(conditionGroups) || '暂无条件'}
                </pre>
            </div>
        </div>
    );
};
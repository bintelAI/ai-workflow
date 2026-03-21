import React, { useCallback, useMemo } from 'react';
import { Select, Input, Button, Divider, Alert, Radio, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, ForkOutlined } from '@ant-design/icons';
import { VariableSelector } from './common/index';
import type { FlowField, ConditionOperator, ConditionItem } from '@/src/types/flow';
import './ConditionConfig.css';

interface ConditionConfigProps {
  config: {
    IF?: ConditionItem[];
    ELSE?: FlowField[];
  };
  onConfigChange: (key: string, value: any) => void;
  variables?: Array<{
    id: string;
    type?: string;
    label?: string;
    params: FlowField[];
  }>;
}

const CONDITIONS: { label: string; value: ConditionOperator }[] = [
  { label: '包含', value: 'include' },
  { label: '不包含', value: 'exclude' },
  { label: '开始是', value: 'startWith' },
  { label: '结束是', value: 'endWith' },
  { label: '等于', value: 'equal' },
  { label: '不等于', value: 'notEqual' },
  { label: '大于', value: 'greaterThan' },
  { label: '大于等于', value: 'greaterThanOrEqual' },
  { label: '小于', value: 'lessThan' },
  { label: '小于等于', value: 'lessThanOrEqual' },
  { label: '为空', value: 'isNull' },
  { label: '不为空', value: 'isNotNull' },
];

const ConditionConfig: React.FC<ConditionConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const ifList: ConditionItem[] = config.IF || [];

  const handleAdd = useCallback(() => {
    const newItem: ConditionItem = {
      field: '',
      condition: 'equal',
      value: '',
      operator: ifList.length > 0 ? 'OR' : undefined,
    };
    onConfigChange('IF', [...ifList, newItem]);
  }, [ifList, onConfigChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const newList = [...ifList];
      newList.splice(index, 1);
      if (newList.length > 0 && newList[newList.length - 1]) {
        newList[newList.length - 1].operator = undefined;
      }
      onConfigChange('IF', newList);
    },
    [ifList, onConfigChange]
  );

  const handleChange = useCallback(
    (index: number, key: keyof ConditionItem, value: any) => {
      const newList = [...ifList];
      newList[index] = { ...newList[index], [key]: value };
      
      if (key === 'condition' && (value === 'isNull' || value === 'isNotNull')) {
        newList[index].value = '';
      }
      
      onConfigChange('IF', newList);
    },
    [ifList, onConfigChange]
  );

  const handleVariableChange = useCallback(
    (index: number, data: { field: string; nodeId: string; nodeType: string; name?: string; template?: string }) => {
      const newList = [...ifList];
      newList[index] = {
        ...newList[index],
        field: data.name || data.field,
        nodeId: data.nodeId,
        nodeType: data.nodeType,
        name: data.name,
      };
      onConfigChange('IF', newList);
    },
    [ifList, onConfigChange]
  );

  const needsValue = (condition: ConditionOperator): boolean => {
    return condition !== 'isNull' && condition !== 'isNotNull';
  };

  return (
    <div className="condition-config">
      <Alert
        type="info"
        icon={<ForkOutlined />}
        message="条件判断节点"
        description='若条件满足，则执行"是"分支；否则执行"否"分支。支持多个条件的 AND/OR 逻辑组合。'
        showIcon
        className="condition-alert"
      />

      <Divider />

      <div className="condition-list">
        {ifList.map((item, index) => (
          <div key={index} className="condition-item">
            <div className="condition-row">
              <div className="condition-variable">
                <VariableSelector
                  field={item.field}
                  nodeId={item.nodeId}
                  nodeType={item.nodeType}
                  variables={variables}
                  onChange={data => handleVariableChange(index, data)}
                  placeholder="选择变量"
                />
              </div>
              
              <Select
                value={item.condition}
                onChange={val => handleChange(index, 'condition', val)}
                options={CONDITIONS}
                style={{ width: 120 }}
                placeholder="操作符"
              />
              
              {needsValue(item.condition) && (
                <Input
                  value={item.value}
                  onChange={e => handleChange(index, 'value', e.target.value)}
                  placeholder="输入值"
                  style={{ flex: 1 }}
                />
              )}
              
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(index)}
              />
            </div>
            
            {index < ifList.length - 1 && (
              <div className="condition-operator">
                <Radio.Group
                  value={item.operator || 'OR'}
                  onChange={e => handleChange(index, 'operator', e.target.value)}
                  size="small"
                >
                  <Radio.Button value="AND">AND</Radio.Button>
                  <Radio.Button value="OR">OR</Radio.Button>
                </Radio.Group>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        className="add-condition-btn"
      >
        添加条件
      </Button>

      <Divider />

      <div className="condition-output">
        <label className="config-label">输出变量</label>
        <div className="output-info">
          <div className="output-item">
            <span className="output-name">result</span>
            <span className="output-type">boolean</span>
            <span className="output-desc">条件结果</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionConfig;

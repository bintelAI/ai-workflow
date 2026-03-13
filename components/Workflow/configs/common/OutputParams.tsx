import React, { useCallback } from 'react';
import { Input, Button, Select, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { FlowField, FlowFieldType } from '@/src/types/flow';
import './OutputParams.css';

interface OutputParamsProps {
  value: FlowField[];
  onChange: (params: FlowField[]) => void;
  disabled?: boolean;
  placeholder?: string;
  allowedTypes?: FlowFieldType[];
}

const OUTPUT_TYPES: { label: string; value: FlowFieldType }[] = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '数组', value: 'array' },
  { label: 'JSON', value: 'json' },
  { label: '流', value: 'stream' },
  { label: '任意', value: 'any' },
];

const OutputParams: React.FC<OutputParamsProps> = ({
  value = [],
  onChange,
  disabled = false,
  placeholder,
  allowedTypes,
}) => {
  const typeOptions = allowedTypes
    ? OUTPUT_TYPES.filter(t => allowedTypes.includes(t.value))
    : OUTPUT_TYPES;

  const handleAdd = useCallback(() => {
    onChange([...value, { field: 'output', type: 'string' }]);
  }, [value, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const newValue = [...value];
      newValue.splice(index, 1);
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleChange = useCallback(
    (index: number, key: keyof FlowField, val: any) => {
      const newValue = [...value];
      newValue[index] = { ...newValue[index], [key]: val };
      onChange(newValue);
    },
    [value, onChange]
  );

  return (
    <div className="output-params">
      {!disabled && (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="add-btn"
        >
          添加输出
        </Button>
      )}

      {value.map((item, index) => (
        <div key={index} className="output-params-item">
          <div className="field-name">
            <Input
              value={item.field}
              onChange={e => handleChange(index, 'field', e.target.value)}
              placeholder="字段名"
              disabled={disabled}
            />
          </div>
          <div className="field-type">
            <Select
              value={item.type || 'string'}
              onChange={val => handleChange(index, 'type', val)}
              options={typeOptions}
              disabled={disabled}
              style={{ width: '100%' }}
            />
          </div>
          <div className="field-label">
            <Input
              value={item.label}
              onChange={e => handleChange(index, 'label', e.target.value)}
              placeholder="显示名"
              disabled={disabled}
            />
          </div>
          {!disabled && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(index)}
              className="delete-btn"
            />
          )}
        </div>
      ))}

      {value.length === 0 && placeholder && (
        <Empty description={placeholder} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default OutputParams;

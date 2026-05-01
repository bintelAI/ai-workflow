import React, { useCallback } from 'react';
import { Input, Button, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { FlowField } from '@ai-flow/src/types/flow';
import type { WorkflowVariableMeta } from '../../utils/workflowVariables';
import VariableSelector from './VariableSelector';
import type { VariableSelectionPayload } from '../../utils/variableSelection';
import './InputParams.css';

interface InputParamsProps {
  value: FlowField[];
  onChange: (params: FlowField[]) => void;
  fieldPrefix?: string;
  editField?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputable?: boolean;
  variables?: Array<{
    id: string;
    type?: string;
    label?: string;
    params: FlowField[];
    variables?: WorkflowVariableMeta[];
  }>;
  showVariableSelector?: boolean;
}

const InputParams: React.FC<InputParamsProps> = ({
  value = [],
  onChange,
  fieldPrefix = 'arg',
  editField = true,
  disabled = false,
  placeholder,
  inputable = true,
  variables = [],
  showVariableSelector = true,
}) => {
  const handleAdd = useCallback(() => {
    const newField = `${fieldPrefix}${value.length + 1}`;
    onChange([...value, { field: newField }]);
  }, [value, onChange, fieldPrefix]);

  const handleRemove = useCallback(
    (index: number) => {
      const newValue = [...value];
      newValue.splice(index, 1);
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleFieldChange = useCallback(
    (index: number, field: string) => {
      const newValue = [...value];
      newValue[index] = { ...newValue[index], field };
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleVariableChange = useCallback(
    (index: number, data: VariableSelectionPayload) => {
      const newValue = [...value];
      newValue[index] = {
        ...newValue[index],
        name: data.name,
        nodeId: data.nodeId,
        nodeType: data.nodeType,
        value: data.value,
        template: data.template,
        refPath: data.refPath,
        label: data.label,
      };
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleClear = useCallback(
    (index: number) => {
      const newValue = [...value];
      newValue[index] = {
        ...newValue[index],
        name: '',
        nodeId: '',
        nodeType: '',
        value: '',
        template: '',
        refPath: '',
        label: '',
      };
      onChange(newValue);
    },
    [value, onChange]
  );

  const duplicateFields = value
    .filter((item, index) => value.findIndex(v => v.field === item.field) !== index)
    .map(item => item.field);

  return (
    <div className="input-params">
      {!disabled && (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="add-btn"
        >
          添加参数
        </Button>
      )}

      {value.map((item, index) => (
        <div
          key={index}
          className={`input-params-item ${duplicateFields.includes(item.field) ? 'error' : ''}`}
        >
          <div className="field-name">
            <Input
              value={item.field}
              onChange={e => handleFieldChange(index, e.target.value)}
              placeholder="变量名"
              disabled={!editField || disabled}
              status={duplicateFields.includes(item.field) ? 'error' : undefined}
            />
          </div>
          <div className="field-value">
            {showVariableSelector ? (
              <VariableSelector
                field={item.name || item.field}
                nodeId={item.nodeId}
                nodeType={item.nodeType}
                customValue={item.value}
                value={item.template || item.refPath || item.value}
                variables={variables}
                inputable={inputable}
                disabled={disabled}
                onChange={data => handleVariableChange(index, data)}
                onClear={() => handleClear(index)}
              />
            ) : (
              <Input
                value={item.value}
                onChange={e => {
                  const newValue = [...value];
                  newValue[index] = { ...newValue[index], value: e.target.value };
                  onChange(newValue);
                }}
                placeholder="输入值"
                disabled={disabled}
              />
            )}
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

export default InputParams;

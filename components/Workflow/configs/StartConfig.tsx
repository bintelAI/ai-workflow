import React, { useCallback } from 'react';
import { Input, Select, Switch, Button, Divider, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, BugOutlined } from '@ant-design/icons';
import type { FlowField } from '@/src/types/flow';
import type { VariableType } from '../types';
import './StartConfig.css';

interface VariableConfig {
  name: string;
  displayName: string;
  type: VariableType;
  required: boolean;
  hidden: boolean;
  defaultValue?: any;
  options?: { label: string; value: string }[];
}

interface StartConfigProps {
  config: {
    variables?: VariableConfig[];
    devMode?: boolean;
    devInput?: string;
  };
  onConfigChange: (key: string, value: any) => void;
}

const VARIABLE_TYPES: { label: string; value: VariableType }[] = [
  { label: '文本', value: 'text' },
  { label: '段落', value: 'paragraph' },
  { label: '数字', value: 'number' },
  { label: '下拉选择', value: 'dropdown' },
  { label: '复选框', value: 'checkbox' },
  { label: '文件', value: 'file' },
  { label: '文件列表', value: 'file_list' },
];

const StartConfig: React.FC<StartConfigProps> = ({ config, onConfigChange }) => {
  const variables = config.variables || [];

  const handleAddVariable = useCallback(() => {
    const newVar: VariableConfig = {
      name: `var_${variables.length + 1}`,
      displayName: `变量 ${variables.length + 1}`,
      type: 'text',
      required: false,
      hidden: false,
    };
    onConfigChange('variables', [...variables, newVar]);
  }, [variables, onConfigChange]);

  const handleRemoveVariable = useCallback(
    (index: number) => {
      const newVars = [...variables];
      newVars.splice(index, 1);
      onConfigChange('variables', newVars);
    },
    [variables, onConfigChange]
  );

  const handleVariableChange = useCallback(
    (index: number, key: keyof VariableConfig, value: any) => {
      const newVars = [...variables];
      newVars[index] = { ...newVars[index], [key]: value };
      onConfigChange('variables', newVars);
    },
    [variables, onConfigChange]
  );

  return (
    <div className="start-config">
      <div className="config-section">
        <label className="config-label">输入变量</label>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddVariable}
          className="add-btn"
        >
          添加变量
        </Button>

        {variables.map((v, index) => (
          <div key={index} className="variable-item">
            <div className="variable-row">
              <Input
                value={v.displayName}
                onChange={e => handleVariableChange(index, 'displayName', e.target.value)}
                placeholder="显示名称"
                className="display-name"
              />
              <Input
                value={v.name}
                onChange={e => handleVariableChange(index, 'name', e.target.value)}
                placeholder="变量名"
                className="var-name"
              />
              <Select
                value={v.type}
                onChange={val => handleVariableChange(index, 'type', val)}
                options={VARIABLE_TYPES}
                style={{ width: 120 }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveVariable(index)}
              />
            </div>
            <div className="variable-options">
              <label>
                <Switch
                  size="small"
                  checked={v.required}
                  onChange={val => handleVariableChange(index, 'required', val)}
                />
                <span>必填</span>
              </label>
              <label>
                <Switch
                  size="small"
                  checked={v.hidden}
                  onChange={val => handleVariableChange(index, 'hidden', val)}
                />
                <span>隐藏</span>
              </label>
              <Input
                value={v.defaultValue}
                onChange={e => handleVariableChange(index, 'defaultValue', e.target.value)}
                placeholder="默认值"
                className="default-value"
              />
            </div>
          </div>
        ))}

        {variables.length === 0 && (
          <div className="empty-hint">点击上方按钮添加输入变量</div>
        )}
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">
          <BugOutlined style={{ marginRight: 4 }} />
          模拟数据 (Dev Data)
        </label>
        <div className="dev-mode-toggle">
          <span>启用模拟数据</span>
          <Switch
            checked={config.devMode !== false}
            onChange={val => onConfigChange('devMode', val)}
          />
        </div>
        {config.devMode !== false && (
          <Input.TextArea
            value={config.devInput || ''}
            onChange={e => onConfigChange('devInput', e.target.value)}
            rows={8}
            placeholder='{"key": "value"}'
            className="dev-input"
          />
        )}
      </div>
    </div>
  );
};

export default StartConfig;

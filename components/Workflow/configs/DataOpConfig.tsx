import React, { useCallback } from 'react';
import { Input, Button, Divider, Alert, Select } from 'antd';
import { FunctionOutlined, CodeOutlined } from '@ant-design/icons';
import { InputParams, OutputParams } from './common/index';
import type { FlowField } from '@ai-flow/src/types/flow';
import './DataOpConfig.css';

interface DataOpConfigProps {
  config: {
    inputParams?: FlowField[];
    outputParams?: FlowField[];
    code?: string;
  };
  onConfigChange: (key: string, value: any) => void;
  variables?: Array<{
    id: string;
    type?: string;
    label?: string;
    params: FlowField[];
  }>;
}

const CODE_TEMPLATES = [
  {
    label: '基础转换',
    value: `async function main(params) {
  // params 为输入参数对象
  // 返回转换后的结果
  return params;
}`,
  },
  {
    label: 'JSON 解析',
    value: `async function main(params) {
  const { input } = params;
  try {
    return JSON.parse(input);
  } catch (e) {
    return { error: e.message };
  }
}`,
  },
  {
    label: '字符串处理',
    value: `async function main(params) {
  const { text } = params;
  return {
    upper: text?.toUpperCase(),
    lower: text?.toLowerCase(),
    trim: text?.trim(),
    length: text?.length
  };
}`,
  },
  {
    label: '数组映射',
    value: `async function main(params) {
  const { list } = params;
  return (list || []).map((item, index) => ({
    ...item,
    index
  }));
}`,
  },
];

const DataOpConfig: React.FC<DataOpConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const handleInputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('inputParams', params);
    },
    [onConfigChange]
  );

  const handleOutputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('outputParams', params);
    },
    [onConfigChange]
  );

  const handleCodeChange = (code: string) => {
    onConfigChange('code', code);
  };

  const handleTemplateSelect = (template: string) => {
    onConfigChange('code', template);
  };

  return (
    <div className="data-op-config">
      <Alert
        type="info"
        icon={<FunctionOutlined />}
        message="变量节点"
        description="用于变量转换或赋值，支持 JavaScript 代码编辑。"
        showIcon
        className="data-op-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || [{ field: 'arg1' }]}
          onChange={handleInputParamsChange}
          fieldPrefix="arg"
          variables={variables}
          inputable
        />
      </div>

      <Divider />

      <div className="config-section">
        <div className="section-header">
          <label className="config-label">
            <CodeOutlined style={{ marginRight: 4 }} />
            代码编辑
          </label>
          <Select
            placeholder="选择模板..."
            onChange={handleTemplateSelect}
            style={{ width: 140 }}
            size="small"
            allowClear
          >
            {CODE_TEMPLATES.map(t => (
              <Select.Option key={t.label} value={t.value}>
                {t.label}
              </Select.Option>
            ))}
          </Select>
        </div>
        <Input.TextArea
          value={config.code || CODE_TEMPLATES[0].value}
          onChange={e => handleCodeChange(e.target.value)}
          rows={10}
          className="code-textarea"
          placeholder="编写转换代码..."
        />
        <div className="code-hint">
          <p>params 为输入参数对象，返回值将作为输出变量</p>
        </div>
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <OutputParams
          value={config.outputParams || [{ field: 'arg1', type: 'string' }]}
          onChange={handleOutputParamsChange}
        />
      </div>
    </div>
  );
};

export default DataOpConfig;

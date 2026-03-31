import React, { useCallback } from 'react'
import { Divider, Alert, Input } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { InputParams, OutputParams } from './common/index'
import type { FlowField } from '@ai-flow/src/types/flow'
import './VariableConfig.css'

interface VariableConfigProps {
  config: {
    inputParams?: FlowField[]
    outputParams?: FlowField[]
    code?: string
  }
  onConfigChange: (key: string, value: any) => void
  variables?: Array<{
    id: string
    type?: string
    label?: string
    params: FlowField[]
  }>
}

const DEFAULT_CODE = `async function main(params: Params): Promise<Params> {
  return params;
}`

const VariableConfig: React.FC<VariableConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const handleInputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('inputParams', params)
    },
    [onConfigChange]
  )

  const handleOutputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('outputParams', params)
    },
    [onConfigChange]
  )

  return (
    <div className="variable-config">
      <Alert
        type="info"
        icon={<SettingOutlined />}
        message="变量节点"
        description="变量转换或赋值，支持自定义代码处理变量数据。"
        showIcon
        className="variable-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || [{ field: 'arg1' }]}
          onChange={handleInputParamsChange}
          fieldPrefix="arg"
          variables={variables}
          varInputable
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">代码编辑</label>
        <Input.TextArea
          value={config.code || DEFAULT_CODE}
          onChange={e => onConfigChange('code', e.target.value)}
          rows={10}
          className="code-textarea"
          placeholder="编写变量处理代码..."
        />
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
  )
}

export default VariableConfig

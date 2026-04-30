import React, { useCallback } from 'react'
import { Divider, Alert, Switch } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import { InputParams } from './common/index'
import type { FlowField } from '@ai-flow/src/types/flow'
import './JSONParseConfig.css'

interface JSONParseConfigProps {
  config: {
    inputParams?: FlowField[]
    mode?: 'parse' | 'stringify'
  }
  onConfigChange: (key: string, value: any) => void
  onConfigPatch?: (patch: Record<string, any>) => void
  variables?: Array<{
    id: string
    type?: string
    label?: string
    params: FlowField[]
  }>
}

const JSONParseConfig: React.FC<JSONParseConfigProps> = ({
  config,
  onConfigChange,
  onConfigPatch,
  variables = [],
}) => {
  const isStringifyMode = config.mode === 'stringify'

  const handleInputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('inputParams', params)
    },
    [onConfigChange]
  )

  const handleModeChange = useCallback(
    (checked: boolean) => {
      const patch = {
        mode: checked ? 'stringify' : 'parse',
        outputParams: [{ field: 'json', type: checked ? 'string' : 'object' }],
      }
      if (onConfigPatch) {
        onConfigPatch(patch)
        return
      }
      onConfigChange('mode', patch.mode)
    },
    [onConfigChange, onConfigPatch]
  )

  return (
    <div className="json-parse-config">
      <Alert
        type="info"
        icon={<CodeOutlined />}
        message="JSON转换节点"
        description={isStringifyMode ? '将 JSON 对象转换为 JSON 字符串。' : '将文本内容中的 JSON 字符串转换为对象，支持嵌套解析。'}
        showIcon
        className="json-parse-alert"
      />

      <Divider />

      <div className="config-section">
        <div className="json-parse-switch-row">
          <div>
            <label className="config-label">对象转字符串</label>
            <div className="config-help">开启后，节点会把输入的 JSON 对象转换为 JSON 字符串。</div>
          </div>
          <Switch checked={isStringifyMode} onChange={handleModeChange} />
        </div>
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || [{ field: 'text', type: 'string' }]}
          onChange={handleInputParamsChange}
          fieldPrefix="text"
          variables={variables}
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <div className="output-info">
          <div className="output-item">
            <span className="output-name">json</span>
            <span className="output-type">{isStringifyMode ? 'string' : 'object'}</span>
            <span className="output-desc">输出内容</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JSONParseConfig

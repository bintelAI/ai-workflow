import React, { useCallback } from 'react'
import { Divider, Alert } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import { InputParams } from './common/index'
import type { FlowField } from '@/src/types/flow'
import './JSONParseConfig.css'

interface JSONParseConfigProps {
  config: {
    inputParams?: FlowField[]
  }
  onConfigChange: (key: string, value: any) => void
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
  variables = [],
}) => {
  const handleInputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('inputParams', params)
    },
    [onConfigChange]
  )

  return (
    <div className="json-parse-config">
      <Alert
        type="info"
        icon={<CodeOutlined />}
        message="JSON解析节点"
        description="将文本内容中的JSON字符串转换为对象，支持嵌套解析。"
        showIcon
        className="json-parse-alert"
      />

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
            <span className="output-type">object</span>
            <span className="output-desc">输出内容</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JSONParseConfig

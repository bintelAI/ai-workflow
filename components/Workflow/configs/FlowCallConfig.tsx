import React, { useState, useEffect, useCallback } from 'react'
import { Select, Divider, Alert, Empty, Spin } from 'antd'
import { BranchesOutlined } from '@ant-design/icons'
import { InputParams, OutputParams } from './common/index'
import { flowConfigApi } from '@/src/api/flow'
import { useWorkflowStore } from '../store/useWorkflowStore'
import type { FlowField } from '@/src/types/flow'
import './FlowCallConfig.css'

interface FlowCallConfigProps {
  config: {
    inputParams?: FlowField[]
    outputParams?: FlowField[]
    flowId?: number
  }
  onConfigChange: (key: string, value: any) => void
  variables?: Array<{
    id: string
    type?: string
    label?: string
    params: FlowField[]
  }>
}

interface FlowItem {
  id: number
  name: string
  label?: string
  description?: string
}

const FlowCallConfig: React.FC<FlowCallConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const teamId = useWorkflowStore(state => state.teamId)
  const [flowList, setFlowList] = useState<FlowItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (teamId) {
      loadFlowList()
    }
  }, [teamId])

  const loadFlowList = async () => {
    if (!teamId) return
    setLoading(true)
    try {
      const res = await flowConfigApi.getFlows(teamId)
      setFlowList(res.data || [])
    } catch (error) {
      console.error('Failed to load flow list:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleFlowSelect = (flowId: number) => {
    onConfigChange('flowId', flowId)
  }

  return (
    <div className="flow-call-config">
      <Alert
        type="info"
        icon={<BranchesOutlined />}
        message="流程节点"
        description="执行其他工作流，实现流程复用和模块化。"
        showIcon
        className="flow-call-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">
          选择流程
          <span className="required">*</span>
        </label>
        <Spin spinning={loading}>
          <Select
            placeholder="选择要调用的流程..."
            value={config.flowId}
            onChange={handleFlowSelect}
            style={{ width: '100%' }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {flowList.map(flow => (
              <Select.Option key={flow.id} value={flow.id}>
                {flow.label || flow.name}
              </Select.Option>
            ))}
          </Select>
        </Spin>
        {flowList.length === 0 && !loading && (
          <Empty description="暂无可用的流程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || []}
          onChange={handleInputParamsChange}
          variables={variables}
          disabled
          editField={false}
          placeholder="请先选择流程"
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <OutputParams
          value={config.outputParams || []}
          onChange={handleOutputParamsChange}
          editField={false}
          editType={false}
          op={false}
        />
      </div>
    </div>
  )
}

export default FlowCallConfig

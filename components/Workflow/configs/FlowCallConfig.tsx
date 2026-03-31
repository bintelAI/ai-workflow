import React, { useState, useEffect, useCallback } from 'react'
import { Select, Divider, Alert, Empty, Spin } from 'antd'
import { BranchesOutlined } from '@ant-design/icons'
import { InputParams, OutputParams } from './common/index'
import { flowConfigApi, flowInfoApi } from '@ai-flow/src/api/flow'
import { useWorkflowStore } from '../store/useWorkflowStore'
import type { FlowField } from '@ai-flow/src/types/flow'
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

const normalizeFlowField = (field: any, fallbackField: string): FlowField => ({
  field: field?.field || field?.name || fallbackField,
  name: field?.name || field?.field || fallbackField,
  type: field?.type || 'string',
  required: Boolean(field?.required),
  label: field?.label || field?.name || field?.field || fallbackField,
  value: field?.value,
})

const extractFlowParams = (draftNode: any) => {
  const data = draftNode?.data || {}
  const inputParams = Array.isArray(data.inputParams)
    ? data.inputParams.map((item: any, index: number) =>
        normalizeFlowField(item, item?.field || item?.name || `input_${index + 1}`)
      )
    : []

  const outputParams = Array.isArray(data.outputParams)
    ? data.outputParams.map((item: any, index: number) =>
        normalizeFlowField(item, item?.field || item?.name || `output_${index + 1}`)
      )
    : []

  return { inputParams, outputParams }
}

const FlowCallConfig: React.FC<FlowCallConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const teamId = useWorkflowStore(state => state.teamId)
  const [flowList, setFlowList] = useState<FlowItem[]>([])
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

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

  const syncFlowParams = useCallback(
    async (flowId?: number) => {
      if (!teamId || !flowId) {
        onConfigChange('inputParams', [])
        onConfigChange('outputParams', [])
        return
      }

      setDetailLoading(true)
      try {
        const res = await flowInfoApi.info(flowId, teamId)
        const draft = res?.data?.draft
        const startNode = draft?.nodes?.find((node: any) => node?.type === 'start')
        const endNode = [...(draft?.nodes || [])].reverse().find((node: any) => node?.type === 'end')
        const { inputParams } = extractFlowParams(startNode)
        const { outputParams } = extractFlowParams(endNode)
        onConfigChange('inputParams', inputParams)
        onConfigChange('outputParams', outputParams)
      } catch (error) {
        console.error('Failed to load flow detail:', error)
        onConfigChange('inputParams', [])
        onConfigChange('outputParams', [])
      } finally {
        setDetailLoading(false)
      }
    },
    [teamId, onConfigChange]
  )

  useEffect(() => {
    if (config.flowId) {
      syncFlowParams(config.flowId)
    }
  }, [config.flowId, syncFlowParams])

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

  const handleFlowSelect = async (flowId?: number) => {
    onConfigChange('flowId', flowId)
    await syncFlowParams(flowId)
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
        <Spin spinning={loading || detailLoading}>
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

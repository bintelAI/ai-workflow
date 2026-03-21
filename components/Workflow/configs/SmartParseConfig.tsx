import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Select, Input, Divider, Alert, Empty, Spin, Popover } from 'antd'
import { SearchOutlined, CheckOutlined, DownOutlined, BulbOutlined } from '@ant-design/icons'
import { InputParams, OutputParams } from './common/index'
import { flowConfigApi } from '@/src/api/flow'
import { useWorkflowStore } from '../store/useWorkflowStore'
import type { FlowField } from '@/src/types/flow'
import './SmartParseConfig.css'

interface SmartParseConfigProps {
  config: {
    inputParams?: FlowField[]
    outputParams?: FlowField[]
    model?: string
    supplier?: string
    supplierName?: string
    configId?: number
    comm?: any
  }
  onConfigChange: (key: string, value: any) => void
  variables?: Array<{
    id: string
    type?: string
    label?: string
    params: FlowField[]
  }>
}

interface ModelGroup {
  id: number
  title: string
  type: string
  select: string[]
  options: any[]
  comm?: any
}

const SmartParseConfig: React.FC<SmartParseConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const teamId = useWorkflowStore(state => state.teamId)
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([])
  const [modelLoading, setModelLoading] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false)

  useEffect(() => {
    if (teamId) {
      loadModels()
    }
  }, [teamId])

  const loadModels = async () => {
    if (!teamId) return
    setModelLoading(true)
    try {
      const res = await flowConfigApi.getModels(teamId)
      const groups: ModelGroup[] = (res.data as any[] || []).map((e: any) => ({
        id: e.id,
        title: e.name,
        type: e.type,
        select: e.options?.options?.find((o: any) => o.field === 'model')?.select || [],
        options: e.options?.options?.filter((o: any) => o.field !== 'model') || [],
        comm: e.options?.comm,
      }))
      setModelGroups(groups)
      
      if (!config.model && groups.length > 0 && groups[0].select.length > 0) {
        onConfigChange('model', groups[0].select[0])
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setModelLoading(false)
    }
  }

  const filteredGroups = useMemo(() => {
    if (!modelSearch) return modelGroups
    return modelGroups.filter(g =>
      g.title.toLowerCase().includes(modelSearch.toLowerCase()) ||
      g.select.some(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
    )
  }, [modelGroups, modelSearch])

  const currentModelGroup = useMemo(() => {
    if (!config.model) return undefined
    if (config.configId) {
      const matchedById = modelGroups.find(g => g.id === config.configId && g.select.includes(config.model || ''))
      if (matchedById) return matchedById
    }
    return modelGroups.find(g => g.select.includes(config.model || ''))
  }, [modelGroups, config.configId, config.model])

  useEffect(() => {
    if (!config.model || modelGroups.length === 0) {
      return
    }

    const matchedGroup = currentModelGroup
    if (!matchedGroup) {
      return
    }

    if (config.configId !== matchedGroup.id) {
      onConfigChange('configId', matchedGroup.id)
    }

    if (config.supplier !== matchedGroup.type) {
      onConfigChange('supplier', matchedGroup.type)
    }

    if (config.supplierName !== matchedGroup.title) {
      onConfigChange('supplierName', matchedGroup.title)
    }

    if (config.comm !== matchedGroup.comm) {
      onConfigChange('comm', matchedGroup.comm)
    }
  }, [
    currentModelGroup,
    modelGroups,
    config.model,
    config.configId,
    config.supplier,
    config.supplierName,
    config.comm,
    onConfigChange,
  ])

  const handleModelSelect = (modelName: string, group: ModelGroup) => {
    onConfigChange('model', modelName)
    onConfigChange('supplier', group.type)
    onConfigChange('supplierName', group.title)
    onConfigChange('configId', group.id)
    onConfigChange('comm', group.comm)
    setModelPopoverOpen(false)
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

  return (
    <div className="smart-parse-config">
      <Alert
        type="info"
        icon={<BulbOutlined />}
        message="智能解析节点"
        description="智能提取内容的关键信息，通过 LLM 自动识别并提取结构化数据。"
        showIcon
        className="smart-parse-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || [{ field: 'text' }]}
          onChange={handleInputParamsChange}
          fieldPrefix="text"
          variables={variables}
          editField={false}
          disabled
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">模型</label>
        <Popover
          open={modelPopoverOpen}
          onOpenChange={setModelPopoverOpen}
          trigger="click"
          placement="bottomLeft"
          overlayClassName="model-selector-popover"
          arrow={false}
          content={
            <Spin spinning={modelLoading}>
              <div className="model-selector">
                <div className="model-search">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="搜索模型"
                    value={modelSearch}
                    onChange={e => setModelSearch(e.target.value)}
                    allowClear
                  />
                </div>
                <div className="model-list">
                  {filteredGroups.length === 0 ? (
                    <Empty description="未找到匹配项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    filteredGroups.map(group => (
                      <div key={group.id} className="model-group">
                        <div className="model-group-label">{group.title}</div>
                        {group.select.map(model => (
                          <div
                            key={model}
                            className={`model-item ${config.model === model ? 'active' : ''}`}
                            onClick={() => handleModelSelect(model, group)}
                          >
                            <span>{model}</span>
                            {config.model === model && <CheckOutlined className="check-icon" />}
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Spin>
          }
        >
          <div className="model-selector-trigger">
            <span className={config.model ? '' : 'placeholder'}>
              {config.model || '选择模型'}
            </span>
            <DownOutlined className="arrow-icon" />
          </div>
        </Popover>
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <OutputParams
          value={config.outputParams || [{ field: 'result', type: '输入结果' }]}
          onChange={handleOutputParamsChange}
          typeInput
          disabledFields={['result']}
        />
      </div>
    </div>
  )
}

export default SmartParseConfig

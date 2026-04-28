import React, { useState, useEffect, useCallback } from 'react'
import { useWorkflowStore } from './store/useWorkflowStore'
import { WorkflowNodeType } from './types'
import { X, Save, Trash2, Wand2, PlayCircle } from 'lucide-react'

// Import configuration components
import LoopConfig from './configs/LoopConfig'
import StartConfig from './configs/StartConfig'
import { EndConfig } from './configs/EndConfig'
import ScriptConfig from './configs/ScriptConfig'
import LLMConfig from './configs/LLMConfig'
import { APICallConfig } from './configs/APICallConfig'
import ConditionConfig from './configs/ConditionConfig'
import { DelayConfig } from './configs/DelayConfig'
import { NotificationConfig } from './configs/NotificationConfig'
import { ApprovalConfig } from './configs/ApprovalConfig'
import DataOpConfig from './configs/DataOpConfig'
import { CCConfig } from './configs/CCConfig'
import { SQLConfig } from './configs/SQLConfig'
import KnowledgeRetrievalConfig from './configs/KnowledgeRetrievalConfig'
import DocumentExtractorConfig from './configs/DocumentExtractorConfig'
import { CloudPhoneConfig } from './configs/CloudPhoneConfig'
import { StorageConfigPanel } from './configs/StorageConfig'
import QuestionClassifierConfig from './configs/QuestionClassifierConfig'
import JSONParseConfig from './configs/JSONParseConfig'
import SmartParseConfig from './configs/SmartParseConfig'
import FlowCallConfig from './configs/FlowCallConfig'
import VariableConfig from './configs/VariableConfig'
import { NodeOutputPreview } from './configs/NodeOutputPreview'
import { buildLoopBodyOutputCatalog, buildVariableCatalog } from './utils/workflowVariables'

// Import common components from configs/common.tsx
import { AIButton } from './configs/common'
import type { WorkflowPluginModeType } from './config/pluginModeRegistry'

const BACKEND_SUPPORTED_NODE_TYPES = new Set<WorkflowNodeType>([
  WorkflowNodeType.START,
  WorkflowNodeType.END,
  WorkflowNodeType.LLM,
  WorkflowNodeType.SCRIPT,
  WorkflowNodeType.CONDITION,
  WorkflowNodeType.QUESTION_CLASSIFIER,
  WorkflowNodeType.KNOWLEDGE_RETRIEVAL,
  WorkflowNodeType.VARIABLE,
  WorkflowNodeType.JSON_PARSE,
  WorkflowNodeType.SMART_PARSE,
  WorkflowNodeType.FLOW_CALL,
  WorkflowNodeType.LOOP,
])

interface ConfigPanelRuntimeProps {
  pluginType?: WorkflowPluginModeType
  teamId?: string | null
  projectId?: string | null
}

const ConfigPanel: React.FC<ConfigPanelRuntimeProps> = ({ pluginType, teamId, projectId }) => {
  const {
    nodes,
    edges,
    globalVariables,
    selectedNodeId,
    updateNodeData,
    setSelectedNode,
    deleteNode,
    aiAutocompleteConfig,
    runFlow,
  } = useWorkflowStore()
  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const availableVariables = selectedNode
    ? buildVariableCatalog({
        nodes,
        edges,
        currentNodeId: selectedNode.id,
        globalVariables,
        scope: 'upstream',
      })
    : []
  const loopBodyOutputVariables = selectedNode?.type === WorkflowNodeType.LOOP
    ? buildLoopBodyOutputCatalog(nodes, selectedNode.id)
    : []
  const isBackendSupportedNode = selectedNode ? BACKEND_SUPPORTED_NODE_TYPES.has(selectedNode.type as WorkflowNodeType) : false
  const [loadingField, setLoadingField] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(450)
  const [isResizing, setIsResizing] = useState(false)
  const panelContainerRef = React.useRef<HTMLDivElement>(null)

  // ... (Resizing logic)
  const startResizing = useCallback(() => setIsResizing(true), [])
  const stopResizing = useCallback(() => setIsResizing(false), [])
  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return
      const containerRect = panelContainerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      const newWidth = containerRect.right - e.clientX
      if (newWidth >= 320 && newWidth <= 800) {
        setPanelWidth(newWidth)
      }
    },
    [isResizing]
  )

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  useEffect(() => {
    const handleFocusNodeConfig = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId?: string }>
      const nodeId = customEvent.detail?.nodeId
      if (!nodeId) return
      setSelectedNode(nodeId)
    }

    window.addEventListener('workflow-open-node-config', handleFocusNodeConfig as EventListener)
    return () => {
      window.removeEventListener('workflow-open-node-config', handleFocusNodeConfig as EventListener)
    }
  }, [setSelectedNode])

  if (!selectedNode) return null // Or empty state

  const handleChange = (field: string, value: any) => {
    updateNodeData(selectedNode.id, { [field]: value })
  }

  const handleConfigChange = (key: string, value: any) => {
    const currentConfig = selectedNode.data.config || {}
    updateNodeData(selectedNode.id, {
      config: { ...currentConfig, [key]: value },
    })
  }

  const handleConfigPatch = (patch: Record<string, any>) => {
    const currentConfig = selectedNode.data.config || {}
    updateNodeData(selectedNode.id, {
      config: { ...currentConfig, ...patch },
    })
  }

  const handleAIGenerate = async (field: string, isConfig: boolean) => {
    setLoadingField(field)
    try {
      const context = isConfig
        ? JSON.stringify(selectedNode.data.config || {})
        : selectedNode.data.label || selectedNode.type || ''
      const result = await aiAutocompleteConfig(field, context)
      if (isConfig) {
        handleConfigChange(field, result)
      } else {
        handleChange(field, result)
      }
    } finally {
      setLoadingField(null)
    }
  }

  const handleNodeDebug = async () => {
    if (!selectedNode || !isBackendSupportedNode) return
    try {
      await runFlow({ nodeId: selectedNode.id })
    } catch (error) {
      console.error('Node debug failed:', error)
    }
  }

  const renderAdvancedConfig = () => {
    const config: any = selectedNode.data.config || {}

    switch (selectedNode.type) {
      case WorkflowNodeType.LOOP:
        return <LoopConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} loopBodyVariables={loopBodyOutputVariables} />
      case WorkflowNodeType.START:
        return (
          <StartConfig
            config={config}
            onConfigChange={handleConfigChange}
            pluginType={pluginType}
            teamId={teamId}
            projectId={projectId}
          />
        )
      case WorkflowNodeType.END:
        return <EndConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      case WorkflowNodeType.SCRIPT:
        return <ScriptConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      case WorkflowNodeType.LLM:
        return (
          <LLMConfig
            config={config}
            onConfigChange={handleConfigChange}
            onConfigPatch={handleConfigPatch}
            loadingField={loadingField}
            onAIGenerate={handleAIGenerate}
            variables={availableVariables}
          />
        )
      case WorkflowNodeType.API_CALL:
        return <APICallConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.CONDITION:
        return <ConditionConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      case WorkflowNodeType.DELAY:
        return <DelayConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.NOTIFICATION:
        return <NotificationConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.APPROVAL:
        return <ApprovalConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.DATA_OP:
        return <DataOpConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.CC:
        return <CCConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.SQL:
        return <SQLConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.KNOWLEDGE_RETRIEVAL:
        return <KnowledgeRetrievalConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      case WorkflowNodeType.DOCUMENT_EXTRACTOR:
        return <DocumentExtractorConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.CLOUD_PHONE:
        return <CloudPhoneConfig config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.STORAGE:
        return <StorageConfigPanel config={config} onConfigChange={handleConfigChange} />
      case WorkflowNodeType.QUESTION_CLASSIFIER:
        return <QuestionClassifierConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      case WorkflowNodeType.JSON_PARSE:
        return <JSONParseConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      case WorkflowNodeType.SMART_PARSE:
        return <SmartParseConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      case WorkflowNodeType.FLOW_CALL:
        return <FlowCallConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      case WorkflowNodeType.VARIABLE:
        return <VariableConfig config={config} onConfigChange={handleConfigChange} variables={availableVariables} />
      default:
        return (
          <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            当前节点类型 ({selectedNode.type}) 暂无特定高级配置。
          </div>
        )
    }
  }

  return (
    <aside
      ref={panelContainerRef}
      className="bg-white border-l border-slate-200 h-full flex flex-col shrink-0 shadow-xl z-20 relative group"
      style={{ width: panelWidth, minWidth: panelWidth, maxWidth: panelWidth }}
    >
      <div
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-30 flex items-center justify-center opacity-0 group-hover:opacity-100"
        onMouseDown={startResizing}
      />

      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
        <div>
          <h2 className="font-bold text-slate-800 flex items-center gap-2">节点配置</h2>
          <p className="text-xs text-slate-500">Type: {selectedNode.type}</p>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-5 overflow-y-auto space-y-6">
          {!isBackendSupportedNode && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              当前节点未接入后端执行器，建议仅用于查看或迁移占位，不要作为可运行节点使用。
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">节点名称</label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={e => handleChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">描述</label>
                <AIButton
                  field="description"
                  onGenerate={async field => {
                    setLoadingField(field)
                    try {
                      const context = selectedNode.data.label || selectedNode.type || 'generic'
                      const result = await aiAutocompleteConfig(field, context)
                      handleChange(field, result)
                    } finally {
                      setLoadingField(null)
                    }
                  }}
                  loadingField={loadingField}
                />
              </div>
              <textarea
                rows={2}
                value={selectedNode.data.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-slate-200 my-2"></div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Wand2 size={14} className="text-indigo-500" /> 高级设置
            </h3>
            {renderAdvancedConfig()}

            <NodeOutputPreview node={selectedNode} />
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
        <button
          onClick={() => setSelectedNode(null)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
        >
          <Save size={16} /> 完成
        </button>
        {isBackendSupportedNode && selectedNode.type !== WorkflowNodeType.START && selectedNode.type !== WorkflowNodeType.END && (
          <button
            onClick={handleNodeDebug}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
          >
            <PlayCircle size={16} /> 调试
          </button>
        )}
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </aside>
  )
}

export default ConfigPanel

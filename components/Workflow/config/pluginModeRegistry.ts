import { WorkflowNodeType, type WorkflowCategory, type LayoutDirection } from '../types'
import { getConfigurableNodeTypes, isNodeConfigurable } from './nodeCapabilities'

export type WorkflowPluginModeType = 'all' | 'ai' | 'approval' | 'automation'

export interface WorkflowPluginMode {
  type: WorkflowPluginModeType
  categoryId: string
  name: string
  description: string
  allowedNodeTypes: WorkflowNodeType[]
  layoutDirection?: LayoutDirection
  isSystem: true
}

export const isNewWorkflowNodeTypeAllowed = (
  type: WorkflowNodeType,
  mode: WorkflowPluginModeType = DEFAULT_PLUGIN_MODE
) => isNodeConfigurable(type, mode)

export const filterNewWorkflowNodeTypes = (
  nodeTypes: readonly WorkflowNodeType[],
  mode: WorkflowPluginModeType = DEFAULT_PLUGIN_MODE
) => nodeTypes.filter(type => isNewWorkflowNodeTypeAllowed(type, mode))

export const PLUGIN_MODE_REGISTRY: Record<WorkflowPluginModeType, WorkflowPluginMode> = {
  all: {
    type: 'all',
    categoryId: 'general',
    name: '全功能模式',
    description: '包含所有可用节点，适用于复杂混合场景。',
    allowedNodeTypes: getConfigurableNodeTypes('all'),
    layoutDirection: 'vertical',
    isSystem: true,
  },
  ai: {
    type: 'ai',
    categoryId: 'ai_agent',
    name: 'AI Agent 编排',
    description: '专注于 LLM 调用、数据处理和 API 集成。',
    allowedNodeTypes: getConfigurableNodeTypes('ai'),
    layoutDirection: 'vertical',
    isSystem: true,
  },
  approval: {
    type: 'approval',
    categoryId: 'business_approval',
    name: '行政审批流 (BPM)',
    description: '包含审批、抄送、条件、通知、数据处理与外部集成节点。',
    allowedNodeTypes: getConfigurableNodeTypes('approval'),
    layoutDirection: 'vertical',
    isSystem: true,
  },
  automation: {
    type: 'automation',
    categoryId: 'automation',
    name: '自动化工作流',
    description: '专注于流程调用、接口、数据处理、脚本与通知等自动化编排。',
    allowedNodeTypes: getConfigurableNodeTypes('automation'),
    layoutDirection: 'vertical',
    isSystem: true,
  },
}

export const DEFAULT_PLUGIN_MODE: WorkflowPluginModeType = 'all'

export const getPluginMode = (type?: string | null): WorkflowPluginMode => {
  if (type === 'ai' || type === 'ai_analysis') return PLUGIN_MODE_REGISTRY.ai
  if (type === 'approval') return PLUGIN_MODE_REGISTRY.approval
  if (type === 'automation') return PLUGIN_MODE_REGISTRY.automation
  return PLUGIN_MODE_REGISTRY.all
}

export const getPluginModeByCategoryId = (categoryId?: string | null) =>
  Object.values(PLUGIN_MODE_REGISTRY).find(mode => mode.categoryId === categoryId)

export const getPluginModeByFlowType = (flowType?: number | null): WorkflowPluginMode => {
  if (flowType === 2) return PLUGIN_MODE_REGISTRY.ai
  if (flowType === 3) return PLUGIN_MODE_REGISTRY.approval
  return PLUGIN_MODE_REGISTRY.all
}

export const getDefaultCategoriesFromPluginModes = (): WorkflowCategory[] =>
  Object.values(PLUGIN_MODE_REGISTRY).map(mode => ({
    id: mode.categoryId,
    name: mode.name,
    description: mode.description,
    allowedNodeTypes: mode.allowedNodeTypes,
    layoutDirection: mode.layoutDirection,
    isSystem: mode.isSystem,
  }))

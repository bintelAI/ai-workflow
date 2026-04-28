import { WorkflowNodeType, type WorkflowCategory, type LayoutDirection } from '../types'

export type WorkflowPluginModeType = 'all' | 'ai' | 'approval'

export interface WorkflowPluginMode {
  type: WorkflowPluginModeType
  categoryId: string
  name: string
  description: string
  allowedNodeTypes: WorkflowNodeType[]
  layoutDirection?: LayoutDirection
  isSystem: true
}

const APPROVAL_EXCLUDED_NODE_TYPES = [
  WorkflowNodeType.LLM,
  WorkflowNodeType.QUESTION_CLASSIFIER,
  WorkflowNodeType.KNOWLEDGE_RETRIEVAL,
  WorkflowNodeType.DOCUMENT_EXTRACTOR,
  WorkflowNodeType.JSON_PARSE,
  WorkflowNodeType.SMART_PARSE,
] as const

const APPROVAL_ALLOWED_NODE_TYPES = Object.values(WorkflowNodeType).filter(
  type => !APPROVAL_EXCLUDED_NODE_TYPES.includes(type as any)
)

export const PLUGIN_MODE_REGISTRY: Record<WorkflowPluginModeType, WorkflowPluginMode> = {
  all: {
    type: 'all',
    categoryId: 'general',
    name: '全功能模式',
    description: '包含所有可用节点，适用于复杂混合场景。',
    allowedNodeTypes: Object.values(WorkflowNodeType),
    layoutDirection: 'vertical',
    isSystem: true,
  },
  ai: {
    type: 'ai',
    categoryId: 'ai_agent',
    name: 'AI Agent 编排',
    description: '专注于 LLM 调用、数据处理和 API 集成。',
    allowedNodeTypes: [
      WorkflowNodeType.START,
      WorkflowNodeType.END,
      WorkflowNodeType.LLM,
      WorkflowNodeType.QUESTION_CLASSIFIER,
      WorkflowNodeType.KNOWLEDGE_RETRIEVAL,
      WorkflowNodeType.DOCUMENT_EXTRACTOR,
      WorkflowNodeType.JSON_PARSE,
      WorkflowNodeType.SMART_PARSE,
      WorkflowNodeType.FLOW_CALL,
      WorkflowNodeType.VARIABLE,
      WorkflowNodeType.API_CALL,
      WorkflowNodeType.DATA_OP,
      WorkflowNodeType.SQL,
      WorkflowNodeType.SCRIPT,
      WorkflowNodeType.CONDITION,
      WorkflowNodeType.LOOP,
      WorkflowNodeType.DELAY,
      WorkflowNodeType.NOTIFICATION,
    ],
    layoutDirection: 'vertical',
    isSystem: true,
  },
  approval: {
    type: 'approval',
    categoryId: 'business_approval',
    name: '行政审批流 (BPM)',
    description: '包含审批、抄送、条件、通知、数据处理与外部集成节点。',
    allowedNodeTypes: APPROVAL_ALLOWED_NODE_TYPES,
    layoutDirection: 'vertical',
    isSystem: true,
  },
}

export const DEFAULT_PLUGIN_MODE: WorkflowPluginModeType = 'all'

export const getPluginMode = (type?: string | null): WorkflowPluginMode => {
  if (type === 'ai') return PLUGIN_MODE_REGISTRY.ai
  if (type === 'approval') return PLUGIN_MODE_REGISTRY.approval
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

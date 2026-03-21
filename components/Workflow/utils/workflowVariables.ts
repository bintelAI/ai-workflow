import type { Edge, Node } from 'reactflow'
import type { FlowField } from '@/src/types/flow'
import { DEFAULT_DEV_INPUT } from '../store/useWorkflowStore'
import { WorkflowNodeType, type VariableConfig, type WorkflowNode } from '../types'
import { flattenObject } from '../configs/common'

export type VariableSourceScope = 'payload' | 'global' | 'system' | 'loop' | 'node'

export interface WorkflowVariableMeta {
  key: string
  scope: VariableSourceScope
  path: string
  template: string
  name: string
  label: string
  type?: string
  nodeId?: string
  nodeType?: string
  nodeLabel?: string
  description?: string
  value?: any
}

export interface WorkflowVariableGroup {
  id: string
  type?: string
  label: string
  source: VariableSourceScope
  params: FlowField[]
  variables: WorkflowVariableMeta[]
}

interface BuildVariableCatalogOptions {
  nodes: Node[]
  edges: Edge[]
  currentNodeId?: string | null
  globalVariables?: VariableConfig[]
  scope?: 'upstream' | 'internal' | 'all'
}

interface ParsedTemplateRef {
  raw: string
  template: string
  path: string
  kind: VariableSourceScope | 'unknown'
  nodeId?: string
  nodeType?: string
  name?: string
}

interface OutputSchemaItem {
  field: string
  type: string
  description: string
}

const SYSTEM_VARIABLES: WorkflowVariableMeta[] = [
  {
    key: 'system:timestamp',
    scope: 'system',
    path: 'system.timestamp',
    template: '{{system.timestamp}}',
    name: 'timestamp',
    label: '当前时间 (ISO)',
    type: 'date',
    description: '当前执行时间',
  },
  {
    key: 'system:workflow_id',
    scope: 'system',
    path: 'system.workflow_id',
    template: '{{system.workflow_id}}',
    name: 'workflow_id',
    label: '工作流 ID',
    type: 'string',
    description: '当前工作流标识',
  },
  {
    key: 'system:execution_id',
    scope: 'system',
    path: 'system.execution_id',
    template: '{{system.execution_id}}',
    name: 'execution_id',
    label: '执行 ID',
    type: 'string',
    description: '当前执行请求标识',
  },
]

const LOOP_VARIABLES: WorkflowVariableMeta[] = [
  {
    key: 'loop:item',
    scope: 'loop',
    path: 'loop.item',
    template: '{{loop.item}}',
    name: 'item',
    label: '当前项 (Item)',
    type: 'object',
    description: '循环当前项',
  },
  {
    key: 'loop:index',
    scope: 'loop',
    path: 'loop.index',
    template: '{{loop.index}}',
    name: 'index',
    label: '当前索引 (Index)',
    type: 'number',
    description: '循环当前索引',
  },
]

export const buildVariableTemplate = (meta: Pick<WorkflowVariableMeta, 'template' | 'scope' | 'path' | 'nodeId' | 'nodeType' | 'name'>): string => {
  if (meta.template) return meta.template
  if (meta.scope === 'node' && meta.nodeId && meta.name) {
    return `{{nodes.${meta.nodeId}.${meta.name}}}`
  }
  if (meta.path) {
    return `{{${meta.path}}}`
  }
  return ''
}

export const normalizeLegacyTemplate = (text: string, nodes: Node[] = []): string => {
  if (!text || typeof text !== 'string') return text

  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, rawPath) => {
    const path = String(rawPath || '').trim()

    if (path.startsWith('payload.') || path.startsWith('global.') || path.startsWith('system.') || path.startsWith('loop.') || path.startsWith('nodes.')) {
      return `{{${path}}}`
    }

    const parts = path.split('.')
    if (parts.length >= 2) {
      const nodeId = parts[0]
      const field = parts.slice(1).join('.')
      const node = nodes.find(item => item.id === nodeId)
      if (node) {
        return `{{nodes.${nodeId}.${field}}}`
      }
    }

    return match
  })
}

export const parseVariableTemplate = (template: string, nodes: Node[] = []): ParsedTemplateRef[] => {
  if (!template || typeof template !== 'string') return []

  const normalized = normalizeLegacyTemplate(template, nodes)
  const matches = [...normalized.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)]

  return matches.map(match => {
    const raw = match[0]
    const path = String(match[1] || '').trim()

    if (path.startsWith('payload.')) {
      return {
        raw,
        template: `{{${path}}}`,
        path,
        kind: 'payload',
        name: path.slice('payload.'.length),
      }
    }

    if (path.startsWith('global.')) {
      return {
        raw,
        template: `{{${path}}}`,
        path,
        kind: 'global',
        name: path.slice('global.'.length),
      }
    }

    if (path.startsWith('system.')) {
      return {
        raw,
        template: `{{${path}}}`,
        path,
        kind: 'system',
        name: path.slice('system.'.length),
      }
    }

    if (path.startsWith('loop.')) {
      return {
        raw,
        template: `{{${path}}}`,
        path,
        kind: 'loop',
        name: path.slice('loop.'.length),
      }
    }

    if (path.startsWith('nodes.')) {
      const rest = path.slice('nodes.'.length)
      const parts = rest.split('.')
      if (parts.length >= 2) {
        const nodeId = parts[0]
        const name = parts.slice(1).join('.')
        const node = nodes.find(item => item.id === nodeId)
        return {
          raw,
          template: `{{${path}}}`,
          path,
          kind: 'node',
          nodeId,
          nodeType: node?.type,
          name,
        }
      }
    }

    return {
      raw,
      template: raw,
      path,
      kind: 'unknown',
    }
  })
}

export const extractVariableTemplates = (text: string, nodes: Node[] = []): ParsedTemplateRef[] => {
  return parseVariableTemplate(text, nodes)
}

export const getNodeOutputSchema = (node: Node): OutputSchemaItem[] => {
  const config: any = node.data?.config || {}

  switch (node.type) {
    case WorkflowNodeType.START: {
      const variablesConfig = config.variables || []
      if (Array.isArray(variablesConfig) && variablesConfig.length > 0) {
        return variablesConfig.map((item: VariableConfig) => ({
          field: item.name,
          type: normalizeVariableType(item.type),
          description: item.displayName || item.name,
        }))
      }

      try {
        const parsed = JSON.parse(config.devInput || DEFAULT_DEV_INPUT)
        return Object.keys(parsed || {}).map(key => ({
          field: key,
          type: detectValueType(parsed[key]),
          description: '开始节点输入变量',
        }))
      } catch {
        return []
      }
    }
    case WorkflowNodeType.LLM:
      return [
        { field: 'text', type: 'string', description: '回复内容' },
        { field: 'stream', type: 'stream', description: '流式输出' },
      ]
    case WorkflowNodeType.API_CALL:
      return [
        { field: 'data', type: 'object', description: '响应体' },
        { field: 'status', type: 'number', description: '状态码' },
        { field: 'headers', type: 'object', description: '响应头' },
      ]
    case WorkflowNodeType.SCRIPT:
    case WorkflowNodeType.DATA_OP:
      return [{ field: 'result', type: 'any', description: '执行结果' }]
    case WorkflowNodeType.CONDITION:
      return [{ field: 'result', type: 'boolean', description: '条件结果' }]
    case WorkflowNodeType.LOOP:
      return [{ field: 'result', type: 'array', description: '循环聚合结果' }]
    case WorkflowNodeType.KNOWLEDGE_RETRIEVAL:
      return [
        { field: 'text', type: 'string', description: '检索文本' },
        { field: 'documents', type: 'array', description: '检索文档' },
      ]
    case WorkflowNodeType.DOCUMENT_EXTRACTOR:
      return [{ field: 'text', type: 'string', description: '提取文本' }]
    case WorkflowNodeType.JSON_PARSE:
      return [{ field: 'json', type: 'json', description: 'JSON 结果' }]
    case WorkflowNodeType.QUESTION_CLASSIFIER:
      return [{ field: 'result', type: 'string', description: '分类结果' }]
    case WorkflowNodeType.SMART_PARSE:
      return (config.outputParams || [{ field: 'result', type: 'any' }]).map((item: any) => ({
        field: item.field || item.name || 'result',
        type: item.type || 'any',
        description: '解析结果',
      }))
    case WorkflowNodeType.VARIABLE:
    case WorkflowNodeType.FLOW_CALL:
      return (config.outputParams || [{ field: 'result', type: 'any' }]).map((item: any) => ({
        field: item.field || item.name || 'result',
        type: item.type || 'any',
        description: '节点输出',
      }))
    case WorkflowNodeType.END:
      return []
    default:
      return (config.outputParams || config.outputs || []).map((item: any) => ({
        field: item.field || item.name || item.key || 'result',
        type: item.type || 'any',
        description: '节点输出',
      }))
  }
}

export const buildVariableCatalog = ({
  nodes,
  edges,
  currentNodeId,
  globalVariables = [],
  scope = 'upstream',
}: BuildVariableCatalogOptions): WorkflowVariableGroup[] => {
  const currentNode = nodes.find(node => node.id === currentNodeId)
  const startNode = nodes.find(node => node.type === WorkflowNodeType.START)
  const groups: WorkflowVariableGroup[] = []

  const pushGroup = (id: string, label: string, source: VariableSourceScope, variables: WorkflowVariableMeta[], type?: string) => {
    if (variables.length === 0) return
    groups.push({
      id,
      label,
      source,
      type,
      variables,
      params: variables.map(toFlowField),
    })
  }

  if (currentNode && (currentNode.type === WorkflowNodeType.LOOP || (currentNode.parentNode && nodes.some(node => node.id === currentNode.parentNode && node.type === WorkflowNodeType.LOOP)))) {
    pushGroup('loop', '循环上下文', 'loop', LOOP_VARIABLES)
  }

  if (startNode) {
    pushGroup(startNode.id, '开始节点变量', 'payload', getStartVariables(startNode), String(startNode.type || 'start'))
  }

  if (Array.isArray(globalVariables) && globalVariables.length > 0) {
    pushGroup('global', '全局变量', 'global', globalVariables.flatMap(toGlobalVariableMeta))
  }

  const targetNodes = getTargetNodes(nodes as WorkflowNode[], edges, currentNodeId, scope)
  for (const node of targetNodes) {
    const variables = getNodeOutputSchema(node).map(item => {
      const path = node.type === WorkflowNodeType.START ? `payload.${item.field}` : `nodes.${node.id}.${item.field}`
      return {
        key: `node:${node.id}:${item.field}`,
        scope: node.type === WorkflowNodeType.START ? 'payload' : 'node',
        path,
        template: `{{${path}}}`,
        name: item.field,
        label: item.field,
        type: item.type,
        nodeId: node.id,
        nodeType: String(node.type || ''),
        nodeLabel: String(node.data?.label || node.type || ''),
        description: item.description,
      } satisfies WorkflowVariableMeta
    })
    const loopParent = currentNode ? findLoopParent(currentNode as WorkflowNode, nodes as WorkflowNode[]) : undefined
    const nodeLoopParent = findLoopParent(node as WorkflowNode, nodes as WorkflowNode[])
    const isInternalLoopNode = scope !== 'internal' && loopParent && nodeLoopParent && loopParent.id === nodeLoopParent.id && node.parentNode
    const groupLabel = isInternalLoopNode
      ? `循环体节点 · ${String(node.data?.label || node.type || node.id)}`
      : String(node.data?.label || node.type || node.id)
    pushGroup(node.id, groupLabel, node.type === WorkflowNodeType.START ? 'payload' : 'node', variables, String(node.type || ''))
  }

  pushGroup('system', '系统变量', 'system', SYSTEM_VARIABLES)

  return groups
}

export const buildLoopBodyOutputCatalog = (
  nodes: Node[],
  loopNodeId: string
): WorkflowVariableGroup[] => {
  const loopBodyNodes = nodes.filter(
    node => node.parentNode === loopNodeId && node.type !== WorkflowNodeType.LOOP
  )

  return loopBodyNodes
    .map(node => {
      const variables = getNodeOutputSchema(node).map(item => ({
        key: `node:${node.id}:${item.field}`,
        scope: 'node' as const,
        path: `nodes.${node.id}.${item.field}`,
        template: `{{nodes.${node.id}.${item.field}}}`,
        name: item.field,
        label: item.field,
        type: item.type,
        nodeId: node.id,
        nodeType: String(node.type || ''),
        nodeLabel: String(node.data?.label || node.type || ''),
        description: item.description,
      }))

      return {
        id: node.id,
        type: String(node.type || ''),
        label: `循环体节点 · ${String(node.data?.label || node.type || node.id)}`,
        source: 'node' as const,
        variables,
        params: variables.map(toFlowField),
      }
    })
    .filter(group => group.params.length > 0)
}

const getTargetNodes = (nodes: WorkflowNode[], edges: Edge[], currentNodeId?: string | null, scope: 'upstream' | 'internal' | 'all' = 'upstream'): WorkflowNode[] => {
  if (!currentNodeId) return scope === 'all' ? nodes : []

  if (scope === 'internal') {
    return nodes.filter(node => node.parentNode === currentNodeId)
  }

  if (scope === 'all') {
    return nodes.filter(node => node.id !== currentNodeId)
  }

  const result: WorkflowNode[] = []
  const visited = new Set<string>()
  const queue = [currentNodeId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const incomingEdges = edges.filter(edge => edge.target === current)

    for (const edge of incomingEdges) {
      if (visited.has(edge.source)) continue
      visited.add(edge.source)
      queue.push(edge.source)
      const sourceNode = nodes.find(node => node.id === edge.source)
      if (sourceNode) {
        result.push(sourceNode)
      }
    }
  }

  return result
}

const findLoopParent = (node: WorkflowNode | undefined, nodes: WorkflowNode[]): WorkflowNode | undefined => {
  if (!node?.parentNode) return undefined
  const parentNode = nodes.find(item => item.id === node.parentNode)
  if (!parentNode) return undefined
  if (parentNode.type === WorkflowNodeType.LOOP) {
    return parentNode
  }
  return findLoopParent(parentNode, nodes)
}

const getStartVariables = (startNode: Node): WorkflowVariableMeta[] => {
  const config: any = startNode.data?.config || {}
  const variables: WorkflowVariableMeta[] = []

  const variableConfigs: VariableConfig[] = config.variables || []
  variableConfigs.forEach(item => {
    variables.push({
      key: `payload:${item.name}`,
      scope: 'payload',
      path: `payload.${item.name}`,
      template: `{{payload.${item.name}}}`,
      name: item.name,
      label: item.displayName || item.name,
      type: normalizeVariableType(item.type),
      description: item.displayName || item.name,
      nodeId: startNode.id,
      nodeType: String(startNode.type || 'start'),
      nodeLabel: String(startNode.data?.label || 'Start'),
    })
  })

  if (variables.length > 0) return variables

  try {
    const parsed = JSON.parse(config.devInput || DEFAULT_DEV_INPUT)
    return flattenObject(parsed).map((item: any) => ({
      key: `payload:${item.path}`,
      scope: 'payload',
      path: item.path,
      template: `{{${item.path}}}`,
      name: String(item.path || '').replace(/^payload\./, ''),
      label: item.label,
      type: item.type,
      description: '开始节点输入变量',
      value: item.value,
      nodeId: startNode.id,
      nodeType: String(startNode.type || 'start'),
      nodeLabel: String(startNode.data?.label || 'Start'),
    }))
  } catch {
    return []
  }
}

const toGlobalVariableMeta = (variable: VariableConfig): WorkflowVariableMeta[] => {
  const base: WorkflowVariableMeta[] = [
    {
      key: `global:${variable.name}`,
      scope: 'global',
      path: `global.${variable.name}`,
      template: `{{global.${variable.name}}}`,
      name: variable.name,
      label: variable.displayName || variable.name,
      type: normalizeVariableType(variable.type),
      description: variable.displayName || variable.name,
    },
  ]

  if (variable.type === 'dropdown' && variable.options) {
    variable.options.forEach((option, index) => {
      base.push({
        key: `global:${variable.name}:option:${index}`,
        scope: 'global',
        path: `global.${variable.name}.options.${index}`,
        template: `{{global.${variable.name}.options.${index}}}`,
        name: `${variable.name}.options.${index}`,
        label: `${variable.displayName || variable.name} - ${option.label}`,
        type: 'string',
        description: '下拉选项值',
        value: option.value,
      })
    })
  }

  return base
}

const toFlowField = (meta: WorkflowVariableMeta): FlowField => ({
  field: meta.name,
  name: meta.name,
  label: meta.label,
  type: meta.type || 'any',
  nodeId: meta.nodeId,
  nodeType: meta.nodeType,
  value: meta.template,
})

const detectValueType = (value: any): string => {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  if (typeof value === 'object') return 'object'
  return typeof value
}

const normalizeVariableType = (type?: string): FlowField['type'] => {
  switch (type) {
    case 'paragraph':
      return 'string'
    case 'dropdown':
      return 'string'
    case 'checkbox':
      return 'boolean'
    case 'file_list':
      return 'file'
    default:
      return type || 'any'
  }
}

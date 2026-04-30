import type { Node } from 'reactflow'
import type { FlowField } from '@ai-flow/src/types/flow'
import { DEFAULT_DEV_INPUT } from '../config/defaultDevInput'
import { WorkflowNodeType, type VariableConfig } from '../types'

export interface OutputSchemaItem {
  field: string
  type: string
  description: string
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
    case WorkflowNodeType.APPROVAL_AI_REVIEW:
      return [
        { field: 'approvalDecision', type: 'string', description: 'AI 审批三态决策' },
        { field: 'reason', type: 'string', description: 'AI 审批评估原因' },
        { field: 'confidence', type: 'number', description: 'AI 审批评估置信度' },
        { field: 'riskLevel', type: 'string', description: 'AI 审批风险等级' },
        { field: 'hitRules', type: 'array', description: '命中的审批规则' },
        { field: 'missingFields', type: 'array', description: '缺失或不足的信息字段' },
      ]
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
    case WorkflowNodeType.MUL_QUERY:
      return [
        { field: 'data.rows', type: 'array', description: '查询结果列表' },
        { field: 'data.firstRow', type: 'object', description: '第一条查询结果' },
        { field: 'data.total', type: 'number', description: '匹配行数' },
        { field: 'data.pageVisibleCount', type: 'number', description: '本次返回行数' },
      ]
    case WorkflowNodeType.MUL_UPDATE_ROW:
      return [
        { field: 'data.row', type: 'object', description: '修改后的行数据' },
        { field: 'data.rowId', type: 'string', description: '修改行 ID' },
        { field: 'data.updated', type: 'boolean', description: '是否修改成功' },
      ]
    case WorkflowNodeType.MUL_DELETE_ROW:
      return [
        { field: 'data.rowId', type: 'string', description: '删除行 ID' },
        { field: 'data.deleted', type: 'boolean', description: '是否删除成功' },
      ]
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

const detectValueType = (value: any): FlowField['type'] => {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'any'
  if (typeof value === 'object') return 'object'
  return normalizeVariableType(typeof value)
}

export const normalizeVariableType = (type?: string): FlowField['type'] => {
  switch (type) {
    case 'paragraph':
      return 'string'
    case 'dropdown':
      return 'string'
    case 'checkbox':
      return 'boolean'
    case 'file_list':
      return 'file'
    case 'string':
    case 'number':
    case 'boolean':
    case 'array':
    case 'object':
    case 'image':
    case 'file':
    case 'select':
    case 'text':
    case 'json':
    case 'stream':
    case 'any':
      return type
    default:
      return 'any'
  }
}

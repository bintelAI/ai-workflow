import type { FlowField } from '@ai-flow/src/types/flow'
import type { WorkflowVariableMeta } from './workflowVariables'

export interface VariableGroupLike {
  id: string
  type?: string
  label?: string
  params?: FlowField[]
  variables?: WorkflowVariableMeta[]
}

export interface VariableSelectionPayload {
  field: string
  nodeId: string
  nodeType: string
  value: string
  name?: string
  template?: string
  refPath?: string
  label?: string
}

const normalizeTemplate = (value: string) => String(value || '').trim()

const matchesTemplate = (meta: WorkflowVariableMeta, template: string) => {
  return normalizeTemplate(meta.template) === template || normalizeTemplate(`{{${meta.path}}}`) === template
}

export const resolveVariableSelection = (
  selectedValue: string,
  variables: VariableGroupLike[] = [],
  selectedMeta?: WorkflowVariableMeta
): VariableSelectionPayload => {
  const template = normalizeTemplate(selectedValue)
  const matchedMeta =
    selectedMeta ||
    variables
      .flatMap(group => group.variables || [])
      .find(meta => matchesTemplate(meta, template))

  if (!matchedMeta) {
    return {
      field: '',
      nodeId: '',
      nodeType: '',
      value: selectedValue,
    }
  }

  const matchedGroup = variables.find(group =>
    group.id === matchedMeta.nodeId || group.variables?.some(meta => matchesTemplate(meta, template))
  )
  const matchedParam = matchedGroup?.params?.find(param =>
    param.name === matchedMeta.name || param.field === matchedMeta.name || param.field === matchedMeta.path
  )

  return {
    field: matchedParam?.field || matchedMeta.name || '',
    nodeId: matchedMeta.nodeId || matchedGroup?.id || '',
    nodeType: matchedMeta.nodeType || matchedGroup?.type || '',
    value: '',
    name: matchedMeta.name || matchedParam?.name || matchedParam?.field,
    template: matchedMeta.template || template,
    refPath: matchedMeta.path,
    label: matchedMeta.label || matchedParam?.label,
  }
}

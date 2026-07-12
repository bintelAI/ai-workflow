import { describe, expect, it } from 'vitest'

import { getPluginMode, PLUGIN_MODE_REGISTRY } from '../config/pluginModeRegistry'
import { WorkflowNodeType } from '../types'

describe('PLUGIN_MODE_REGISTRY', () => {
  it('allows approval mode to use connected approval runtime nodes', () => {
    expect(PLUGIN_MODE_REGISTRY.approval.allowedNodeTypes).toEqual(
      expect.arrayContaining([
        WorkflowNodeType.START,
        WorkflowNodeType.APPROVAL,
        WorkflowNodeType.CONDITION,
        WorkflowNodeType.NOTIFICATION,
        WorkflowNodeType.MUL_QUERY,
        WorkflowNodeType.MUL_UPDATE_ROW,
        WorkflowNodeType.MUL_DELETE_ROW,
        WorkflowNodeType.END,
      ])
    )
  })

  it('keeps AI-specific nodes out of approval mode', () => {
    expect(PLUGIN_MODE_REGISTRY.approval.allowedNodeTypes).not.toEqual(
      expect.arrayContaining([
        WorkflowNodeType.LLM,
        WorkflowNodeType.QUESTION_CLASSIFIER,
        WorkflowNodeType.KNOWLEDGE_RETRIEVAL,
        WorkflowNodeType.DOCUMENT_EXTRACTOR,
        WorkflowNodeType.JSON_PARSE,
        WorkflowNodeType.SMART_PARSE,
      ])
    )
  })

  it('allows project table operation nodes in AI and approval modes', () => {
    const projectTableNodes = [
      WorkflowNodeType.MUL_QUERY,
      WorkflowNodeType.MUL_UPDATE_ROW,
      WorkflowNodeType.MUL_DELETE_ROW,
    ]

    expect(PLUGIN_MODE_REGISTRY.ai.allowedNodeTypes).toEqual(
      expect.arrayContaining(projectTableNodes)
    )
    expect(PLUGIN_MODE_REGISTRY.approval.allowedNodeTypes).toEqual(
      expect.arrayContaining(projectTableNodes)
    )
  })

  it('keeps approval nodes out of AI mode', () => {
    expect(PLUGIN_MODE_REGISTRY.ai.allowedNodeTypes).not.toEqual(
      expect.arrayContaining([
        WorkflowNodeType.APPROVAL,
        WorkflowNodeType.CC,
      ])
    )
  })

  it('maps project workflow usage types to stable editor modes', () => {
    expect(getPluginMode('ai_analysis').type).toBe('ai')
    expect(getPluginMode('approval').type).toBe('approval')
    expect(getPluginMode('automation').type).toBe('automation')
  })

  it('keeps approval nodes out of automation mode', () => {
    expect(PLUGIN_MODE_REGISTRY.automation.allowedNodeTypes).not.toEqual(
      expect.arrayContaining([
        WorkflowNodeType.APPROVAL,
        WorkflowNodeType.CC,
        WorkflowNodeType.LLM,
      ])
    )
  })

  it('keeps legacy SQL node out of all new workflow modes', () => {
    expect(PLUGIN_MODE_REGISTRY.all.allowedNodeTypes).not.toContain(WorkflowNodeType.SQL)
    expect(PLUGIN_MODE_REGISTRY.ai.allowedNodeTypes).not.toContain(WorkflowNodeType.SQL)
    expect(PLUGIN_MODE_REGISTRY.approval.allowedNodeTypes).not.toContain(WorkflowNodeType.SQL)
    expect(PLUGIN_MODE_REGISTRY.automation.allowedNodeTypes).not.toContain(WorkflowNodeType.SQL)
  })

  it('keeps the unsafe variable node out of all new workflow modes', () => {
    expect(PLUGIN_MODE_REGISTRY.all.allowedNodeTypes).not.toContain(WorkflowNodeType.VARIABLE)
    expect(PLUGIN_MODE_REGISTRY.ai.allowedNodeTypes).not.toContain(WorkflowNodeType.VARIABLE)
    expect(PLUGIN_MODE_REGISTRY.approval.allowedNodeTypes).not.toContain(WorkflowNodeType.VARIABLE)
    expect(PLUGIN_MODE_REGISTRY.automation.allowedNodeTypes).not.toContain(WorkflowNodeType.VARIABLE)
  })
})

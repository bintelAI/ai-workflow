import { describe, expect, it } from 'vitest'

import { PLUGIN_MODE_REGISTRY } from '../config/pluginModeRegistry'
import { WorkflowNodeType } from '../types'

describe('PLUGIN_MODE_REGISTRY', () => {
  it('allows approval mode to use all non-AI nodes', () => {
    expect(PLUGIN_MODE_REGISTRY.approval.allowedNodeTypes).toEqual(
      expect.arrayContaining([
        WorkflowNodeType.START,
        WorkflowNodeType.APPROVAL,
        WorkflowNodeType.CC,
        WorkflowNodeType.CONDITION,
        WorkflowNodeType.PARALLEL,
        WorkflowNodeType.LOOP,
        WorkflowNodeType.DELAY,
        WorkflowNodeType.NOTIFICATION,
        WorkflowNodeType.DATA_OP,
        WorkflowNodeType.API_CALL,
        WorkflowNodeType.SQL,
        WorkflowNodeType.SCRIPT,
        WorkflowNodeType.FLOW_CALL,
        WorkflowNodeType.VARIABLE,
        WorkflowNodeType.CLOUD_PHONE,
        WorkflowNodeType.STORAGE,
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

  it('keeps approval nodes out of AI mode', () => {
    expect(PLUGIN_MODE_REGISTRY.ai.allowedNodeTypes).not.toEqual(
      expect.arrayContaining([
        WorkflowNodeType.APPROVAL,
        WorkflowNodeType.CC,
      ])
    )
  })
})

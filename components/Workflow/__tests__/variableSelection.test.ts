import { describe, expect, it } from 'vitest'

import { resolveVariableSelection } from '../utils/variableSelection'

describe('variableSelection', () => {
  it('resolves selected template back to InputParams field metadata', () => {
    const selection = resolveVariableSelection('{{nodes.ai_review_1.reason}}', [
      {
        id: 'ai_review_1',
        type: 'approval_ai_review',
        label: 'AI 审批评估',
        params: [
          { field: 'reason', name: 'reason', type: 'string', label: 'reason' },
        ],
        variables: [
          {
            key: 'node:ai_review_1:reason',
            scope: 'node',
            path: 'nodes.ai_review_1.reason',
            template: '{{nodes.ai_review_1.reason}}',
            name: 'reason',
            label: 'reason',
            type: 'string',
            nodeId: 'ai_review_1',
            nodeType: 'approval_ai_review',
            nodeLabel: 'AI 审批评估',
          },
        ],
      },
    ])

    expect(selection).toEqual({
      field: 'reason',
      nodeId: 'ai_review_1',
      nodeType: 'approval_ai_review',
      value: '',
      name: 'reason',
      template: '{{nodes.ai_review_1.reason}}',
      refPath: 'nodes.ai_review_1.reason',
      label: 'reason',
    })
  })

  it('keeps custom values as plain InputParams values', () => {
    expect(resolveVariableSelection('fixed text', [])).toEqual({
      field: '',
      nodeId: '',
      nodeType: '',
      value: 'fixed text',
    })
  })
})

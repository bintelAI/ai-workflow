import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ApprovalAutoApprovalConfig from '../configs/ApprovalAutoApprovalConfig'

vi.mock('../configs/common/VariableSelector', () => ({
  default: ({ value, placeholder }: { value?: string; placeholder?: string }) => (
    <div data-testid="variable-selector">{value || placeholder}</div>
  ),
}))

describe('ApprovalAutoApprovalConfig', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.clearAllMocks()
  })

  it('imports upstream approval AI review decision outputs into auto approval config', async () => {
    const onChange = vi.fn()

    await act(async () => {
      root.render(
        <ApprovalAutoApprovalConfig
          autoApproval={{}}
          onChange={onChange}
          variables={[
            {
              id: 'ai_review_1',
              type: 'approval_ai_review',
              label: 'AI 审批评估',
              source: 'node',
              params: [
                { field: 'approvalDecision', name: 'approvalDecision', type: 'string', label: 'approvalDecision' },
                { field: 'reason', name: 'reason', type: 'string', label: 'reason' },
              ],
              variables: [
                {
                  key: 'node:ai_review_1:approvalDecision',
                  scope: 'node',
                  path: 'nodes.ai_review_1.approvalDecision',
                  template: '{{nodes.ai_review_1.approvalDecision}}',
                  name: 'approvalDecision',
                  label: 'approvalDecision',
                  type: 'string',
                  nodeId: 'ai_review_1',
                  nodeType: 'approval_ai_review',
                  nodeLabel: 'AI 审批评估',
                },
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
          ]}
        />
      )
    })

    const importButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === '引入 AI 审批评估结果'
    ) as HTMLButtonElement

    await act(async () => {
      importButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onChange).toHaveBeenCalledWith({
      enabled: true,
      decisionVariable: '{{nodes.ai_review_1.approvalDecision}}',
      reasonVariable: '{{nodes.ai_review_1.reason}}',
    })
  })
})

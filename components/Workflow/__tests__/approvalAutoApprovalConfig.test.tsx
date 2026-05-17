import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ApprovalAutoApprovalConfig from '../configs/ApprovalAutoApprovalConfig'

vi.mock('../configs/LLMConfig', () => ({
  default: ({ config }: { config: Record<string, any> }) => (
    <div data-testid="llm-config">LLM:{config.model || 'default'}</div>
  ),
}))

vi.mock('../configs/common', () => ({
  VariableTextArea: ({
    value,
    placeholder,
  }: {
    value?: string
    placeholder?: string
  }) => <div data-testid="variable-textarea">{value || placeholder}</div>,
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: (selector?: any) => {
    const state = { teamId: 'team_1' }
    return typeof selector === 'function' ? selector(state) : state
  },
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

  it('shows embedded AI approval settings when enabled', async () => {
    const onChange = vi.fn()

    await act(async () => {
      root.render(
        <ApprovalAutoApprovalConfig
          autoApproval={{
            enabled: true,
            model: 'gpt-4',
            approveRules: '金额低于 500 自动通过',
            rejectRules: '票据缺失自动驳回',
            manualRules: '无法判断时人工审批',
          }}
          onChange={onChange}
          variables={[]}
        />
      )
    })

    expect(container.textContent).toContain('启动 AI 自动审批')
    expect(container.textContent).toContain('自动通过规则')
    expect(container.textContent).toContain('自动驳回规则')
    expect(container.textContent).toContain('人工审批兜底规则')
    expect(container.querySelector('[data-testid="llm-config"]')?.textContent).toBe('LLM:gpt-4')
    expect(container.textContent).not.toContain('上游 AI 审批评估')
    expect(container.textContent).not.toContain('决策值来源')
    expect(container.textContent).not.toContain('审批意见来源')
  })

  it('toggles embedded AI approval on from a single switch', async () => {
    const onChange = vi.fn()

    await act(async () => {
      root.render(
        <ApprovalAutoApprovalConfig
          autoApproval={{}}
          onChange={onChange}
          variables={[]}
        />
      )
    })

    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    await act(async () => {
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onChange).toHaveBeenCalledWith({
      enabled: true,
      fallback: 'manual',
    })
  })
})

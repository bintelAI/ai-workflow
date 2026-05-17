import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WorkflowMulFilterBuilder from '../configs/WorkflowMulFilterBuilder'

vi.mock('../configs/VariableBindModal', () => ({
  VariableBindModal: ({ isOpen }: any) => (isOpen ? <div data-testid="variable-bind-modal" /> : null),
}))

describe('WorkflowMulFilterBuilder', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  it('uses select controls for select and multiSelect field values', async () => {
    await act(async () => {
      root.render(
        <WorkflowMulFilterBuilder
          columns={[
            {
              fieldId: 'status',
              label: '状态',
              type: 'select',
              options: [
                { id: 'open', label: '进行中', color: '#38bdf8' },
                { id: 'done', label: '已完成', color: '#22c55e' },
              ],
            },
          ] as any}
          filters={[
            {
              id: 'filter_1',
              columnId: 'status',
              operator: 'equals',
              value: 'open',
            },
          ]}
          matchType="and"
          onChange={vi.fn()}
          onMatchTypeChange={vi.fn()}
        />
      )
    })

    expect(container.querySelectorAll('.ant-select')).toHaveLength(3)
    expect(container.textContent).toContain('进行中')
    expect(container.querySelector('input[placeholder="输入值或绑定变量"]')).toBeNull()
  })
})

import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ConditionConfig from '../configs/ConditionConfig'

vi.mock('@/api/flowChat', () => ({
  flowChatApi: {
    completions: vi.fn(),
  },
}))

vi.mock('@ai-flow/utils/runtime', () => ({
  getRuntimeTeamId: vi.fn(() => 'team_1'),
}))

vi.mock('../configs/common/index', () => ({
  VariableSelector: ({ field, placeholder }: { field?: string; placeholder?: string }) => (
    <div data-testid="variable-selector">{field || placeholder}</div>
  ),
}))

describe('ConditionConfig', () => {
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

  it('writes added conditions to conditionGroups for backend export', async () => {
    const onConfigChange = vi.fn()

    await act(async () => {
      root.render(<ConditionConfig config={{}} onConfigChange={onConfigChange} />)
    })

    const addButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === '添加条件'
    ) as HTMLButtonElement

    await act(async () => {
      addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onConfigChange).toHaveBeenCalledWith('conditionGroups', [
      {
        conditions: [
          expect.objectContaining({
            variable: '',
            operator: 'equals',
            value: '',
          }),
        ],
        logic: 'AND',
        logicalOperator: 'AND',
      },
    ])
  })

  it('renders conditions imported as conditionGroups', async () => {
    await act(async () => {
      root.render(
        <ConditionConfig
          config={{
            conditionGroups: [
              {
                conditions: [
                  {
                    variable: '{{nodes.start_1.amount}}',
                    template: '{{nodes.start_1.amount}}',
                    refPath: '{{nodes.start_1.amount}}',
                    operator: 'greater_than',
                    value: '100',
                  },
                ],
              },
            ],
          }}
          onConfigChange={vi.fn()}
        />
      )
    })

    expect(container.querySelector<HTMLInputElement>('input[value="100"]')).toBeTruthy()
  })
})

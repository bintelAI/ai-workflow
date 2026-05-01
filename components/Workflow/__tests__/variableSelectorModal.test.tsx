import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import VariableSelector from '../configs/common/VariableSelector'

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: () => ({
    selectedNodeId: 'llm_1',
    nodes: [
      {
        id: 'start_1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: '流程开始', config: { devInput: '{"name":"张三"}' } },
      },
      {
        id: 'llm_1',
        type: 'llm',
        position: { x: 100, y: 0 },
        data: { label: 'AI 分析', config: {} },
      },
    ],
    edges: [{ id: 'e1', source: 'start_1', target: 'llm_1' }],
    globalVariables: [],
  }),
}))

describe('VariableSelector', () => {
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

  it('opens the unified variable bind modal from the legacy selector trigger', async () => {
    await act(async () => {
      root.render(<VariableSelector value="" placeholder="选择变量" />)
    })

    await act(async () => {
      container.querySelector('.variable-selector-trigger')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    })

    expect(document.body.textContent).toContain('选择变量')
    expect(document.body.textContent).toContain('从上游节点或全局上下文中选择变量')
    expect(document.body.querySelector('.ant-popover')).toBeNull()
  })

  it('highlights the currently selected variable in the modal', async () => {
    await act(async () => {
      root.render(<VariableSelector value="{{payload.name}}" placeholder="选择变量" />)
    })

    await act(async () => {
      container.querySelector('.variable-selector-trigger')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    })

    expect(document.body.textContent).toContain('已选择')
  })
})

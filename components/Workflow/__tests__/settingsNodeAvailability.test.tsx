import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsModal } from '../SettingsModal'
import { useWorkflowStore } from '../store/useWorkflowStore'
import { WorkflowNodeType } from '../types'

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: vi.fn(),
}))

const createStoreMock = (overrides: Record<string, any> = {}) => ({
  isSettingsOpen: true,
  toggleSettings: vi.fn(),
  categories: [
    {
      id: 'custom_1',
      name: '自定义类型',
      description: '测试分类',
      allowedNodeTypes: [WorkflowNodeType.START, WorkflowNodeType.VARIABLE],
      isSystem: false,
    },
  ],
  activeCategoryId: 'custom_1',
  setActiveCategory: vi.fn(),
  addCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  applyAutoLayout: vi.fn(),
  ...overrides,
})

describe('SettingsModal new-node availability', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    vi.clearAllMocks()
    container = document.createElement('div')
    document.body.innerHTML = ''
    document.body.appendChild(container)
    root = createRoot(container)
  })

  it('does not offer the unsafe variable node as a selectable node type', async () => {
    vi.mocked(useWorkflowStore).mockReturnValue(createStoreMock() as any)

    await act(async () => {
      root.render(<SettingsModal />)
    })

    expect(container.textContent).not.toContain('变量处理')
  })

  it('creates custom categories without unsafe variable node permission', async () => {
    const addCategory = vi.fn()
    vi.mocked(useWorkflowStore).mockReturnValue(createStoreMock({ addCategory }) as any)

    await act(async () => {
      root.render(<SettingsModal />)
    })
    const createButton = Array.from(container.querySelectorAll('button')).find(button =>
      button.textContent?.includes('新建类型')
    )

    await act(async () => {
      createButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const createdCategory = addCategory.mock.calls[0]?.[0]
    expect(createdCategory.allowedNodeTypes).not.toContain(WorkflowNodeType.VARIABLE)
  })
})

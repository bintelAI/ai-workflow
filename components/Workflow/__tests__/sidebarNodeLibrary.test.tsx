import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { Sidebar } from '../Sidebar'
import { getPluginMode } from '../config/pluginModeRegistry'
import { useWorkflowStore } from '../store/useWorkflowStore'

vi.mock('reactflow', () => ({
  useReactFlow: () => ({
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    setViewport: vi.fn(),
  }),
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: vi.fn(),
}))

describe('Sidebar node library', () => {
  it('shows the mul query node clearly in AI mode', () => {
    const aiMode = getPluginMode('ai')
    vi.mocked(useWorkflowStore).mockReturnValue({
      categories: [
        {
          id: aiMode.categoryId,
          name: aiMode.name,
          allowedNodeTypes: aiMode.allowedNodeTypes,
        },
      ],
      activeCategoryId: aiMode.categoryId,
      nodes: [],
      edges: [],
      setWorkflow: vi.fn(),
      globalVariables: [],
    } as any)

    const html = renderToStaticMarkup(<Sidebar pluginType="ai" />)

    expect(html).toContain('维表查询')
    expect(html).not.toContain('SQL 节点')
  })

  it('falls back to AI mode defaults when the system category has no saved node list yet', () => {
    const aiMode = getPluginMode('ai')
    vi.mocked(useWorkflowStore).mockReturnValue({
      categories: [
        {
          id: aiMode.categoryId,
          name: aiMode.name,
          allowedNodeTypes: [],
        },
      ],
      activeCategoryId: aiMode.categoryId,
      nodes: [],
      edges: [],
      setWorkflow: vi.fn(),
      globalVariables: [],
    } as any)

    const html = renderToStaticMarkup(<Sidebar pluginType="ai" />)

    expect(html).toContain('维表查询')
  })
})

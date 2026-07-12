import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { Sidebar } from '../Sidebar'
import { getPluginMode } from '../config/pluginModeRegistry'
import { useWorkflowStore } from '../store/useWorkflowStore'
import { WorkflowNodeType } from '../types'

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

  it('does not render the unsafe variable node in the general category', () => {
    vi.mocked(useWorkflowStore).mockReturnValue({
      categories: [
        {
          id: 'general',
          name: '全功能模式',
          allowedNodeTypes: [WorkflowNodeType.START, WorkflowNodeType.VARIABLE],
        },
      ],
      activeCategoryId: 'general',
      nodes: [],
      edges: [],
      setWorkflow: vi.fn(),
      globalVariables: [],
    } as any)

    const html = renderToStaticMarkup(<Sidebar pluginType="all" />)

    expect(html).toContain('开始')
    expect(html).not.toContain('变量处理')
  })

  it('does not render the unsafe variable node from a persisted custom category', () => {
    vi.mocked(useWorkflowStore).mockReturnValue({
      categories: [
        {
          id: 'custom_persisted',
          name: '自定义类型',
          allowedNodeTypes: [WorkflowNodeType.START, WorkflowNodeType.VARIABLE],
        },
      ],
      activeCategoryId: 'custom_persisted',
      nodes: [],
      edges: [],
      setWorkflow: vi.fn(),
      globalVariables: [],
    } as any)

    const html = renderToStaticMarkup(<Sidebar pluginType="all" />)

    expect(html).toContain('开始')
    expect(html).not.toContain('变量处理')
  })
})

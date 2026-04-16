import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { WorkflowCanvas } from '../WorkflowCanvas'
import { ReactFlowProvider } from 'reactflow'
import { useWorkflowStore } from '../store/useWorkflowStore'

vi.mock('reactflow', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Controls: () => <div data-testid="flow-controls" />,
  Background: () => <div data-testid="flow-background" />,
  MiniMap: () => <div data-testid="flow-minimap" />,
  Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="flow-panel">{children}</div>,
  useReactFlow: () => ({
    project: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    getNodes: () => [],
    fitView: () => undefined,
    setCenter: () => undefined,
    flowToScreenPosition: (position: { x: number; y: number }) => position,
  }),
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: vi.fn(),
}))

describe('WorkflowCanvas readonly', () => {
  beforeEach(() => {
    vi.mocked(useWorkflowStore).mockReturnValue({
      nodes: [],
      edges: [],
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      addNode: vi.fn(),
      setSelectedNode: vi.fn(),
      closeEdgeMenu: vi.fn(),
      closeNodeMenu: vi.fn(),
      onNodeDragStop: vi.fn(),
      applyAutoLayout: vi.fn(),
      categories: [{ id: 'general', allowedNodeTypes: [] }],
      activeCategoryId: 'general',
      selectedNodeId: null,
      edgeMenu: {
        isOpen: false,
        edgeId: null,
        position: null,
        sourceId: null,
        targetId: null,
      },
      nodeMenu: {
        isOpen: false,
        sourceNodeId: null,
        position: null,
        parentNodeId: null,
      },
      insertNodeBetween: vi.fn(),
      appendNode: vi.fn(),
    } as any)
  })

  it('renders canvas controls in editable mode', () => {
    const html = renderToStaticMarkup(
      <ReactFlowProvider>
        <WorkflowCanvas />
      </ReactFlowProvider>
    )

    expect(html).toContain('data-testid="react-flow"')
    expect(html).toContain('data-testid="flow-controls"')
    expect(html).toContain('data-testid="flow-minimap"')
    expect(html).toContain('data-testid="flow-panel"')
  })

  it('hides canvas controls in readonly mode', () => {
    const html = renderToStaticMarkup(
      <ReactFlowProvider>
        <WorkflowCanvas readonly />
      </ReactFlowProvider>
    )

    expect(html).toContain('data-testid="react-flow"')
    expect(html).not.toContain('data-testid="flow-controls"')
    expect(html).not.toContain('data-testid="flow-minimap"')
    expect(html).not.toContain('data-testid="flow-panel"')
  })
})

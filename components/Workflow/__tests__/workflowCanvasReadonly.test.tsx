import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { WorkflowCanvas } from '../WorkflowCanvas'
import { ReactFlowProvider } from 'reactflow'
import { useWorkflowStore } from '../store/useWorkflowStore'
import { WorkflowNodeType } from '../types'

const reactFlowCapture = vi.hoisted(() => ({ props: null as any }))

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
  default: (props: any) => {
    reactFlowCapture.props = props
    return <div data-testid="react-flow">{props.children}</div>
  },
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: vi.fn(),
}))

describe('WorkflowCanvas readonly', () => {
  beforeEach(() => {
    vi.mocked(useWorkflowStore).mockReturnValue({
      nodes: [
        {
          id: 'start-1',
          type: WorkflowNodeType.START,
          position: { x: 0, y: 0 },
          data: { label: '开始' },
        },
      ],
      edges: [{ id: 'e1', source: 'start-1', target: 'end-1', data: {} }],
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
    expect(reactFlowCapture.props.nodesDraggable).toBe(false)
    expect(reactFlowCapture.props.nodesConnectable).toBe(false)
    expect(reactFlowCapture.props.onNodesChange).toBeUndefined()
    expect(reactFlowCapture.props.onEdgesChange).toBeUndefined()
    expect(reactFlowCapture.props.onConnect).toBeUndefined()
    expect(reactFlowCapture.props.onDrop).toBeUndefined()
    expect(reactFlowCapture.props.onNodeDragStop).toBeUndefined()
    expect(reactFlowCapture.props.nodes[0].data.readonly).toBe(true)
    expect(reactFlowCapture.props.edges[0].data.readonly).toBe(true)
  })

  it('does not offer the unsafe variable node from a persisted category in quick add', () => {
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
      categories: [{
        id: 'custom_persisted',
        name: '自定义类型',
        allowedNodeTypes: [WorkflowNodeType.START, WorkflowNodeType.VARIABLE],
      }],
      activeCategoryId: 'custom_persisted',
      selectedNodeId: null,
      edgeMenu: { isOpen: false },
      nodeMenu: {
        isOpen: true,
        sourceNodeId: 'start_1',
        position: { x: 10, y: 10 },
        parentNodeId: null,
      },
      insertNodeBetween: vi.fn(),
      appendNode: vi.fn(),
    } as any)

    const html = renderToStaticMarkup(
      <ReactFlowProvider>
        <WorkflowCanvas />
      </ReactFlowProvider>
    )

    expect(html).toContain('开始')
    expect(html).not.toContain('变量处理')
  })
})

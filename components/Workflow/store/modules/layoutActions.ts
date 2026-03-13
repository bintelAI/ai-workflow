import dagre from 'dagre'
import { WorkflowNode, WorkflowEdge, LayoutDirection } from '../../types'

const NODE_WIDTH = 280
const NODE_HEIGHT = 120

export interface LayoutActions {
  applyAutoLayout: (direction: LayoutDirection) => void
}

export const getLayoutedElements = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  direction: LayoutDirection = 'vertical'
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'horizontal'
  dagreGraph.setGraph({ rankdir: isHorizontal ? 'LR' : 'TB', nodesep: 80, ranksep: 100 })

  nodes.forEach(node => {
    const width = node.style?.width || node.measured?.width || NODE_WIDTH
    const height = node.style?.height || node.measured?.height || NODE_HEIGHT
    dagreGraph.setNode(node.id, { width, height })
  })

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const width = node.style?.width || node.measured?.width || NODE_WIDTH
    const height = node.style?.height || node.measured?.height || NODE_HEIGHT
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    }
  })

  return {
    nodes: layoutedNodes,
    edges,
  }
}

export const createLayoutActions = (set: any, get: any, _api: any): LayoutActions => ({
  applyAutoLayout: (direction: LayoutDirection) => {
    const { nodes, edges } = get()
    if (nodes.length === 0) return

    const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, direction)
    set({ nodes: layoutedNodes })
  },
})

import dagre from 'dagre'
import { MarkerType } from 'reactflow'
import { WorkflowNode, WorkflowEdge, LayoutDirection, WorkflowNodeType } from '../../types'

const NODE_WIDTH = 280
const NODE_HEIGHT = 120
const LOOP_DEFAULT_WIDTH = 800
const LOOP_DEFAULT_HEIGHT = 800
const LOOP_INNER_PADDING_X = 48
const LOOP_INNER_PADDING_Y = 72
const LOOP_CHILD_GAP = 80

export interface LayoutActions {
  applyAutoLayout: (direction: LayoutDirection) => void
}

const getNodeSize = (node: WorkflowNode) => {
  const width = Number(node.style?.width || node.width || node.measured?.width || NODE_WIDTH)
  const height = Number(node.style?.height || node.height || node.measured?.height || NODE_HEIGHT)
  return { width, height }
}

const buildLoopTopologyOrder = (
  loopNodeId: string,
  children: WorkflowNode[],
  edges: WorkflowEdge[],
  direction: LayoutDirection
) => {
  const childMap = new Map(children.map(child => [child.id, child]))
  const childIds = new Set(children.map(child => child.id))
  const adjacency = new Map<string, string[]>()
  const indegree = new Map<string, number>()

  children.forEach(child => {
    adjacency.set(child.id, [])
    indegree.set(child.id, 0)
  })

  let loopStartTargetId: string | null = null

  edges.forEach(edge => {
    if (edge.source === loopNodeId && edge.sourceHandle === 'loop-start' && childIds.has(edge.target)) {
      loopStartTargetId = edge.target
      return
    }

    if (childIds.has(edge.source) && childIds.has(edge.target)) {
      adjacency.get(edge.source)?.push(edge.target)
      indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1)
    }
  })

  const positionSorter = (a: WorkflowNode, b: WorkflowNode) => {
    if (direction === 'horizontal') {
      return a.position.x - b.position.x || a.position.y - b.position.y
    }
    return a.position.y - b.position.y || a.position.x - b.position.x
  }

  const queue = children
    .filter(child => (indegree.get(child.id) || 0) === 0)
    .sort((a, b) => {
      if (loopStartTargetId === a.id) return -1
      if (loopStartTargetId === b.id) return 1
      return positionSorter(a, b)
    })

  const ordered: WorkflowNode[] = []
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current.id)) continue

    visited.add(current.id)
    ordered.push(current)

    const nextIds = [...(adjacency.get(current.id) || [])].sort((aId, bId) => {
      const a = childMap.get(aId)
      const b = childMap.get(bId)
      if (!a || !b) return 0
      return positionSorter(a, b)
    })

    nextIds.forEach(nextId => {
      indegree.set(nextId, (indegree.get(nextId) || 0) - 1)
      if ((indegree.get(nextId) || 0) === 0) {
        const nextNode = childMap.get(nextId)
        if (nextNode) queue.push(nextNode)
      }
    })

    queue.sort((a, b) => {
      if (loopStartTargetId === a.id) return -1
      if (loopStartTargetId === b.id) return 1
      return positionSorter(a, b)
    })
  }

  const remaining = children.filter(child => !visited.has(child.id)).sort(positionSorter)
  return [...ordered, ...remaining]
}

const buildLoopBranchLevels = (
  loopNodeId: string,
  children: WorkflowNode[],
  edges: WorkflowEdge[]
) => {
  const childMap = new Map(children.map(child => [child.id, child]))
  const childIds = new Set(children.map(child => child.id))
  const adjacency = new Map<string, string[]>()
  const reverseAdjacency = new Map<string, string[]>()
  const indegree = new Map<string, number>()

  children.forEach(child => {
    adjacency.set(child.id, [])
    reverseAdjacency.set(child.id, [])
    indegree.set(child.id, 0)
  })

  let loopStartTargetId: string | null = null

  edges.forEach(edge => {
    if (edge.source === loopNodeId && edge.sourceHandle === 'loop-start' && childIds.has(edge.target)) {
      loopStartTargetId = edge.target
      return
    }

    if (childIds.has(edge.source) && childIds.has(edge.target)) {
      adjacency.get(edge.source)?.push(edge.target)
      reverseAdjacency.get(edge.target)?.push(edge.source)
      indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1)
    }
  })

  const queue = children.filter(child => (indegree.get(child.id) || 0) === 0)
  if (loopStartTargetId) {
    queue.sort((a, b) => (a.id === loopStartTargetId ? -1 : b.id === loopStartTargetId ? 1 : 0))
  }

  const topoOrder: WorkflowNode[] = []
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    topoOrder.push(current)

    ;(adjacency.get(current.id) || []).forEach(nextId => {
      indegree.set(nextId, (indegree.get(nextId) || 0) - 1)
      if ((indegree.get(nextId) || 0) === 0) {
        const nextNode = childMap.get(nextId)
        if (nextNode) queue.push(nextNode)
      }
    })
  }

  const ordered = topoOrder.length === children.length ? topoOrder : buildLoopTopologyOrder(loopNodeId, children, edges, 'vertical')
  const levelMap = new Map<string, number>()

  ordered.forEach(node => {
    const parentLevels = (reverseAdjacency.get(node.id) || []).map(parentId => levelMap.get(parentId) || 0)
    if (loopStartTargetId === node.id) {
      levelMap.set(node.id, 0)
    } else if (parentLevels.length > 0) {
      levelMap.set(node.id, Math.max(...parentLevels) + 1)
    } else {
      levelMap.set(node.id, 0)
    }
  })

  const grouped = new Map<number, WorkflowNode[]>()
  ordered.forEach(node => {
    const level = levelMap.get(node.id) || 0
    if (!grouped.has(level)) grouped.set(level, [])
    grouped.get(level)?.push(node)
  })

  return {
    ordered,
    grouped,
  }
}

const createLoopBranchLayout = (children: WorkflowNode[], edges: WorkflowEdge[], loopNodeId: string, direction: LayoutDirection) => {
  const { ordered, grouped } = buildLoopBranchLevels(loopNodeId, children, edges)
  const positions = new Map<string, { x: number; y: number }>()
  let maxX = 0
  let maxY = 0
  const laneGap = LOOP_CHILD_GAP + 60
  const crossGap = LOOP_CHILD_GAP + 20

  Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([level, nodesInLevel]) => {
      let crossOffset = direction === 'horizontal' ? LOOP_INNER_PADDING_Y : LOOP_INNER_PADDING_X
      nodesInLevel.forEach(node => {
        const size = getNodeSize(node)
        const mainOffset = level * laneGap
        const position = direction === 'horizontal'
          ? { x: LOOP_INNER_PADDING_X + mainOffset, y: crossOffset }
          : { x: crossOffset, y: LOOP_INNER_PADDING_Y + mainOffset }

        positions.set(node.id, position)
        maxX = Math.max(maxX, position.x + size.width)
        maxY = Math.max(maxY, position.y + size.height)
        crossOffset += (direction === 'horizontal' ? size.height : size.width) + crossGap
      })
    })

  return {
    ordered,
    positions,
    width: Math.max(LOOP_DEFAULT_WIDTH, maxX + LOOP_INNER_PADDING_X),
    height: Math.max(LOOP_DEFAULT_HEIGHT, maxY + LOOP_INNER_PADDING_Y),
  }
}

const createLoopEdges = (
  loopNodeId: string,
  orderedChildren: WorkflowNode[],
  allEdges: WorkflowEdge[]
): WorkflowEdge[] => {
  const childIds = new Set(orderedChildren.map(child => child.id))
  const preservedEdges = allEdges.filter(edge => {
    if (edge.source === loopNodeId && edge.sourceHandle === 'loop-start' && childIds.has(edge.target)) {
      return false
    }
    if (childIds.has(edge.source) && childIds.has(edge.target)) {
      return false
    }
    return true
  })

  if (orderedChildren.length === 0) {
    return preservedEdges
  }

  const rebuiltEdges: WorkflowEdge[] = []
  rebuiltEdges.push({
    id: `e${loopNodeId}-start-${orderedChildren[0].id}`,
    source: loopNodeId,
    sourceHandle: 'loop-start',
    target: orderedChildren[0].id,
    type: 'custom',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  })

  for (let index = 1; index < orderedChildren.length; index += 1) {
    rebuiltEdges.push({
      id: `e${orderedChildren[index - 1].id}-${orderedChildren[index].id}`,
      source: orderedChildren[index - 1].id,
      target: orderedChildren[index].id,
      type: 'custom',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
    })
  }

  return [...preservedEdges, ...rebuiltEdges]
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

    const loopNodes = nodes.filter((node: WorkflowNode) => node.type === WorkflowNodeType.LOOP)
    const loopNodeIds = new Set(loopNodes.map((node: WorkflowNode) => node.id))
    const childNodes = nodes.filter((node: WorkflowNode) => node.parentNode && loopNodeIds.has(node.parentNode))
    const rootNodes = nodes.filter((node: WorkflowNode) => !node.parentNode)

    const layoutedRoot = getLayoutedElements(rootNodes, edges, direction).nodes
    const rootPositionMap = new Map(layoutedRoot.map((node: WorkflowNode) => [node.id, node.position]))

    let nextEdges = [...edges]
    const loopChildPositionMap = new Map<string, { x: number; y: number }>()
    const loopStyleMap = new Map<string, { width: number; height: number }>()

    loopNodes.forEach((loopNode: WorkflowNode) => {
      const loopChildren = childNodes.filter((node: WorkflowNode) => node.parentNode === loopNode.id)
      const orderedChildren = buildLoopTopologyOrder(loopNode.id, loopChildren, nextEdges, direction)

      if (orderedChildren.length === 0) {
        loopStyleMap.set(loopNode.id, { width: LOOP_DEFAULT_WIDTH, height: LOOP_DEFAULT_HEIGHT })
        nextEdges = nextEdges.filter(
          edge => !(edge.source === loopNode.id && edge.sourceHandle === 'loop-start')
        )
        return
      }

      const branchLayout = createLoopBranchLayout(loopChildren, nextEdges, loopNode.id, direction)
      branchLayout.ordered.forEach(child => {
        const position = branchLayout.positions.get(child.id)
        if (position) {
          loopChildPositionMap.set(child.id, position)
        }
      })
      loopStyleMap.set(loopNode.id, { width: branchLayout.width, height: branchLayout.height })
      nextEdges = createLoopEdges(loopNode.id, branchLayout.ordered, nextEdges)
    })

    const nextNodes = nodes.map((node: WorkflowNode) => {
      if (node.parentNode && loopNodeIds.has(node.parentNode)) {
        const childPosition = loopChildPositionMap.get(node.id)
        if (!childPosition) return node
        return {
          ...node,
          extent: 'parent',
          position: childPosition,
        }
      }

      const rootPosition = rootPositionMap.get(node.id)
      const style = node.type === WorkflowNodeType.LOOP
        ? { ...(node.style || {}), ...(loopStyleMap.get(node.id) || { width: LOOP_DEFAULT_WIDTH, height: LOOP_DEFAULT_HEIGHT }) }
        : node.style

      return {
        ...node,
        position: rootPosition || node.position,
        style,
      }
    })

    set({ nodes: nextNodes, edges: nextEdges })
  },
})

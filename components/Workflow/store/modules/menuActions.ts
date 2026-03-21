import { MarkerType } from 'reactflow'
import { WorkflowNode, WorkflowNodeType, WorkflowEdge } from '../../types'
import { createDefaultNodePayload, getNodeMeta } from '../../config/nodeRegistry'

const getNodeLabel = (nodeType: WorkflowNodeType): string => {
  return getNodeMeta(nodeType)?.label || nodeType
}

export interface EdgeMenuState {
  isOpen: boolean
  edgeId: string | null
  position: { x: number; y: number } | null
  sourceId: string | null
  targetId: string | null
}

export interface NodeMenuState {
  isOpen: boolean
  sourceNodeId: string | null
  position: { x: number; y: number } | null
  canvasPosition: { x: number; y: number } | null
  parentNodeId: string | null
}

export interface MenuActions {
  openEdgeMenu: (
    edgeId: string,
    position: { x: number; y: number },
    sourceId: string,
    targetId: string
  ) => void
  closeEdgeMenu: () => void
  insertNodeBetween: (nodeType: WorkflowNodeType) => void
  openNodeAppendMenu: (
    sourceNodeId: string,
    position: { x: number; y: number },
    parentNodeId?: string,
    canvasPosition?: { x: number; y: number }
  ) => void
  closeNodeMenu: () => void
  appendNode: (nodeType: WorkflowNodeType) => void
}

export const createMenuActions = (set: any, get: any): MenuActions => ({
  openEdgeMenu: (
    edgeId: string,
    position: { x: number; y: number },
    sourceId: string,
    targetId: string
  ) => {
    get().closeNodeMenu()
    set({
      edgeMenu: {
        isOpen: true,
        edgeId,
        position,
        sourceId,
        targetId,
      },
    })
  },

  closeEdgeMenu: () => {
    set((state: any) => ({
      edgeMenu: {
        ...state.edgeMenu,
        isOpen: false,
      },
    }))
  },

  insertNodeBetween: (nodeType: WorkflowNodeType) => {
    const { edgeMenu, nodes, edges } = get()
    if (!edgeMenu.edgeId || !edgeMenu.sourceId || !edgeMenu.targetId) return

    const sourceNode = nodes.find((n: WorkflowNode) => n.id === edgeMenu.sourceId)
    const targetNode = nodes.find((n: WorkflowNode) => n.id === edgeMenu.targetId)

    if (!sourceNode || !targetNode) return

    const oldEdge = edges.find((e: WorkflowEdge) => e.id === edgeMenu.edgeId)

    const newNodeId = `${nodeType}_${Date.now()}`
    const newNodePosition = {
      x: (sourceNode.position.x + targetNode.position.x) / 2,
      y: (sourceNode.position.y + targetNode.position.y) / 2,
    }

    let label = getNodeLabel(nodeType)
    const meta = getNodeMeta(nodeType)
    let description = meta?.description || '插入的新节点'
    const newNodeBase = createDefaultNodePayload(nodeType, newNodePosition)

    const newNode: WorkflowNode = {
      ...newNodeBase,
      id: newNodeId,
      position: newNodePosition,
      parentNode:
        sourceNode.parentNode === targetNode.parentNode ? sourceNode.parentNode : undefined,
      extent:
        sourceNode.parentNode === targetNode.parentNode && sourceNode.parentNode
          ? 'parent'
          : undefined,
      data: { ...newNodeBase.data, label, description },
    }

    let sourceHandle = oldEdge?.sourceHandle
    if (sourceNode.type === WorkflowNodeType.LOOP && !sourceHandle) {
      sourceHandle = 'loop-output'
    }

    const newEdge1 = {
      id: `e${edgeMenu.sourceId}-${newNodeId}`,
      source: edgeMenu.sourceId,
      target: newNodeId,
      sourceHandle: sourceHandle,
      type: 'custom',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
    }

    let sourceHandleForSecondEdge: string | undefined = undefined
    if (nodeType === WorkflowNodeType.PARALLEL) {
      sourceHandleForSecondEdge = 'source'
    }

    let targetHandleForSecondEdge: string | undefined = undefined
    if (targetNode.type === WorkflowNodeType.LOOP) {
      targetHandleForSecondEdge = 'loop-input'
    }

    const newEdge2 = {
      id: `e${newNodeId}-${edgeMenu.targetId}`,
      source: newNodeId,
      target: edgeMenu.targetId,
      sourceHandle: sourceHandleForSecondEdge,
      targetHandle: targetHandleForSecondEdge,
      type: 'custom',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
    }

    const newEdges = edges
      .filter((e: WorkflowEdge) => e.id !== edgeMenu.edgeId)
      .concat([newEdge1, newEdge2])
    const newNodes = [...nodes, newNode]

    set({
      nodes: newNodes,
      edges: newEdges,
      edgeMenu: { ...edgeMenu, isOpen: false },
    })
  },

  openNodeAppendMenu: (
    sourceNodeId: string,
    position: { x: number; y: number },
    parentNodeId?: string,
    canvasPosition?: { x: number; y: number }
  ) => {
    get().closeEdgeMenu()
    set({
      nodeMenu: {
        isOpen: true,
        sourceNodeId,
        position,
        canvasPosition: canvasPosition || null,
        parentNodeId: parentNodeId || null,
      },
    })
  },

  closeNodeMenu: () => {
    set((state: any) => ({
      nodeMenu: { ...state.nodeMenu, isOpen: false },
    }))
  },

  appendNode: (nodeType: WorkflowNodeType) => {
    const { nodeMenu, nodes, edges } = get()

    let newNodePosition = { x: 0, y: 0 }
    let parentNodeId = nodeMenu.parentNodeId
    let sourceNode = null

    if (nodeMenu.sourceNodeId) {
      sourceNode = nodes.find((n: WorkflowNode) => n.id === nodeMenu.sourceNodeId)
      if (sourceNode) {
        newNodePosition = {
          x: sourceNode.position.x,
          y: sourceNode.position.y + 150,
        }
        parentNodeId = sourceNode.parentNode || parentNodeId
      }
    } else if (nodeMenu.canvasPosition) {
      newNodePosition = nodeMenu.canvasPosition
    }

    const newNodeId = `${nodeType}_${Date.now()}`
    let label = getNodeLabel(nodeType)
    const meta = getNodeMeta(nodeType)
    let description = meta?.description || '追加的新节点'
    const newNodeBase = createDefaultNodePayload(nodeType, newNodePosition)

    const newNode: WorkflowNode = {
      ...newNodeBase,
      id: newNodeId,
      position: newNodePosition,
      parentNode: parentNodeId || undefined,
      extent: parentNodeId ? 'parent' : undefined,
      data: { ...newNodeBase.data, label, description },
    }

    let newEdges = [...edges]
    if (nodeMenu.sourceNodeId) {
      const sourceNode = nodes.find((n: WorkflowNode) => n.id === nodeMenu.sourceNodeId)
      let sourceHandle = undefined

      if (sourceNode?.type === WorkflowNodeType.LOOP) {
        sourceHandle = 'loop-output'
      }

      let targetHandle = undefined
      if (nodeType === WorkflowNodeType.LOOP) {
        targetHandle = 'loop-input'
      }

      const newEdge = {
        id: `e${nodeMenu.sourceNodeId}-${newNodeId}`,
        source: nodeMenu.sourceNodeId,
        sourceHandle: sourceHandle,
        target: newNodeId,
        targetHandle: targetHandle,
        type: 'custom',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
      }
      newEdges.push(newEdge)
    } else if (nodeMenu.parentNodeId) {
      const parentNode = nodes.find((n: WorkflowNode) => n.id === nodeMenu.parentNodeId)
      if (parentNode && parentNode.type === WorkflowNodeType.LOOP) {
        const newEdge = {
          id: `e${nodeMenu.parentNodeId}-start-${newNodeId}`,
          source: nodeMenu.parentNodeId,
          sourceHandle: 'loop-start',
          target: newNodeId,
          targetHandle: undefined,
          type: 'custom',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        }
        newEdges.push(newEdge)
      }
    }

    set({
      nodes: [...nodes, newNode],
      edges: newEdges,
      nodeMenu: { ...nodeMenu, isOpen: false },
    })
  },
})

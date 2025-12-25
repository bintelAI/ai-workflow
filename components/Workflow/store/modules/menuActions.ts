import { MarkerType } from 'reactflow'
import { WorkflowNode, WorkflowNodeType, WorkflowEdge } from '../../types'

const getNodeLabel = (nodeType: WorkflowNodeType): string => {
  const labels: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.START]: '开始',
    [WorkflowNodeType.END]: '结束',
    [WorkflowNodeType.LLM]: 'LLM 调用',
    [WorkflowNodeType.API_CALL]: 'API 调用',
    [WorkflowNodeType.SCRIPT]: '脚本执行',
    [WorkflowNodeType.DATA_OP]: '数据操作',
    [WorkflowNodeType.CONDITION]: '条件判断',
    [WorkflowNodeType.PARALLEL]: '并行分支',
    [WorkflowNodeType.LOOP]: '循环节点',
    [WorkflowNodeType.APPROVAL]: '审批节点',
    [WorkflowNodeType.CC]: '抄送节点',
    [WorkflowNodeType.NOTIFICATION]: '通知节点',
    [WorkflowNodeType.DELAY]: '延迟节点',
    [WorkflowNodeType.SQL]: 'SQL 执行',
    [WorkflowNodeType.KNOWLEDGE_RETRIEVAL]: '知识库检索',
    [WorkflowNodeType.DOCUMENT_EXTRACTOR]: '文档提取',
    [WorkflowNodeType.CLOUD_PHONE]: '云手机',
  }
  return labels[nodeType] || nodeType
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
    let description = '插入的新节点'

    if (nodeType === WorkflowNodeType.KNOWLEDGE_RETRIEVAL) {
      description = '添加知识库检索'
    } else if (nodeType === WorkflowNodeType.DOCUMENT_EXTRACTOR) {
      description = '从文档中提取内容'
    }

    let config: any = {}
    if (nodeType === WorkflowNodeType.PARALLEL) {
      config = { branches: ['分支 1', '分支 2'] }
    }
    if (nodeType === WorkflowNodeType.LOOP) {
      config = { targetArray: '' }
    }

    const newNode: WorkflowNode = {
      id: newNodeId,
      type: nodeType,
      position: newNodePosition,
      parentNode:
        sourceNode.parentNode === targetNode.parentNode ? sourceNode.parentNode : undefined,
      extent:
        sourceNode.parentNode === targetNode.parentNode && sourceNode.parentNode
          ? 'parent'
          : undefined,
      style: nodeType === WorkflowNodeType.LOOP ? { width: 350, height: 250 } : undefined,
      data: { label, description, config },
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
      sourceHandleForSecondEdge = 'branch-0'
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
    let description = '追加的新节点'

    if (nodeType === WorkflowNodeType.KNOWLEDGE_RETRIEVAL) {
      description = '添加知识库检索'
    } else if (nodeType === WorkflowNodeType.DOCUMENT_EXTRACTOR) {
      description = '从文档中提取内容'
    }

    let config: any = {}
    if (nodeType === WorkflowNodeType.PARALLEL) {
      config = { branches: ['分支 1', '分支 2'] }
    }
    if (nodeType === WorkflowNodeType.LOOP) {
      config = { targetArray: '' }
    }

    const newNode: WorkflowNode = {
      id: newNodeId,
      type: nodeType,
      position: newNodePosition,
      parentNode: parentNodeId || undefined,
      extent: parentNodeId ? 'parent' : undefined,
      style: nodeType === WorkflowNodeType.LOOP ? { width: 350, height: 250 } : undefined,
      data: { label, description, config },
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

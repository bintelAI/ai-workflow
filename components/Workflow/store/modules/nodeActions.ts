import { NodeChange, applyNodeChanges } from 'reactflow'
import { WorkflowNode, WorkflowNodeType } from '../../types'

export interface NodeActions {
  onNodesChange: (changes: NodeChange[]) => void
  addNode: (node: WorkflowNode) => void
  updateNodeData: (id: string, data: any) => void
  deleteNode: (id: string) => void
  setSelectedNode: (id: string | null) => void
  onNodeDragStop: (event: any, node: WorkflowNode, allNodes: WorkflowNode[]) => void
}

export const createNodeActions = (set: any, get: any): NodeActions => ({
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },

  addNode: (node: WorkflowNode) => {
    set({
      nodes: [...get().nodes, node],
    })
  },

  updateNodeData: (id: string, data: any) => {
    set({
      nodes: get().nodes.map((node: WorkflowNode) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } }
        }
        return node
      }),
    })
  },

  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter((n: WorkflowNode) => n.id !== id && n.parentNode !== id),
      edges: get().edges.filter((e: any) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    })
  },

  setSelectedNode: (id: string | null) => {
    set({ selectedNodeId: id })
  },

  onNodeDragStop: (event: any, node: WorkflowNode, allNodes: WorkflowNode[]) => {
    const loopNodes = allNodes.filter(n => n.type === WorkflowNodeType.LOOP && n.id !== node.id)

    const draggedNodeRect = {
      x: node.position.x,
      y: node.position.y,
      width: node.width || 200,
      height: node.height || 80,
    }

    const getAbsPos = (n: WorkflowNode) => {
      if (n.parentNode) {
        const parent = allNodes.find(p => p.id === n.parentNode)
        if (parent) {
          const pAbs = getAbsPos(parent)
          return { x: pAbs.x + n.position.x, y: pAbs.y + n.position.y }
        }
      }
      return n.position
    }

    const absDraggedPos = getAbsPos(node)
    const absRect = {
      x: absDraggedPos.x,
      y: absDraggedPos.y,
      width: node.width || 200,
      height: node.height || 80,
    }

    let newParentId: string | undefined = undefined

    for (const loopNode of loopNodes) {
      const loopAbsPos = getAbsPos(loopNode)
      const loopRect = {
        x: loopAbsPos.x,
        y: loopAbsPos.y,
        width: loopNode.width || 350,
        height: loopNode.height || 250,
      }

      const centerX = absRect.x + absRect.width / 2
      const centerY = absRect.y + absRect.height / 2

      if (
        centerX >= loopRect.x &&
        centerX <= loopRect.x + loopRect.width &&
        centerY >= loopRect.y &&
        centerY <= loopRect.y + loopRect.height
      ) {
        newParentId = loopNode.id
        break
      }
    }

    if (node.parentNode !== newParentId) {
      set((state: any) => ({
        nodes: state.nodes.map((n: WorkflowNode) => {
          if (n.id === node.id) {
            let newPosition = n.position

            if (newParentId) {
              const parent = allNodes.find(p => p.id === newParentId)
              const parentAbs = getAbsPos(parent!)
              newPosition = {
                x: absRect.x - parentAbs.x,
                y: absRect.y - parentAbs.y,
              }

              return {
                ...n,
                parentNode: newParentId,
                extent: 'parent',
                position: newPosition,
              }
            } else {
              return {
                ...n,
                parentNode: undefined,
                extent: undefined,
                position: absRect,
              }
            }
          }
          return n
        }),
      }))
    }
  },
})

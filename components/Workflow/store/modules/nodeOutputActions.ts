export interface NodeOutputActions {
  getNodeOutput: (nodeId: string) => any
  updateNodeOutput: (nodeId: string, output: any) => void
}

export const createNodeOutputActions = (set: any, get: any): NodeOutputActions => ({
  getNodeOutput: (nodeId: string) => {
    return get().nodeOutputs[nodeId] || {}
  },

  updateNodeOutput: (nodeId: string, output: any) => {
    set((state: any) => ({
      nodeOutputs: { ...state.nodeOutputs, [nodeId]: output },
    }))
  },
})

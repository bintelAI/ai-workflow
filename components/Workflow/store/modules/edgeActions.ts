import { EdgeChange, applyEdgeChanges, Connection, addEdge, MarkerType } from 'reactflow'

export interface EdgeActions {
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
}

export const createEdgeActions = (set: any, get: any): EdgeActions => ({
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'custom',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        get().edges
      ),
    })
  },
})

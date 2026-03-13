import { WorkflowStoreState } from '../types'
import { flowRunApi, runFlowWithSSE } from '@/src/api/flow'
import type { FlowNodeResult } from '@/src/types/flow'

export interface ExecutionState {
  isExecuting: boolean
  executionLogs: ExecutionLog[]
  currentRequestId: string | null
  sseConnection: { close: () => void } | null
}

export interface ExecutionLog {
  id: string
  nodeId: string
  nodeType: string
  nodeLabel: string
  status: 'pending' | 'running' | 'success' | 'error'
  timestamp: number
  duration: number
  input?: any
  output?: any
  error?: string
  content?: string
}

export interface ExecutionActions {
  runFlow: (params?: { params?: Record<string, any>; nodeId?: string }) => Promise<void>
  stopExecution: () => void
  clearExecutionLogs: () => void
  getExecutionLog: (nodeId: string) => ExecutionLog | undefined
}

export type ExecutionStore = ExecutionState & ExecutionActions

const initialExecutionState: ExecutionState = {
  isExecuting: false,
  executionLogs: [],
  currentRequestId: null,
  sseConnection: null,
}

export const createExecutionActions = (set: any, get: any): ExecutionStore => ({
  ...initialExecutionState,

  runFlow: async (options = {}) => {
    const { flowInfo, nodes } = get() as any
    if (!flowInfo?.label) {
      throw new Error('No flow loaded')
    }

    const requestId = `req_${Date.now()}`
    set({
      isExecuting: true,
      currentRequestId: requestId,
      executionLogs: [],
    })

    const startNode = nodes.find((n: any) => n.type === 'start')
    const startConfig = startNode?.data?.config || {}
    const params =
      options.params ||
      (startConfig.devMode !== false ? JSON.parse(startConfig.devInput || '{}') : {})

    const connection = runFlowWithSSE(
      {
        label: flowInfo.label,
        params,
        requestId,
        nodeId: options.nodeId,
        stream: true,
      },
      {
        onNodeStart: (nodeId, nodeType) => {
          const node = (get() as any).nodes.find((n: any) => n.id === nodeId)
          set((state: any) => ({
            executionLogs: [
              ...state.executionLogs,
              {
                id: `${nodeId}_${Date.now()}`,
                nodeId,
                nodeType,
                nodeLabel: node?.data?.label || nodeId,
                status: 'running',
                timestamp: Date.now(),
                duration: 0,
              },
            ],
            nodeExecutionStatus: {
              ...state.nodeExecutionStatus,
              [nodeId]: 'running',
            },
          }))
        },

        onNodeRunning: (nodeId, content) => {
          set((state: any) => {
            const logs = state.executionLogs
            const lastLogIndex = logs.findIndex(
              (l: ExecutionLog) => l.nodeId === nodeId && l.status === 'running'
            )
            if (lastLogIndex >= 0) {
              const newLogs = [...logs]
              newLogs[lastLogIndex] = {
                ...newLogs[lastLogIndex],
                content: (newLogs[lastLogIndex].content || '') + (content || ''),
              }
              return { executionLogs: newLogs }
            }
            return state
          })
        },

        onNodeComplete: (nodeId, result) => {
          set((state: any) => {
            const logs = state.executionLogs
            const lastLogIndex = logs.findIndex(
              (l: ExecutionLog) => l.nodeId === nodeId && l.status === 'running'
            )
            const newLogs = [...logs]
            if (lastLogIndex >= 0) {
              newLogs[lastLogIndex] = {
                ...newLogs[lastLogIndex],
                status: 'success',
                duration: Date.now() - newLogs[lastLogIndex].timestamp,
                output: result,
              }
            }
            return {
              executionLogs: newLogs,
              nodeExecutionStatus: {
                ...state.nodeExecutionStatus,
                [nodeId]: 'success',
              },
              nodeOutputs: {
                ...state.nodeOutputs,
                [nodeId]: result,
              },
            }
          })
        },

        onNodeError: (nodeId, error) => {
          set((state: any) => {
            const logs = state.executionLogs
            const lastLogIndex = logs.findIndex(
              (l: ExecutionLog) => l.nodeId === nodeId && l.status === 'running'
            )
            const newLogs = [...logs]
            if (lastLogIndex >= 0) {
              newLogs[lastLogIndex] = {
                ...newLogs[lastLogIndex],
                status: 'error',
                duration: Date.now() - newLogs[lastLogIndex].timestamp,
                error,
              }
            }
            return {
              executionLogs: newLogs,
              nodeExecutionStatus: {
                ...state.nodeExecutionStatus,
                [nodeId]: 'error',
              },
            }
          })
        },

        onFlowComplete: () => {
          set({ isExecuting: false, sseConnection: null })
        },

        onError: (error) => {
          console.error('Flow execution error:', error)
          set({
            isExecuting: false,
            sseConnection: null,
          })
        },
      }
    )

    set({ sseConnection: connection })
  },

  stopExecution: () => {
    const { sseConnection } = get() as any
    if (sseConnection) {
      sseConnection.close()
    }
    set({
      isExecuting: false,
      sseConnection: null,
    })
  },

  clearExecutionLogs: () => {
    set({
      executionLogs: [],
      nodeExecutionStatus: {},
    })
  },

  getExecutionLog: (nodeId: string) => {
    const { executionLogs } = get() as any
    return executionLogs.find((l: ExecutionLog) => l.nodeId === nodeId)
  },
})

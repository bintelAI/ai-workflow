import { WorkflowStoreState, WorkflowNode, WorkflowEdge } from '../types'
import { flowInfoApi } from '@/src/api/flow'
import { exportToBackend, importFromBackend } from '../../adapters/backendAdapter'
import type { FlowInfoEntity, FlowDraft } from '@/src/types/flow'

export interface FlowState {
  flowInfo: FlowInfoEntity | null
  flowList: FlowInfoEntity[]
  isFlowLoading: boolean
  isFlowSaving: boolean
  isExecuting: boolean
  executionResult: any
  teamId: string | null
}

export interface FlowActions {
  loadFlow: (flowId: number, teamId?: string) => Promise<void>
  saveFlow: () => Promise<void>
  loadFlowList: (params?: { page?: number; size?: number; teamId?: string }) => Promise<void>
  createFlow: (data: Partial<FlowInfoEntity> & { teamId?: string }) => Promise<FlowInfoEntity>
  updateFlow: (data: Partial<FlowInfoEntity> & { teamId?: string }) => Promise<void>
  deleteFlow: (id: number, teamId?: string) => Promise<void>
  releaseFlow: () => Promise<void>
  setFlowInfo: (info: FlowInfoEntity | null) => void
  setExecuting: (isExecuting: boolean) => void
  setExecutionResult: (result: any) => void
  setTeamId: (teamId: string | null) => void
}

export type FlowStore = FlowState & FlowActions

const initialFlowState: FlowState = {
  flowInfo: null,
  flowList: [],
  isFlowLoading: false,
  isFlowSaving: false,
  isExecuting: false,
  executionResult: null,
  teamId: null,
}

export const createFlowActions = (set: any, get: any): FlowStore => ({
  ...initialFlowState,

  loadFlow: async (flowId: number, teamId?: string) => {
    const currentTeamId = teamId || get().teamId
    set({ isFlowLoading: true })
    try {
      const res = await flowInfoApi.info(flowId, currentTeamId || undefined)
      const flowInfo = res.data
      set({ flowInfo })

      if (flowInfo?.draft) {
        const { nodes, edges } = importFromBackend(flowInfo.draft)
        get().setWorkflow(nodes as WorkflowNode[], edges as WorkflowEdge[])
      }
    } catch (error) {
      console.error('Failed to load flow:', error)
      throw error
    } finally {
      set({ isFlowLoading: false })
    }
  },

  saveFlow: async () => {
    const { flowInfo, nodes, edges, teamId } = get()
    if (!flowInfo?.id) return

    set({ isFlowSaving: true })
    try {
      const draft = exportToBackend({ nodes, edges } as any)
      await flowInfoApi.save(flowInfo.id, draft, teamId || undefined)
    } catch (error) {
      console.error('Failed to save flow:', error)
      throw error
    } finally {
      set({ isFlowSaving: false })
    }
  },

  loadFlowList: async (params = { page: 1, size: 20 }) => {
    const teamId = params.teamId || get().teamId
    set({ isFlowLoading: true })
    try {
      const res = await flowInfoApi.page({ ...params, teamId: teamId || undefined })
      set({ flowList: res.data.list || [] })
    } catch (error) {
      console.error('Failed to load flow list:', error)
      throw error
    } finally {
      set({ isFlowLoading: false })
    }
  },

  createFlow: async (data: Partial<FlowInfoEntity> & { teamId?: string }) => {
    const teamId = data.teamId || get().teamId
    try {
      const res = await flowInfoApi.add({ ...data, teamId: teamId || undefined })
      const newFlow = res.data
      set((state: any) => ({ flowList: [...state.flowList, newFlow] }))
      return newFlow
    } catch (error) {
      console.error('Failed to create flow:', error)
      throw error
    }
  },

  updateFlow: async (data: Partial<FlowInfoEntity> & { teamId?: string }) => {
    const teamId = data.teamId || get().teamId
    try {
      await flowInfoApi.update({ ...data, teamId: teamId || undefined })
      set((state: any) => ({
        flowInfo: state.flowInfo?.id === data.id ? { ...state.flowInfo, ...data } : state.flowInfo,
        flowList: state.flowList.map((f: any) => (f.id === data.id ? { ...f, ...data } : f)),
      }))
    } catch (error) {
      console.error('Failed to update flow:', error)
      throw error
    }
  },

  deleteFlow: async (id: number, teamId?: string) => {
    const currentTeamId = teamId || get().teamId
    try {
      await flowInfoApi.delete(id, currentTeamId || undefined)
      set((state: any) => ({
        flowList: state.flowList.filter((f: any) => f.id !== id),
        flowInfo: state.flowInfo?.id === id ? null : state.flowInfo,
      }))
    } catch (error) {
      console.error('Failed to delete flow:', error)
      throw error
    }
  },

  releaseFlow: async () => {
    const { flowInfo, teamId } = get()
    if (!flowInfo?.id) return

    try {
      await flowInfoApi.release(flowInfo.id, teamId || undefined)
      set((state: any) => ({
        flowInfo: state.flowInfo ? { ...state.flowInfo, status: 1 } : null,
      }))
    } catch (error) {
      console.error('Failed to release flow:', error)
      throw error
    }
  },

  setFlowInfo: (info) => set({ flowInfo: info }),
  setExecuting: (isExecuting) => set({ isExecuting }),
  setExecutionResult: (result) => set({ executionResult: result }),
  setTeamId: (teamId) => set({ teamId }),
})

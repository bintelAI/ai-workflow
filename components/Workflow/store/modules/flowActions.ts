import { WorkflowStoreState, WorkflowNode, WorkflowEdge, WorkflowNodeType } from '../../types'
import { flowInfoApi } from '@ai-flow/src/api/flow'
import { exportToBackend, importFromBackend } from '../../adapters/backendAdapter'
import type { FlowInfoEntity, FlowDraft } from '@ai-flow/src/types/flow'
import { getPluginModeByFlowType } from '../../config/pluginModeRegistry'

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
      const res = await flowInfoApi.info(currentTeamId || '', flowId)
      const flowInfo = res.data
      
      if (!flowInfo) {
        // 当检查不到数据的时候 直接给他一个开始和结束节点
        const defaultNodes: WorkflowNode[] = [
          {
            id: '1',
            type: WorkflowNodeType.START,
            position: { x: 250, y: 50 },
            data: {
              label: '流程开始',
              description: 'Webhook 触发',
              config: { 
                devMode: true, 
                devInput: '{\n  "content": ""\n}',
                variables: [
                  {
                    name: 'content',
                    displayName: '输入的内容',
                    type: 'text',
                    required: false,
                    hidden: false
                  }
                ]
              },
            },
          },
          {
            id: '2',
            type: WorkflowNodeType.END,
            position: { x: 250, y: 250 },
            data: {
              label: '流程结束',
              description: '流程执行完成',
            },
          }
        ]
        const defaultEdges: WorkflowEdge[] = [
          {
            id: 'e1-2',
            source: '1',
            target: '2',
            type: 'custom',
          }
        ]
        get().setWorkflow(defaultNodes, defaultEdges)
        set({ isFlowLoading: false })
        return
      }

      const pluginMode = getPluginModeByFlowType(flowInfo?.type)
      set({ flowInfo, activeCategoryId: pluginMode.categoryId })

      if (flowInfo?.draft) {
        const { nodes, edges } = importFromBackend(flowInfo.draft)
        get().setWorkflow(nodes as WorkflowNode[], edges as WorkflowEdge[])
      } else {
        // 如果有 flowInfo 但没有 draft，也给默认节点
        const defaultNodes: WorkflowNode[] = [
          {
            id: '1',
            type: WorkflowNodeType.START,
            position: { x: 250, y: 50 },
            data: {
              label: '流程开始',
              description: 'Webhook 触发',
              config: { 
                devMode: true, 
                devInput: '{\n  "content": ""\n}',
                variables: [
                  {
                    name: 'content',
                    displayName: '输入的内容',
                    type: 'text',
                    required: false,
                    hidden: false
                  }
                ]
              },
            },
          },
          {
            id: '2',
            type: WorkflowNodeType.END,
            position: { x: 250, y: 250 },
            data: {
              label: '流程结束',
              description: '流程执行完成',
            },
          }
        ]
        const defaultEdges: WorkflowEdge[] = [
          {
            id: 'e1-2',
            source: '1',
            target: '2',
            type: 'custom',
          }
        ]
        get().setWorkflow(defaultNodes, defaultEdges)
      }
    } catch (error) {
      console.error('Failed to load flow:', error)
      // 当检查不到数据或接口报错的时候 直接给他一个开始和结束节点
      const defaultNodes: WorkflowNode[] = [
        {
          id: '1',
          type: WorkflowNodeType.START,
          position: { x: 250, y: 50 },
          data: {
            label: '流程开始',
            description: 'Webhook 触发',
            config: { 
              devMode: true, 
              devInput: '{\n  "content": ""\n}',
              variables: [
                {
                  name: 'content',
                  displayName: '输入的内容',
                  type: 'text',
                  required: false,
                  hidden: false
                }
              ]
            },
          },
        },
        {
          id: '2',
          type: WorkflowNodeType.END,
          position: { x: 250, y: 250 },
          data: {
            label: '流程结束',
            description: '流程执行完成',
          },
        }
      ]
      const defaultEdges: WorkflowEdge[] = [
        {
          id: 'e1-2',
          source: '1',
          target: '2',
          type: 'custom',
        }
      ]
      get().setWorkflow(defaultNodes, defaultEdges)
    } finally {
      set({ isFlowLoading: false })
    }
  },

  saveFlow: async () => {
    const { flowInfo, nodes, edges, teamId } = get()
    if (!flowInfo?.id || !teamId) return

    set({ isFlowSaving: true })
    try {
      const draft = exportToBackend({ nodes, edges } as any)
      await flowInfoApi.save(teamId, flowInfo.id, draft)
    } catch (error) {
      console.error('Failed to save flow:', error)
      throw error
    } finally {
      set({ isFlowSaving: false })
    }
  },

  loadFlowList: async (params = { page: 1, size: 20 }) => {
    const teamId = params.teamId || get().teamId
    if (!teamId) return
    set({ isFlowLoading: true })
    try {
      const res = await flowInfoApi.page(teamId, params)
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
    if (!teamId) {
      throw new Error('团队ID不能为空')
    }
    try {
      const { teamId: _teamId, ...payload } = data
      const res = await flowInfoApi.add(teamId, payload)
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
    if (!teamId) {
      throw new Error('团队ID不能为空')
    }
    try {
      const { teamId: _teamId, ...payload } = data
      await flowInfoApi.update(teamId, payload)
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
    if (!currentTeamId) {
      throw new Error('团队ID不能为空')
    }
    try {
      await flowInfoApi.delete(currentTeamId, id)
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
    if (!flowInfo?.id || !teamId) return

    try {
      const res = await flowInfoApi.release(teamId, flowInfo.id)
      set((state: any) => ({
        flowInfo: state.flowInfo
          ? {
              ...state.flowInfo,
              ...(res.data || {}),
              status: 1,
              version: res.data?.version || state.flowInfo.version,
              releaseTime: res.data?.releaseTime || new Date().toISOString(),
            }
          : null,
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

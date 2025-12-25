import { WorkflowNode, WorkflowEdge, WorkflowNodeType, SimulationLog } from '../../types'
import { runSimulationLogic } from '../simulationRunner'

export interface SimulationActions {
  resetSimulation: () => void
  runSimulation: (customInput?: string) => Promise<void>
  validateWorkflow: () => string[]
  toggleDrawer: (isOpen?: boolean) => void
}

export const createSimulationActions = (set: any, get: any): SimulationActions => ({
  resetSimulation: () => {
    set({ simulationLogs: [], nodeExecutionStatus: {}, nodeOutputs: {} })
  },

  runSimulation: async (customInput?: string) => {
    const { nodes, edges } = get()
    set({ nodeExecutionStatus: {}, nodeOutputs: {} })

    const result = await runSimulationLogic(nodes, edges, customInput)

    set({
      simulationLogs: result.logs,
      isDrawerOpen: true,
      nodeExecutionStatus: result.executionStatus,
      nodeOutputs: result.nodeOutputs,
    })
  },

  validateWorkflow: () => {
    const { nodes } = get()
    const errors: string[] = []

    const startNodes = nodes.filter((n: WorkflowNode) => n.type === WorkflowNodeType.START)
    if (startNodes.length === 0) errors.push('❌ 错误: 流程必须包含一个【开始节点】')

    const loopNodes = nodes.filter((n: WorkflowNode) => n.type === WorkflowNodeType.LOOP)
    loopNodes.forEach((loop: WorkflowNode) => {
      if (!(loop.data.config as any)?.targetArray) {
        errors.push(`⚠️ 警告: 循环节点 "${loop.data.label}" 未配置目标数组`)
      }
      const children = nodes.filter((n: WorkflowNode) => n.parentNode === loop.id)
      if (children.length === 0) {
        errors.push(`⚠️ 警告: 循环节点 "${loop.data.label}" 内部是空的`)
      }
    })

    return errors
  },

  toggleDrawer: (isOpen?: boolean) =>
    set((state: any) => ({
      isDrawerOpen: isOpen !== undefined ? isOpen : !state.isDrawerOpen,
    })),
})

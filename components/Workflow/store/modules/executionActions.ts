import { WorkflowStoreState } from '../types'
import { runFlowWithSSE } from '@ai-flow/src/api/flow'
import type { FlowNodeResultData } from '@ai-flow/src/types/flow'

export interface ExecutionState {
  isExecuting: boolean
  executionLogs: ExecutionLog[]
  currentRequestId: string | null
  currentSessionId: string | null
  sseConnection: { close: () => void } | null
}

export interface ExecutionLog {
  id: string
  nodeId: string
  nodeType: string
  nodeLabel: string
  status: 'pending' | 'running' | 'success' | 'error' | 'info'
  timestamp: number
  duration: number
  input?: any
  output?: any
  error?: string
  content?: string
  toolCalls?: Array<{ name: string; type: 'start' | 'end'; timestamp: number }>
  isThinking?: boolean
  sessionId?: string
}

export interface ExecutionActions {
  runFlow: (params?: { params?: Record<string, any>; nodeId?: string }) => Promise<void>
  addExecutionLog: (log: Partial<ExecutionLog> & { content: string }) => void
  stopExecution: () => void
  clearExecutionLogs: () => void
  getExecutionLog: (nodeId: string) => ExecutionLog | undefined
}

export type ExecutionStore = ExecutionState & ExecutionActions

const initialExecutionState: ExecutionState = {
  isExecuting: false,
  executionLogs: [],
  currentRequestId: null,
  currentSessionId: null,
  sseConnection: null,
}

const createDebugInfoLog = ({
  content,
  sessionId,
  input,
  output,
  error,
}: {
  content: string
  sessionId?: string
  input?: any
  output?: any
  error?: string
}): ExecutionLog => ({
  id: `debug_info_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  nodeId: 'debug',
  nodeType: 'debug',
  nodeLabel: '调试日志',
  status: 'info',
  timestamp: Date.now(),
  duration: 0,
  content,
  input,
  output,
  error,
  sessionId,
})

export const createExecutionActions = (set: any, get: any): ExecutionStore => ({
  ...initialExecutionState,

  addExecutionLog: (log) => {
    set((state: any) => ({
      executionLogs: [
        ...state.executionLogs,
        {
          id: log.id || `manual_log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          nodeId: log.nodeId || 'debug',
          nodeType: log.nodeType || 'debug',
          nodeLabel: log.nodeLabel || '调试日志',
          status: log.status || 'info',
          timestamp: log.timestamp || Date.now(),
          duration: log.duration || 0,
          input: log.input,
          output: log.output,
          error: log.error,
          content: log.content,
          toolCalls: log.toolCalls || [],
          isThinking: log.isThinking || false,
          sessionId: log.sessionId,
        },
      ],
    }))
  },

  runFlow: async (options = {}) => {
    const { flowInfo, nodes, teamId } = get() as any
    if (!flowInfo?.label) {
      throw new Error('当前工作流缺少标签，无法调试运行')
    }

    if (flowInfo?.id) {
      try {
        await get().saveFlow()
      } catch (error) {
        throw new Error(error instanceof Error ? `调试前自动保存失败：${error.message}` : '调试前自动保存失败')
      }
    }

    const requestId = `req_${Date.now()}`
    const sessionId = `session_${Date.now()}`
    const startNode = nodes.find((n: any) => n.type === 'start')
    const startConfig = startNode?.data?.config || {}

    let params = options.params || {}
    if (!options.params && startConfig.devMode !== false) {
      const rawDevInput = startConfig.devInput?.trim?.() || '{}'
      try {
        params = JSON.parse(rawDevInput || '{}')
      } catch (error) {
        throw new Error(
          `开始节点调试输入不是合法 JSON${error instanceof Error && error.message ? `：${error.message}` : ''}`
        )
      }
    }

    set({
      isExecuting: true,
      currentRequestId: requestId,
      currentSessionId: sessionId,
      executionLogs: [
        {
          id: `flow_start_${Date.now()}`,
          nodeId: 'flow',
          nodeType: 'flow',
          nodeLabel: '流程执行',
          status: 'running',
          timestamp: Date.now(),
          duration: 0,
          input: params,
          content: '正在建立调试会话...',
          sessionId,
          toolCalls: [],
          isThinking: false,
        },
        createDebugInfoLog({
          sessionId,
          content: `调试请求已发出：label=${flowInfo.label}，requestId=${requestId}${options.nodeId ? `，nodeId=${options.nodeId}` : ''}`,
          input: {
            params,
            requestId,
            sessionId,
            label: flowInfo.label,
            flowId: flowInfo.id || null,
            teamId: teamId || null,
            projectId: (window as any).__AI_FLOW_RUNTIME__?.projectId || localStorage.getItem('workflow_projectId') || null,
            nodeId: options.nodeId || null,
          },
        }),
      ],
    })

    const startTimeout = window.setTimeout(() => {
      const state = get() as any
      if (!state.isExecuting) return
      const hasNodeLogs = (state.executionLogs || []).some((log: ExecutionLog) => log.nodeId !== 'flow')
      if (hasNodeLogs) return

      state.sseConnection?.close?.()
      set((current: any) => ({
        isExecuting: false,
        sseConnection: null,
        executionLogs: [
          ...current.executionLogs.map((log: ExecutionLog) =>
            log.nodeId === 'flow' && log.status === 'running'
              ? {
                  ...log,
                  status: 'error',
                  duration: Date.now() - log.timestamp,
                  error: '建立调试会话超时，请检查后端调试接口或 SSE 事件返回。',
                  content: '调试会话建立失败',
                }
              : log
          ),
          createDebugInfoLog({
            sessionId,
            content: '首包等待超时：后端已收到请求，但前端在等待 SSE 首个事件时超时',
            error: '建立调试会话超时，请检查后端调试接口或 SSE 事件返回。',
            output: {
              requestId,
              label: flowInfo.label,
              params,
            },
          }),
        ],
      }))
    }, 15000)

    const connection = runFlowWithSSE(
      {
        label: flowInfo.label,
        flowId: flowInfo.id,
        teamId,
        params,
        requestId,
        sessionId,
        nodeId: options.nodeId,
        stream: true,
      },
      {
        onOpen: ({ status, contentType, hasBody }) => {
          set((state: any) => ({
            executionLogs: [
              ...state.executionLogs,
              createDebugInfoLog({
                sessionId,
                content: 'SSE 连接已建立，已收到 HTTP 响应头',
                output: {
                  status,
                  contentType,
                  hasBody,
                },
              }),
            ],
          }))
        },

        onChunk: ({ chunkText, chunkSize }) => {
          set((state: any) => {
            const hasFirstChunkLog = state.executionLogs.some(
              (log: ExecutionLog) => log.nodeId === 'debug' && log.content?.includes('已收到首个 SSE 数据块')
            )
            if (hasFirstChunkLog) {
              return state
            }
            return {
              executionLogs: [
                ...state.executionLogs,
                createDebugInfoLog({
                  sessionId,
                  content: '已收到首个 SSE 数据块',
                  output: {
                    chunkSize,
                    preview: chunkText.slice(0, 300),
                  },
                }),
              ],
            }
          })
        },

        onNodeStart: (nodeId, nodeType) => {
          window.clearTimeout(startTimeout)
          const node = (get() as any).nodes.find((n: any) => n.id === nodeId)
          const existingOutput = (get() as any).nodeOutputs?.[nodeId]
          set((state: any) => ({
            executionLogs: [
              ...state.executionLogs,
              createDebugInfoLog({
                sessionId,
                content: `收到节点开始事件：${node?.data?.label || nodeId} (${nodeType})`,
                output: {
                  nodeId,
                  nodeType,
                  label: node?.data?.label || nodeId,
                },
              }),
              {
                id: `${nodeId}_${Date.now()}`,
                nodeId,
                nodeType,
                nodeLabel: node?.data?.label || nodeId,
                status: existingOutput ? 'success' : 'running',
                timestamp: Date.now(),
                duration: 0,
                input: params,
                output: existingOutput,
                sessionId,
                toolCalls: [],
                isThinking: false,
              },
            ],
            nodeExecutionStatus: {
              ...state.nodeExecutionStatus,
              [nodeId]: existingOutput ? 'success' : 'running',
            },
          }))
        },

        onNodeRunning: (nodeId) => {
          set((state: any) => ({
            nodeExecutionStatus: {
              ...state.nodeExecutionStatus,
              [nodeId]: 'running',
            },
          }))
        },

        onLlmStream: (nodeId, content, isThinking) => {
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
                isThinking,
              }
              return { executionLogs: newLogs }
            }
            return state
          })
        },

        onToolStart: (name, nodeId) => {
          set((state: any) => {
            const logs = state.executionLogs
            const lastLogIndex = logs.findIndex(
              (l: ExecutionLog) => l.nodeId === nodeId && l.status === 'running'
            )
            if (lastLogIndex >= 0) {
              const newLogs = [...logs]
              const toolCalls = [...(newLogs[lastLogIndex].toolCalls || []), { name, type: 'start' as const, timestamp: Date.now() }]
              newLogs[lastLogIndex] = {
                ...newLogs[lastLogIndex],
                toolCalls,
              }
              return { executionLogs: newLogs }
            }
            return state
          })
        },

        onToolEnd: (name, nodeId) => {
          set((state: any) => {
            const logs = state.executionLogs
            const lastLogIndex = logs.findIndex(
              (l: ExecutionLog) => l.nodeId === nodeId && l.status === 'running'
            )
            if (lastLogIndex >= 0) {
              const newLogs = [...logs]
              const toolCalls = [...(newLogs[lastLogIndex].toolCalls || []), { name, type: 'end' as const, timestamp: Date.now() }]
              newLogs[lastLogIndex] = {
                ...newLogs[lastLogIndex],
                toolCalls,
              }
              return { executionLogs: newLogs }
            }
            return state
          })
        },

        onNodeComplete: (nodeId, _nodeType, result) => {
          set((state: any) => {
            const logs = state.executionLogs
            const lastLogIndex = logs.findIndex(
              (l: ExecutionLog) => l.nodeId === nodeId && (l.status === 'running' || l.status === 'success')
            )
            const newLogs = [...logs]
            const node = (get() as any).nodes.find((n: any) => n.id === nodeId)
            if (lastLogIndex >= 0) {
              newLogs[lastLogIndex] = {
                ...newLogs[lastLogIndex],
                status: 'success',
                duration: Date.now() - newLogs[lastLogIndex].timestamp,
                input: result?.__nodeInput ?? newLogs[lastLogIndex].input,
                output: result,
              }
            } else {
              newLogs.push({
                id: `${nodeId}_${Date.now()}`,
                nodeId,
                nodeType: node?.type || _nodeType,
                nodeLabel: node?.data?.label || nodeId,
                status: 'success',
                timestamp: Date.now(),
                duration: 0,
                input: result?.__nodeInput ?? params,
                output: result,
                sessionId,
                toolCalls: [],
                isThinking: false,
              })
            }
            newLogs.push(
              createDebugInfoLog({
                sessionId,
                content: `收到节点完成事件：${node?.data?.label || nodeId}`,
                output: {
                  nodeId,
                  nodeType: node?.type || _nodeType,
                  result,
                },
              })
            )
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

        onNodeError: (nodeId, _nodeType, error) => {
          set((state: any) => {
            const logs = state.executionLogs
            const lastLogIndex = logs.findIndex(
              (l: ExecutionLog) => l.nodeId === nodeId && (l.status === 'running' || l.status === 'success')
            )
            const newLogs = [...logs]
            const node = (get() as any).nodes.find((n: any) => n.id === nodeId)
            if (lastLogIndex >= 0) {
              newLogs[lastLogIndex] = {
                ...newLogs[lastLogIndex],
                status: 'error',
                duration: Date.now() - newLogs[lastLogIndex].timestamp,
                error,
              }
            } else {
              newLogs.push({
                id: `${nodeId}_${Date.now()}`,
                nodeId,
                nodeType: node?.type || _nodeType,
                nodeLabel: node?.data?.label || nodeId,
                status: 'error',
                timestamp: Date.now(),
                duration: 0,
                input: params,
                error,
                sessionId,
                toolCalls: [],
                isThinking: false,
              })
            }
            newLogs.push(
              createDebugInfoLog({
                sessionId,
                content: `收到节点错误事件：${node?.data?.label || nodeId}`,
                error,
                output: {
                  nodeId,
                  nodeType: node?.type || _nodeType,
                },
              })
            )
            return {
              executionLogs: newLogs,
              nodeExecutionStatus: {
                ...state.nodeExecutionStatus,
                [nodeId]: 'error',
              },
            }
          })
        },

        onFlowComplete: (result) => {
          window.clearTimeout(startTimeout)
          set((state: any) => ({
            isExecuting: false,
            sseConnection: null,
            executionResult: result,
            executionLogs: state.executionLogs.flatMap((log: ExecutionLog) => {
              if (log.nodeId === 'flow' && log.status === 'running') {
                return [
                  {
                    ...log,
                    status: 'success',
                    duration: Date.now() - log.timestamp,
                    output: result,
                    content: log.content || '调试运行完成',
                  },
                  createDebugInfoLog({
                    sessionId,
                    content: '收到流程结束事件：success',
                    output: result,
                  }),
                ]
              }
              return [log]
            }),
          }))
        },

        onFlowError: (error) => {
          window.clearTimeout(startTimeout)
          console.error('Flow execution failed:', error)
          set((state: any) => ({
            isExecuting: false,
            sseConnection: null,
            executionLogs: state.executionLogs.flatMap((log: ExecutionLog) => {
              if (log.nodeId === 'flow' && log.status === 'running') {
                return [
                  {
                    ...log,
                    status: 'error',
                    duration: Date.now() - log.timestamp,
                    error,
                    content: log.content || '调试运行失败',
                  },
                  createDebugInfoLog({
                    sessionId,
                    content: '收到流程结束事件：error',
                    error,
                  }),
                ]
              }
              return [log]
            }),
          }))
        },

        onFlowCancel: () => {
          window.clearTimeout(startTimeout)
          set((state: any) => ({
            isExecuting: false,
            sseConnection: null,
            executionLogs: state.executionLogs.flatMap((log: ExecutionLog) => {
              if (log.nodeId === 'flow' && log.status === 'running') {
                return [
                  {
                    ...log,
                    status: 'error',
                    duration: Date.now() - log.timestamp,
                    error: '调试运行已取消',
                    content: '调试运行已停止',
                  },
                  createDebugInfoLog({
                    sessionId,
                    content: '收到流程结束事件：cancel',
                  }),
                ]
              }
              return [log]
            }),
          }))
        },

        onComplete: () => {
          window.clearTimeout(startTimeout)
          set((state: any) => {
            const targetNodeId = options.nodeId
            const hasAnyNodeLog = state.executionLogs.some((log: ExecutionLog) => log.nodeId !== 'flow')
            const targetNodeFinished = targetNodeId
              ? state.executionLogs.some(
                  (log: ExecutionLog) =>
                    log.nodeId === targetNodeId && (log.status === 'success' || log.status === 'error')
                )
              : false
            const successfulEndLog = state.executionLogs.find(
              (log: ExecutionLog) => log.nodeType === 'end' && log.status === 'success'
            )

            if (targetNodeFinished || (targetNodeId && hasAnyNodeLog)) {
              return {
                isExecuting: false,
                sseConnection: null,
                executionResult: targetNodeId ? state.nodeOutputs?.[targetNodeId] || state.executionResult : state.executionResult,
                executionLogs: state.executionLogs.map((log: ExecutionLog) =>
                  log.nodeId === 'flow' && log.status === 'running'
                    ? {
                        ...log,
                        status: 'success',
                        duration: Date.now() - log.timestamp,
                        output: targetNodeId ? state.nodeOutputs?.[targetNodeId] || state.executionResult : state.executionResult,
                        content: '单节点调试已完成',
                      }
                    : log
                ),
              }
            }

            if (successfulEndLog) {
              const finalResult = state.nodeOutputs?.[successfulEndLog.nodeId] || successfulEndLog.output || state.executionResult

              return {
                isExecuting: false,
                sseConnection: null,
                executionResult: finalResult,
                executionLogs: [
                  ...state.executionLogs.map((log: ExecutionLog) =>
                    log.nodeId === 'flow' && log.status === 'running'
                      ? {
                          ...log,
                          status: 'success',
                          duration: Date.now() - log.timestamp,
                          output: finalResult,
                          content: '调试连接已结束，已根据结束节点输出完成结果收敛',
                        }
                      : log
                  ),
                  createDebugInfoLog({
                    sessionId,
                    content: 'SSE 连接已关闭，但检测到结束节点已成功执行，已使用结束节点输出作为最终结果',
                    output: {
                      endNodeId: successfulEndLog.nodeId,
                      finalResult,
                    },
                  }),
                ],
              }
            }

            return {
              isExecuting: false,
              sseConnection: null,
              executionLogs: [
                ...state.executionLogs.map((log: ExecutionLog) =>
                  log.nodeId === 'flow' && log.status === 'running'
                    ? {
                        ...log,
                        status: 'error',
                        duration: Date.now() - log.timestamp,
                        error: '调试连接已结束，但未收到流程结束事件。',
                        content: '调试会话异常结束',
                      }
                    : log
                ),
                createDebugInfoLog({
                  sessionId,
                  content: 'SSE 连接已关闭，且未检测到 flow end 事件',
                  error: '调试连接已结束，但未收到流程结束事件。',
                  output: {
                    hasAnyNodeLog,
                    targetNodeId: targetNodeId || null,
                    targetNodeFinished,
                    successfulEndLog: successfulEndLog
                      ? {
                          nodeId: successfulEndLog.nodeId,
                          nodeLabel: successfulEndLog.nodeLabel,
                        }
                      : null,
                  },
                }),
              ],
            }
          })
        },

        onError: (error) => {
          window.clearTimeout(startTimeout)
          console.error('Flow execution error:', error)
          set((state: any) => ({
            isExecuting: false,
            sseConnection: null,
            executionLogs: state.executionLogs.map((log: ExecutionLog) =>
              log.nodeId === 'flow' && log.status === 'running'
                ? {
                    ...log,
                    status: 'error',
                    duration: Date.now() - log.timestamp,
                    error: error instanceof Error ? error.message : '调试运行异常',
                    content: '调试会话建立失败',
                  }
                : log
            ),
          }))
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
    set((state: any) => ({
      isExecuting: false,
      sseConnection: null,
      executionLogs: state.executionLogs.map((log: ExecutionLog) =>
        log.nodeId === 'flow' && log.status === 'running'
          ? {
              ...log,
              status: 'error',
              duration: Date.now() - log.timestamp,
              error: '用户已停止调试运行',
              content: '调试运行已停止',
            }
          : log
      ),
    }))
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

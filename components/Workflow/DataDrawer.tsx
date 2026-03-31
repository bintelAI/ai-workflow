import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useWorkflowStore, DEFAULT_DEV_INPUT } from './store/useWorkflowStore'
import { ValidationResult } from './ValidationReportModal'
import ValidationReportModal from './ValidationReportModal'
import { WorkflowNodeType } from './types'
import { validateWorkflow } from './validators/workflowValidator'
import { flowOpenApi, invokeOpenFlowWithSSE } from '@ai-flow/src/api/flow/open'
import request from '@ai-flow/src/api/request'
import { message } from '@ai-flow/components/common/AntdStaticFunction'
import {
  DataDrawerHeader,
  DataDrawerTimeline,
  DataDrawerRunInput,
  DataDrawerChat,
  DataDrawerInsights,
} from './data-drawer'

const DRAWER_HEIGHT_STORAGE_KEY = 'workflow_data_drawer_height'
const START_NODE_DEV_INPUT_STORAGE_KEY_PREFIX = 'workflow_start_dev_input'
const DEFAULT_DRAWER_HEIGHT = 400

export const DataDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    toggleDrawer,
    simulationLogs,
    runSimulation,
    setSelectedNode,
    nodes,
    edges,
    executionLogs,
    isExecuting,
    flowInfo,
    currentSessionId,
    runFlow,
    addExecutionLog,
    stopExecution,
    clearExecutionLogs,
  } = useWorkflowStore()
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'input' | 'chat' | 'ai'>('timeline')
  const [inputMode, setInputMode] = useState<'form' | 'json'>('form')
  const [chatInputMode, setChatInputMode] = useState<'form' | 'text'>('form')
  const [inputJson, setInputJson] = useState(DEFAULT_DEV_INPUT)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [chatQuery, setChatQuery] = useState('')
  const [historyMessages, setHistoryMessages] = useState<any[]>([])
  const [chatSending, setChatSending] = useState(false)
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({})
  const jsonSyncingRef = useRef(false)
  const formSyncingRef = useRef(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState(() => {
    const stored = localStorage.getItem(DRAWER_HEIGHT_STORAGE_KEY)
    const parsed = stored ? Number(stored) : DEFAULT_DRAWER_HEIGHT
    return Number.isFinite(parsed) && parsed >= 280 && parsed <= 800 ? parsed : DEFAULT_DRAWER_HEIGHT
  })
  const isResizingDrawerRef = useRef(false)

  const startNode = useMemo(() => nodes.find(n => n.type === WorkflowNodeType.START), [nodes])
  const startNodeVariables = useMemo(
    () => ((startNode?.data.config as any)?.variables || []) as any[],
    [startNode]
  )

  const startNodeStorageKey = useMemo(() => {
    const flowKey = flowInfo?.id || flowInfo?.label || 'default'
    return `${START_NODE_DEV_INPUT_STORAGE_KEY_PREFIX}_${flowKey}`
  }, [flowInfo?.id, flowInfo?.label])

  const summarizePayload = (value: any) => {
    if (value === undefined) return '无数据'
    if (value === null) return 'null'
    if (typeof value === 'string') {
      return value.length > 80 ? `${value.slice(0, 80)}...` : value
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '空数组'
      const firstItem = value[0]
      const firstPreview =
        typeof firstItem === 'object' ? JSON.stringify(firstItem).slice(0, 40) : String(firstItem)
      return `数组(${value.length}) · ${firstPreview}${value.length > 1 ? '...' : ''}`
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value)
      if (keys.length === 0) return '空对象'
      return `对象字段: ${keys.slice(0, 4).join('、')}${keys.length > 4 ? '...' : ''}`
    }
    return String(value)
  }

  const buildDiffSummary = (input: any, output: any, errorMessage?: string) => {
    if (errorMessage) {
      return [`执行异常：${summarizePayload(errorMessage)}`]
    }

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      if (!output || typeof output !== 'object' || Array.isArray(output)) {
        return [] as string[]
      }
      return [`输出新增 ${Object.keys(output).length} 个字段`] as string[]
    }

    if (!output || typeof output !== 'object' || Array.isArray(output)) {
      return ['输出不是对象结构']
    }

    const inputKeys = Object.keys(input)
    const outputKeys = Object.keys(output)
    const added = outputKeys.filter(key => !inputKeys.includes(key))
    const removed = inputKeys.filter(key => !outputKeys.includes(key))
    const changed = inputKeys.filter(
      key => outputKeys.includes(key) && JSON.stringify(input[key]) !== JSON.stringify(output[key])
    )

    const summary: string[] = []
    if (added.length > 0) summary.push(`新增字段：${added.slice(0, 3).join('、')}${added.length > 3 ? '...' : ''}`)
    if (removed.length > 0) summary.push(`缺失字段：${removed.slice(0, 3).join('、')}${removed.length > 3 ? '...' : ''}`)
    if (changed.length > 0) summary.push(`变更字段：${changed.slice(0, 3).join('、')}${changed.length > 3 ? '...' : ''}`)

    return summary
  }

  const buildDiffGroups = (input: any, output: any, errorMessage?: string) => {
    if (errorMessage) {
      return { notes: [`执行异常：${summarizePayload(errorMessage)}`] }
    }

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      if (!output || typeof output !== 'object' || Array.isArray(output)) {
        return { notes: [] as string[] }
      }
      return { notes: [`输出新增 ${Object.keys(output).length} 个字段`] }
    }

    if (!output || typeof output !== 'object' || Array.isArray(output)) {
      return { notes: ['输出不是对象结构'] }
    }

    const inputKeys = Object.keys(input)
    const outputKeys = Object.keys(output)
    return {
      added: outputKeys.filter(key => !inputKeys.includes(key)),
      removed: inputKeys.filter(key => !outputKeys.includes(key)),
      changed: inputKeys.filter(
        key => outputKeys.includes(key) && JSON.stringify(input[key]) !== JSON.stringify(output[key])
      ),
      notes: [] as string[],
    }
  }

  const nodeExecutionLogs = useMemo(
    () => executionLogs.filter(log => !['debug', 'flow'].includes(log.nodeType)),
    [executionLogs]
  )

  const hasExecutionLogs = nodeExecutionLogs.length > 0
  const hasFailure = nodeExecutionLogs.some(l => l.status === 'error') || simulationLogs.some(l => l.status === 'failed')
  const isStarting = isExecuting && nodeExecutionLogs.length === 0

  const timelineLogs = useMemo(() => {
    if (nodeExecutionLogs.length > 0) {
      return nodeExecutionLogs.map(log => ({
        id: log.id,
        nodeId: log.nodeId,
        nodeType: log.nodeType,
        nodeLabel: log.nodeLabel,
        status: log.status === 'error' ? 'failed' : log.status,
        timestampText: new Date(log.timestamp).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        duration: log.duration,
        input: log.input,
        output: log.output,
        errorMessage: log.error,
        content: log.content,
        toolCalls: log.toolCalls || [],
        sessionId: log.sessionId,
        isThinking: log.isThinking,
        inputSummary: summarizePayload(log.input),
        outputSummary: log.error ? `异常: ${summarizePayload(log.error)}` : summarizePayload(log.output?.__nodeInput ? { ...log.output, __nodeInput: undefined } : log.output),
        diffSummary: buildDiffSummary(log.input, log.output?.__nodeInput ? { ...log.output, __nodeInput: undefined } : log.output, log.error),
        diffGroups: buildDiffGroups(log.input, log.output?.__nodeInput ? { ...log.output, __nodeInput: undefined } : log.output, log.error),
      }))
    }

    return simulationLogs.map(log => ({
      id: log.stepId,
      nodeId: log.nodeId,
      nodeType: log.nodeType,
      nodeLabel: log.nodeLabel,
      status: log.status,
      timestampText: log.timestamp,
      duration: log.duration,
      input: log.input,
      output: log.output,
      errorMessage: log.errorMessage,
      content: undefined,
      toolCalls: [],
      sessionId: undefined,
      isThinking: false,
      inputSummary: summarizePayload(log.input),
      outputSummary: log.errorMessage ? `异常: ${summarizePayload(log.errorMessage)}` : summarizePayload(log.output),
      diffSummary: buildDiffSummary(log.input, log.output, log.errorMessage),
      diffGroups: buildDiffGroups(log.input, log.output, log.errorMessage),
    }))
  }, [nodeExecutionLogs, simulationLogs])

  const selectedLog = useMemo(
    () => timelineLogs.find(log => log.id === selectedLogId) || timelineLogs[0],
    [timelineLogs, selectedLogId]
  )

  const chatMessages = useMemo(() => {
    if (historyMessages.length > 0) {
      return historyMessages.map((item: any, index: number) => ({
        id: `history_${index}`,
        role: item?.role === 'assistant' ? 'assistant' : 'user',
        content:
          typeof item?.content === 'string'
            ? item.content
            : JSON.stringify(item?.content ?? '', null, 2),
      }))
    }

    return executionLogs
      .filter(log => log.content || log.output || log.error)
      .map(log => ({
        id: log.id,
        role: 'assistant' as const,
        content: log.error || log.content || JSON.stringify(log.output, null, 2),
      }))
  }, [historyMessages, executionLogs])

  useEffect(() => {
    localStorage.setItem(DRAWER_HEIGHT_STORAGE_KEY, String(drawerHeight))
  }, [drawerHeight])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingDrawerRef.current) return
      const nextHeight = window.innerHeight - event.clientY
      const clampedHeight = Math.min(800, Math.max(280, nextHeight))
      setDrawerHeight(clampedHeight)
    }

    const handleMouseUp = () => {
      isResizingDrawerRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleDrawerResizeStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    isResizingDrawerRef.current = true
  }, [])

  const handleDrawerResizeReset = useCallback(() => {
    setDrawerHeight(DEFAULT_DRAWER_HEIGHT)
  }, [])

  useEffect(() => {
    const startNode = nodes.find(n => n.type === WorkflowNodeType.START)
    const cachedDevInput = localStorage.getItem(startNodeStorageKey)
    const nodeDevInput = (startNode?.data.config as any)?.devInput
    const nextInput = cachedDevInput ?? nodeDevInput ?? DEFAULT_DEV_INPUT

    setInputJson(nextInput)
  }, [nodes, isDrawerOpen, startNodeStorageKey])

  useEffect(() => {
    if (!Array.isArray(startNodeVariables) || startNodeVariables.length === 0) {
      setFormValues({})
      return
    }

    setFormValues(prev => {
      const next: Record<string, any> = {}
      startNodeVariables.forEach((variable: any, index: number) => {
        const key = variable?.name || `var_${index + 1}`
        next[key] = prev[key] ?? variable?.defaultValue ?? ''
      })
      return next
    })
  }, [startNodeVariables])

  useEffect(() => {
    if (formSyncingRef.current || inputMode !== 'form') {
      formSyncingRef.current = false
      return
    }

    jsonSyncingRef.current = true
    try {
      setInputJson(JSON.stringify(formValues, null, 2))
    } catch {
      jsonSyncingRef.current = false
    }
  }, [formValues, inputMode])

  useEffect(() => {
    if (jsonSyncingRef.current || inputMode !== 'json') {
      jsonSyncingRef.current = false
      return
    }

    try {
      const parsed = JSON.parse(inputJson || '{}')
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        formSyncingRef.current = true
        setFormValues(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore invalid json while typing
    }
  }, [inputJson, inputMode])

  useEffect(() => {
    if (timelineLogs.length === 0) {
      return
    }

    const failedLog = timelineLogs.find(log => log.status === 'failed')
    if (failedLog) {
      setSelectedLogId(prev => (prev === failedLog.id ? prev : failedLog.id))
      return
    }

    setSelectedLogId(prev => {
      if (prev && timelineLogs.some(log => log.id === prev)) {
        return prev
      }
      return timelineLogs[timelineLogs.length - 1].id
    })
  }, [timelineLogs])

  useEffect(() => {
    if (timelineLogs.length > 0) {
      if (hasFailure) setActiveTab('ai')
      else if (hasExecutionLogs) setActiveTab('timeline')
    }
  }, [timelineLogs, hasFailure, hasExecutionLogs])

  useEffect(() => {
    if (!isDrawerOpen || !flowInfo?.label || !currentSessionId) {
      setHistoryMessages([])
      return
    }

    flowOpenApi
      .historyMsg(flowInfo.label, currentSessionId)
      .then(res => {
        setHistoryMessages(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        setHistoryMessages([])
      })
  }, [isDrawerOpen, flowInfo?.label, currentSessionId, executionLogs.length])


  const uploadDebugFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const res = (await request({
      url: '/app/base/comm/upload',
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })) as any

    return res?.data || ''
  }

  const handleFileUpload = async (key: string, file: File, isList: boolean) => {
    setUploadingFields(prev => ({ ...prev, [key]: true }))
    try {
      const url = await uploadDebugFile(file)
      if (!url) {
        throw new Error('上传失败，未返回文件地址')
      }
      setFormValues(prev => {
        const currentValue = prev[key]
        if (isList) {
          const list = Array.isArray(currentValue) ? currentValue : []
          return { ...prev, [key]: [...list, url] }
        }
        return { ...prev, [key]: url }
      })
      message.success('文件上传成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '文件上传失败')
    } finally {
      setUploadingFields(prev => ({ ...prev, [key]: false }))
    }
    return false
  }

  const buildRunParams = () => {
    if (inputMode === 'json' || startNodeVariables.length === 0) {
      return JSON.parse(inputJson || '{}')
    }

    const params: Record<string, any> = {}
    startNodeVariables.forEach((variable: any, index: number) => {
      const key = variable?.name || `var_${index + 1}`
      params[key] = formValues[key] ?? variable?.defaultValue ?? null
    })
    return params
  }

  const buildChatParams = (userText: string) => {
    if (chatInputMode === 'text' || startNodeVariables.length === 0) {
      return { content: userText }
    }

    const params: Record<string, any> = {}
    startNodeVariables.forEach((variable: any, index: number) => {
      const key = variable?.name || `var_${index + 1}`
      if (index === 0 && (formValues[key] === undefined || formValues[key] === '' || formValues[key] === null)) {
        params[key] = userText
      } else {
        params[key] = formValues[key] ?? variable?.defaultValue ?? null
      }
    })

    if (!('content' in params)) {
      params.content = userText
    }

    return params
  }

  const defaultFormValues = useMemo(() => {
    const next: Record<string, any> = {}
    startNodeVariables.forEach((variable: any, index: number) => {
      const key = variable?.name || `var_${index + 1}`
      next[key] = variable?.defaultValue ?? ''
    })
    return next
  }, [startNodeVariables])

  const changedFieldKeys = useMemo(() => {
    return Object.keys(formValues).filter(key => {
      const currentValue = formValues[key]
      const defaultValue = defaultFormValues[key]
      return JSON.stringify(currentValue ?? null) !== JSON.stringify(defaultValue ?? null)
    })
  }, [formValues, defaultFormValues])

  const selectedLogInputKeys = useMemo(() => {
    const input = selectedLog?.input
    if (!input || typeof input !== 'object' || Array.isArray(input)) return [] as string[]
    return Object.keys(input)
  }, [selectedLog])

  const timelineRelatedFieldKeys = useMemo(() => new Set(selectedLogInputKeys), [selectedLogInputKeys])

  const runPayloadPreview = useMemo(() => {
    try {
      return JSON.stringify(buildRunParams(), null, 2)
    } catch {
      return inputJson
    }
  }, [inputMode, inputJson, formValues, startNodeVariables])

  const chatPayloadPreview = useMemo(() => {
    try {
      return JSON.stringify(buildChatParams(chatQuery || '示例消息'), null, 2)
    } catch {
      return JSON.stringify({ content: chatQuery || '示例消息' }, null, 2)
    }
  }, [chatInputMode, chatQuery, formValues, startNodeVariables])

  const renderFilePreview = (value: any) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return null
      return (
        <div className="mt-2 space-y-1">
          {value.map((item, index) => (
            <div key={`${item}_${index}`} className="truncate rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
              {item}
            </div>
          ))}
        </div>
      )
    }

    if (!value) return null

    return (
      <div className="mt-2 truncate rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
        {String(value)}
      </div>
    )
  }

  const renderFormInput = (variable: any, index: number) => {
    const key = variable?.name || `var_${index + 1}`
    const value = formValues[key] ?? ''
    const type = variable?.type || 'text'
    const isChanged = changedFieldKeys.includes(key)
    const isRelatedToSelectedLog = timelineRelatedFieldKeys.has(key)
    const fieldWrapperClass = `rounded-lg border p-2 transition-colors ${isRelatedToSelectedLog ? 'border-indigo-300 bg-indigo-50/60' : isChanged ? 'border-amber-300 bg-amber-50/60' : 'border-transparent bg-transparent'}`

    if (type === 'number') {
      return (
        <div className={fieldWrapperClass}>
          <input
            type="number"
            value={value}
            onChange={e => setFormValues(prev => ({ ...prev, [key]: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={variable?.displayName || key}
          />
        </div>
      )
    }

    if (type === 'paragraph') {
      return (
        <div className={fieldWrapperClass}>
          <textarea
            value={value}
            onChange={e => setFormValues(prev => ({ ...prev, [key]: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder={variable?.displayName || key}
          />
        </div>
      )
    }

    if (type === 'checkbox') {
      return (
        <div className={fieldWrapperClass}>
          <button
            type="button"
            onClick={() => setFormValues(prev => ({ ...prev, [key]: !prev[key] }))}
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium transition-colors ${value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-600'}`}
          >
            {value ? '已开启' : '未开启'}
          </button>
        </div>
      )
    }

    if (type === 'dropdown') {
      const options = Array.isArray(variable?.options) ? variable.options : []
      return (
        <div className={fieldWrapperClass}>
          <select
            value={value}
            onChange={e => setFormValues(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">请选择</option>
            {options.map((option: any, optionIndex: number) => (
              <option key={`${key}_${optionIndex}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (type === 'file') {
      return (
        <div className={`${fieldWrapperClass} space-y-2`}>
          <input
            type="text"
            value={value}
            onChange={e => setFormValues(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="请输入文件 URL 或上传文件"
          />
          <label className="inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
            {uploadingFields[key] ? '上传中...' : '上传文件'}
            <input
              type="file"
              className="hidden"
              disabled={uploadingFields[key]}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleFileUpload(key, file, false)
                }
                e.currentTarget.value = ''
              }}
            />
          </label>
          {renderFilePreview(value)}
        </div>
      )
    }

    if (type === 'file_list') {
      return (
        <div className={`${fieldWrapperClass} space-y-2`}>
          <textarea
            value={Array.isArray(value) ? value.join('\n') : value}
            onChange={e => {
              const nextValue = e.target.value
                .split('\n')
                .map(item => item.trim())
                .filter(Boolean)
              setFormValues(prev => ({ ...prev, [key]: nextValue }))
            }}
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="每行一个文件 URL 或上传文件"
          />
          <label className="inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
            {uploadingFields[key] ? '上传中...' : '追加文件'}
            <input
              type="file"
              className="hidden"
              disabled={uploadingFields[key]}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleFileUpload(key, file, true)
                }
                e.currentTarget.value = ''
              }}
            />
          </label>
          {renderFilePreview(value)}
        </div>
      )
    }

    return (
      <div className={fieldWrapperClass}>
        <input
          type="text"
          value={value}
          onChange={e => setFormValues(prev => ({ ...prev, [key]: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={variable?.displayName || key}
        />
      </div>
    )
  }

  const saveAsDefaultDevInput = () => {
    if (!startNode) {
      message.warning('未找到开始节点，无法保存默认输入')
      return
    }

    try {
      const nextJson = inputMode === 'json' ? inputJson : JSON.stringify(buildRunParams(), null, 2)
      const nextNodes = nodes.map(node => {
        if (node.id !== startNode.id) return node
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...(node.data.config || {}),
              devInput: nextJson,
            },
          },
        }
      })

      useWorkflowStore.setState({ nodes: nextNodes as any })
      localStorage.setItem(startNodeStorageKey, nextJson)
      setInputJson(nextJson)
      message.success('已保存为开始节点默认调试输入')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存默认输入失败')
    }
  }

  const handleRun = async () => {
    setActiveTab('timeline')
    addExecutionLog({
      content: '前端已触发调试运行按钮，开始执行本地校验',
      nodeId: 'debug',
      nodeType: 'debug',
      nodeLabel: '前端调试日志',
      status: 'info',
      input: {
        flowLabel: flowInfo?.label || null,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    })

    const result = validateWorkflow(nodes, edges)
    if (!result.isValid) {
      addExecutionLog({
        content: '本地校验未通过，调试运行已在前端中止',
        nodeId: 'debug',
        nodeType: 'debug',
        nodeLabel: '前端调试日志',
        status: 'info',
        output: result.summary,
      })
      setValidationResult(result)
      setIsValidationModalOpen(true)
      return
    }

    try {
      addExecutionLog({
        content: '本地校验通过，开始构建调试输入参数',
        nodeId: 'debug',
        nodeType: 'debug',
        nodeLabel: '前端调试日志',
        status: 'info',
      })

      const params = buildRunParams()

      clearExecutionLogs()
      addExecutionLog({
        content: '调试输入参数构建完成，准备进入 runFlow',
        nodeId: 'debug',
        nodeType: 'debug',
        nodeLabel: '前端调试日志',
        status: 'info',
        input: params,
      })

      await runFlow({ params })
      if (activeTab === 'input' || activeTab === 'ai') setActiveTab('timeline')
    } catch (error) {
      addExecutionLog({
        content: '前端在调用 runFlow 前后捕获到异常',
        nodeId: 'debug',
        nodeType: 'debug',
        nodeLabel: '前端调试日志',
        status: 'error',
        error: error instanceof Error ? error.message : '调试运行失败',
      })
      setActiveTab('timeline')
      message.error(error instanceof Error ? error.message : '调试运行失败')
    }
  }

  const handleSimulationRun = () => {
    const result = validateWorkflow(nodes, edges)
    if (!result.isValid) {
      setValidationResult(result)
      setIsValidationModalOpen(true)
      return
    }
    runSimulation(inputJson)
    setActiveTab('timeline')
  }

  const renderChatVariableCard = (variable: any, index: number) => {
    const key = variable?.name || `var_${index + 1}`
    return (
      <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-slate-700">{variable?.displayName || key}</div>
            <div className="text-[10px] text-slate-400">{key} · {variable?.type || 'text'}</div>
          </div>
          {variable?.required && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-600 border border-rose-100">
              必填
            </span>
          )}
        </div>
        {renderFormInput(variable, index)}
      </div>
    )
  }

  const handleChatSend = async () => {
    if (!chatQuery.trim() || !flowInfo?.label || !currentSessionId) return

    const userText = chatQuery.trim()
    const params = buildChatParams(userText)

    setChatQuery('')
    setChatSending(true)
    setHistoryMessages(prev => [...prev, { role: 'user', content: userText }])

    try {
      await new Promise<void>((resolve, reject) => {
        let assistantContent = ''
        invokeOpenFlowWithSSE(
          {
            label: flowInfo.label,
            params,
            sessionId: currentSessionId,
            requestId: `drawer_chat_${Date.now()}`,
            stream: true,
          },
          {
            onLlmStream: (_nodeId, content) => {
              assistantContent += content || ''
              setHistoryMessages(prev => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: assistantContent }
                } else {
                  next.push({ role: 'assistant', content: assistantContent })
                }
                return next
              })
            },
            onFlowComplete: () => resolve(),
            onFlowError: error => reject(new Error(error)),
            onNodeError: (_nodeId, _nodeType, error) => reject(new Error(error)),
            onError: reject,
          }
        )
      })

      const refreshed = await flowOpenApi.historyMsg(flowInfo.label, currentSessionId)
      setHistoryMessages(Array.isArray(refreshed.data) ? refreshed.data : [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '继续调试失败')
    } finally {
      setChatSending(false)
    }
  }

  const handleCopy = async (value: any) => {
    try {
      await navigator.clipboard.writeText(
        typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      )
      message.success('已复制')
    } catch {
      message.error('复制失败')
    }
  }

  const handleViewNode = (nodeId: string) => {
    if (nodeId) {
      setSelectedNode(nodeId)
      setActiveTab('timeline')
      toggleDrawer(false)
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('workflow-open-node-config', { detail: { nodeId } }))
        window.dispatchEvent(new CustomEvent('workflow-focus-node', { detail: { nodeId } }))
      })
    }
  }

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out z-30 flex flex-col ${isDrawerOpen ? '' : 'h-0'}`}
      style={isDrawerOpen ? { height: `${drawerHeight}px` } : undefined}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-4 z-40 flex items-center justify-center ${isDrawerOpen ? 'cursor-row-resize' : 'pointer-events-none'}`}
        onMouseDown={handleDrawerResizeStart}
        onDoubleClick={handleDrawerResizeReset}
        title="拖动调整高度，双击恢复默认高度"
      >
        <div className={`flex items-center justify-center rounded-full border border-slate-200 bg-white/95 px-3 py-1 shadow-sm transition-colors ${isDrawerOpen ? 'hover:border-indigo-300 hover:bg-indigo-50' : ''}`}>
          <div className="flex gap-1">
            <span className="h-1 w-6 rounded-full bg-slate-300"></span>
            <span className="h-1 w-6 rounded-full bg-slate-300"></span>
          </div>
        </div>
      </div>
      <DataDrawerHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasFailure={hasFailure}
        failedCount={timelineLogs.filter(log => log.status === 'failed').length}
        isExecuting={isExecuting}
        onSimulationRun={handleSimulationRun}
        onRun={handleRun}
        onStop={stopExecution}
        onClose={() => toggleDrawer(false)}
      />

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'timeline' && (
          <DataDrawerTimeline
            timelineLogs={timelineLogs as any}
            selectedLog={selectedLog as any}
            selectedLogId={selectedLogId}
            setSelectedLogId={setSelectedLogId}
            isStarting={isStarting}
            onCopy={handleCopy}
          />
        )}

        {activeTab === 'chat' && (
          <DataDrawerChat
            currentSessionId={currentSessionId}
            flowLabel={flowInfo?.label}
            chatInputMode={chatInputMode}
            setChatInputMode={setChatInputMode}
            startNodeVariables={startNodeVariables}
            renderChatVariableCard={renderChatVariableCard}
            chatPayloadPreview={chatPayloadPreview}
            chatMessages={chatMessages as any}
            isStarting={isStarting}
            chatQuery={chatQuery}
            setChatQuery={setChatQuery}
            chatSending={chatSending}
            handleChatSend={handleChatSend}
          />
        )}

        {activeTab === 'input' && (
          <DataDrawerRunInput
            inputMode={inputMode}
            setInputMode={setInputMode}
            startNodeVariables={startNodeVariables}
            renderFormInput={renderFormInput}
            runPayloadPreview={runPayloadPreview}
            inputJson={inputJson}
            setInputJson={setInputJson}
            saveAsDefaultDevInput={saveAsDefaultDevInput}
          />
        )}

        {activeTab === 'ai' && (
          <DataDrawerInsights
            hasFailure={hasFailure}
            timelineLogs={timelineLogs as any}
            handleViewNode={handleViewNode}
          />
        )}
      </div>

      <ValidationReportModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        result={validationResult}
      />
    </div>
  )
}

const SparklesIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
)

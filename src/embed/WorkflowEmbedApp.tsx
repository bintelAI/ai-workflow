import React, { useEffect, useMemo, useRef, useState } from 'react'
import 'reactflow/dist/style.css'
import { WorkflowApp } from '@ai-flow/components/Workflow/WorkflowApp'
import { useWorkflowStore } from '@ai-flow/components/Workflow/store/useWorkflowStore'
import { setAiFlowRuntime } from '@ai-flow/utils/runtime'
import { importFromBackend } from '@ai-flow/components/Workflow/adapters/backendAdapter'
import type { FlowDraft } from '@ai-flow/src/types/flow'
import { Layers } from 'lucide-react'
import { getPluginMode, type WorkflowPluginModeType } from '@ai-flow/components/Workflow/config/pluginModeRegistry'

export interface WorkflowEmbedProps {
  workflowId?: number | string
  teamId?: string
  projectId?: string
  token?: string
  baseURL?: string
  type?: string
  mode?: 'default' | 'dev'
  readonly?: boolean
  previewDraft?: FlowDraft | null
}

let activeEmbedLease: symbol | null = null

export const importPreviewDraft = (previewDraft?: FlowDraft | null) =>
  previewDraft ? importFromBackend(previewDraft) : null

const WorkflowEmbedApp: React.FC<WorkflowEmbedProps> = ({
  workflowId,
  teamId,
  projectId,
  token,
  baseURL,
  type,
  mode = 'default',
  readonly = false,
  previewDraft,
}) => {
  const { loadFlow, isFlowLoading } = useWorkflowStore()
  const [error, setError] = useState<string | null>(null)
  const leaseId = useRef(Symbol('workflow-embed'))
  const [leaseState, setLeaseState] = useState<'pending' | 'granted' | 'denied'>('pending')

  useEffect(() => {
    if (activeEmbedLease && activeEmbedLease !== leaseId.current) {
      setLeaseState('denied')
      return
    }
    activeEmbedLease = leaseId.current
    setLeaseState('granted')
    return () => {
      if (activeEmbedLease === leaseId.current) {
        activeEmbedLease = null
      }
    }
  }, [])

  const resolvedPluginType = useMemo(() => {
    return getPluginMode(type || undefined).type as WorkflowPluginModeType
  }, [type])

  const previewGraph = useMemo(() => {
    return importPreviewDraft(previewDraft)
  }, [previewDraft])

  useEffect(() => {
    if (leaseState !== 'granted') return
    setAiFlowRuntime({
      id: workflowId,
      teamId,
      projectId,
      token,
      baseURL,
      type,
      mode,
    } as any)
  }, [leaseState, workflowId, teamId, projectId, token, baseURL, type, mode])

  const readonlyFromQuery = useMemo(() => {
    if (typeof window === 'undefined') return false
    const searchParams = new URLSearchParams(window.location.search)
    const value = searchParams.get('readonly')
    return value === '1' || value === 'true'
  }, [])

  const isReadonly = readonly || readonlyFromQuery

  useEffect(() => {
    if (leaseState !== 'granted') return
    let active = true
    if (previewGraph) {
      setError(null)
      return
    }

    const flowId = workflowId === undefined || workflowId === null ? '' : String(workflowId)
    if (!flowId) {
      setError(null)
      return
    }

    const id = parseInt(flowId, 10)
    if (isNaN(id)) {
      setError('无效的工作流ID')
      return
    }

    setError(null)
    loadFlow(id, teamId || undefined).catch((err) => {
      if (!active) return
      console.error('Failed to load flow:', err)
      setError('加载工作流失败，请检查ID是否正确')
    })
    return () => {
      active = false
    }
  }, [leaseState, previewGraph, workflowId, teamId, loadFlow])

  if (leaseState === 'denied') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-600">
        同一页面只能挂载一个工作流编辑器
      </div>
    )
  }

  if (leaseState === 'pending') {
    return <div className="h-full w-full bg-slate-50" />
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">加载失败</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  if (isFlowLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">正在加载工作流...</p>
        </div>
      </div>
    )
  }

  return (
    <WorkflowApp
      initialNodes={previewGraph?.nodes}
      initialEdges={previewGraph?.edges}
      initialSchemaVersion={previewGraph?.flowSchemaVersion}
      teamId={teamId}
      pluginType={resolvedPluginType}
      embedded
      mode={mode}
      readonly={isReadonly}
    />
  )
}

export default WorkflowEmbedApp

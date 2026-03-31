import React, { useEffect, useMemo, useState } from 'react'
import { WorkflowApp } from '@/components/Workflow/WorkflowApp'
import { useWorkflowStore } from '@/components/Workflow/store/useWorkflowStore'
import { Layers } from 'lucide-react'
import { resolveAiFlowRuntime } from '@/utils/runtime'
import { getPluginMode, type WorkflowPluginModeType } from '@/components/Workflow/config/pluginModeRegistry'

const App: React.FC = () => {
  const { loadFlow, isFlowLoading } = useWorkflowStore()
  const [error, setError] = useState<string | null>(null)
  const runtime = useMemo(() => resolveAiFlowRuntime(), [])
  const resolvedPluginType = getPluginMode(
    runtime.type || undefined
  ).type as WorkflowPluginModeType

  useEffect(() => {
    const flowId = runtime.id === undefined || runtime.id === null ? '' : String(runtime.id)
    const teamId = runtime.teamId || ''

    if (!flowId) {
      setError('缺少工作流ID')
      return
    }

    const id = parseInt(flowId, 10)
    if (isNaN(id)) {
      setError('无效的工作流ID')
      return
    }

    setError(null)
    loadFlow(id, teamId || undefined).catch((err) => {
      console.error('Failed to load flow:', err)
      setError('加载工作流失败，请检查ID是否正确')
    })
  }, [loadFlow, runtime.id, runtime.teamId])

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
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
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">正在加载工作流...</p>
        </div>
      </div>
    )
  }

  return <WorkflowApp pluginType={resolvedPluginType} />
}

export default App

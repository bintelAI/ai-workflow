import React, { useState, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { WorkflowCanvas, Sidebar, ConfigPanel, DataDrawer, AICommandCenter, SettingsModal } from '.'
import GlobalConfigModal from './GlobalConfigModal'
import { Layers, Share2, Settings, ShieldCheck, Eye, Database, Save, PlayCircle, StopCircle } from 'lucide-react'
import { useWorkflowStore } from './store/useWorkflowStore'
import ValidationReportModal, { ValidationResult } from './ValidationReportModal'
import { validateWorkflow } from './validators/workflowValidator'
import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from './types'
import { message } from '@ai-flow/components/common/AntdStaticFunction'
import { getRuntimeTeamId } from '@ai-flow/utils/runtime'
import { getPluginMode, type WorkflowPluginModeType } from './config/pluginModeRegistry'

interface WorkflowAppProps {
  initialNodes?: WorkflowNode[]
  initialEdges?: WorkflowEdge[]
  allowedNodeTypes?: WorkflowNodeType[]
  teamId?: string
  pluginType?: WorkflowPluginModeType
  embedded?: boolean
  mode?: 'default' | 'dev'
}

const App: React.FC<WorkflowAppProps> = ({
  initialNodes,
  initialEdges,
  allowedNodeTypes,
  teamId: propTeamId,
  pluginType = 'all',
  embedded = false,
  mode = 'default',
}) => {
  const {
    validateWorkflow: storeValidateWorkflow,
    toggleDrawer,
    runSimulation,
    toggleSettings,
    toggleGlobalConfig,
    categories,
    activeCategoryId,
    nodes,
    edges,
    setWorkflow,
    updateCategory,
    setActiveCategory,
    saveFlow,
    releaseFlow,
    runFlow,
    stopExecution,
    isExecuting,
    isFlowSaving,
    flowInfo,
    teamId: storeTeamId,
    setTeamId,
  } = useWorkflowStore()

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlTeamId = urlParams.get('teamId')
    const runtimeTeamId = getRuntimeTeamId()

    // 优先级: props > runtime > URL参数 > localStorage
    let finalTeamId = propTeamId

    if (!finalTeamId && runtimeTeamId) {
      finalTeamId = runtimeTeamId
    }

    if (!finalTeamId && urlTeamId) {
      finalTeamId = urlTeamId
    }
    
    if (!finalTeamId) {
      const storedTeamId = localStorage.getItem('workflow_teamId')
      if (storedTeamId) {
        finalTeamId = storedTeamId
      }
    }
    
    console.log('[WorkflowApp] Setting teamId:', finalTeamId, 'current storeTeamId:', storeTeamId)

    if (!finalTeamId) {
      return
    }

    // 始终更新 teamId（即使值相同），确保 store 和 localStorage 同步
    setTeamId(finalTeamId)
    localStorage.setItem('workflow_teamId', finalTeamId)
  }, [propTeamId, setTeamId, storeTeamId])

  useEffect(() => {
    if (initialNodes || initialEdges) {
      setWorkflow(
        initialNodes || [],
        initialEdges || []
      )
    }
  }, [initialNodes, initialEdges, setWorkflow])

  useEffect(() => {
    const mode = getPluginMode(pluginType)
    setActiveCategory(mode.categoryId)
    if (allowedNodeTypes && allowedNodeTypes.length > 0) {
      updateCategory(mode.categoryId, { allowedNodeTypes })
    }
  }, [pluginType, allowedNodeTypes, setActiveCategory, updateCategory])

  const activeCategoryName = categories.find(c => c.id === activeCategoryId)?.name || '未命名模式'

  const handleVerify = () => {
    const result = validateWorkflow(nodes, edges)
    setValidationResult(result)
    setIsValidationModalOpen(true)
  }

  const handleOpenDrawer = () => {
    toggleDrawer(true)
  }

  const handleSave = async () => {
    if (!flowInfo?.id) {
      message.warning('请先加载工作流')
      return
    }
    try {
      await saveFlow()
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleRelease = async () => {
    if (!flowInfo?.id) {
      message.warning('请先加载工作流')
      return
    }
    try {
      await saveFlow()
      await releaseFlow()
      message.success('发布成功')
    } catch (error) {
      message.error('发布失败')
    }
  }

  const handleRun = async () => {
    if (!flowInfo?.id) {
      message.warning('请先加载工作流')
      return
    }

    toggleDrawer(true)

    if (!flowInfo?.label) {
      message.warning('当前工作流缺少标签，无法调试运行')
      return
    }

    try {
      await runFlow()
    } catch (error) {
      console.error('Workflow run failed:', error)
      message.error(error instanceof Error ? error.message : '运行失败')
    }
  }

  const handleStop = () => {
    stopExecution()
    message.info('已停止执行')
  }

  return (
    <ReactFlowProvider>
      <div
        className="flex flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans"
        style={embedded ? { height: 'calc(100vh - 63px)', width: '100%' } : { height: '100vh', width: '100vw' }}
      >
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Layers size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                FlowMaster
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                  AI Pro
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">
                当前模式: {activeCategoryName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleGlobalConfig(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <Database size={16} /> 全局配置
            </button>
              {mode !== 'dev' && (
                <>
                  <button
                    onClick={() => toggleSettings(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <Settings size={16} /> 配置工作流
                  </button>
                </>
              )}
            <button
              onClick={handleVerify}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
            >
              <ShieldCheck size={16} /> 智能验证
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <button
              onClick={handleSave}
              disabled={isFlowSaving || !flowInfo?.id}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} className={isFlowSaving ? 'animate-pulse' : ''} />
              {isFlowSaving ? '保存中...' : '保存'}
            </button>
            {isExecuting ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
              >
                <StopCircle size={16} /> 停止运行
              </button>
            ) : (
              mode !== 'dev' && (
                <button
                  onClick={handleRun}
                  disabled={!flowInfo?.id}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayCircle size={16} /> 调试运行
                </button>
              )
            )}
            <button
              onClick={handleRelease}
              disabled={!flowInfo?.id}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 size={16} /> 发布流程
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar />

          <main className="flex-1 relative flex flex-col">
            <div className="flex-1 relative">
              <WorkflowCanvas />

              <AICommandCenter />

              <div className="absolute bottom-4 left-4 z-10">
                <button
                  onClick={handleOpenDrawer}
                  className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur border border-slate-200 text-slate-600 rounded-full shadow-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 group"
                >
                  <Eye size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  <span className="font-medium text-sm">监控数据流</span>
                </button>
              </div>
            </div>
          </main>

          <ConfigPanel />
          <DataDrawer />
          <SettingsModal />
          <GlobalConfigModal />
          <ValidationReportModal
            isOpen={isValidationModalOpen}
            onClose={() => setIsValidationModalOpen(false)}
            result={validationResult}
          />
        </div>
      </div>
    </ReactFlowProvider>
  )
}

export const WorkflowApp = App

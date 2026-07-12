import React, { useState, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { WorkflowCanvas, Sidebar, ConfigPanel, DataDrawer, AICommandCenter, SettingsModal } from '.'
import GlobalConfigModal from './GlobalConfigModal'
import { Layers, Share2, Settings, ShieldCheck, Eye, Database, Save, PlayCircle, StopCircle, History, RefreshCw } from 'lucide-react'
import { useWorkflowStore } from './store/useWorkflowStore'
import ValidationReportModal, { ValidationResult } from './ValidationReportModal'
import { validateWorkflow } from './validators/workflowValidator'
import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from './types'
import { message } from '@ai-flow/components/common/AntdStaticFunction'
import { getRuntimeProjectId, getRuntimeTeamId } from '@ai-flow/utils/runtime'
import {
  filterNewWorkflowNodeTypes,
  getPluginMode,
  type WorkflowPluginModeType,
} from './config/pluginModeRegistry'
import WorkflowHistoryDrawer from './WorkflowHistoryDrawer'

const PROJECT_TABLE_NODE_TYPES = [
  WorkflowNodeType.MUL_QUERY,
  WorkflowNodeType.MUL_UPDATE_ROW,
  WorkflowNodeType.MUL_DELETE_ROW,
]

interface WorkflowAppProps {
  initialNodes?: WorkflowNode[]
  initialEdges?: WorkflowEdge[]
  initialSchemaVersion?: 2 | null
  allowedNodeTypes?: WorkflowNodeType[]
  teamId?: string
  pluginType?: WorkflowPluginModeType
  embedded?: boolean
  mode?: 'default' | 'dev'
  readonly?: boolean
}

const App: React.FC<WorkflowAppProps> = ({
  initialNodes,
  initialEdges,
  initialSchemaVersion,
  allowedNodeTypes,
  teamId: propTeamId,
  pluginType = 'all',
  embedded = false,
  mode = 'default',
  readonly = false,
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
    replaceWithPreview,
    updateCategory,
    setActiveCategory,
    saveFlow,
    upgradeLegacyFlow,
    releaseFlow,
    runFlow,
    stopExecution,
    isExecuting,
    isFlowSaving,
    flowInfo,
    teamId: storeTeamId,
    setTeamId,
    flowSchemaVersion,
  } = useWorkflowStore()

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)

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
      replaceWithPreview(
        initialNodes || [],
        initialEdges || [],
        initialSchemaVersion === 2 ? 2 : null
      )
    }
  }, [initialNodes, initialEdges, initialSchemaVersion, replaceWithPreview])

  useEffect(() => {
    const mode = getPluginMode(pluginType)
    setActiveCategory(mode.categoryId)
    const nextAllowedNodeTypes = allowedNodeTypes && allowedNodeTypes.length > 0
      ? filterNewWorkflowNodeTypes(Array.from(new Set([...allowedNodeTypes, ...PROJECT_TABLE_NODE_TYPES])), mode.type)
      : filterNewWorkflowNodeTypes(mode.allowedNodeTypes, mode.type)
    updateCategory(mode.categoryId, {
      allowedNodeTypes: nextAllowedNodeTypes,
      isSystem: true,
      layoutDirection: mode.layoutDirection,
    })
  }, [pluginType, allowedNodeTypes, setActiveCategory, updateCategory])

  const isApprovalMode = pluginType === 'approval'
  const isAiMode = pluginType === 'ai'
  const isAutomationMode = pluginType === 'automation'
  const activeCategoryName = categories.find(c => c.id === activeCategoryId)?.name || '未命名模式'
  const appTitle = isApprovalMode ? '审批工作流' : isAutomationMode ? '自动化工作流' : isAiMode ? 'AI 工作流' : '维表智联工作流'
  const appBadge = isApprovalMode ? 'Approval' : isAutomationMode ? 'Automation' : isAiMode ? 'AI 模式' : 'AI Pro'
  const globalConfigLabel = isApprovalMode ? '审批配置' : '全局配置'
  const monitorButtonLabel = isApprovalMode ? '查看审批数据' : '监控数据流'
  const runtimeTeamIdForConfig = storeTeamId || propTeamId || getRuntimeTeamId()
  const runtimeProjectIdForConfig = getRuntimeProjectId()
  const effectiveReadonly = readonly || flowSchemaVersion !== 2
  const canUpgradeLegacyFlow = !readonly && flowSchemaVersion !== 2 && !!flowInfo?.id

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

  const handleUpgradeLegacyFlow = async () => {
    try {
      await upgradeLegacyFlow()
      message.success('工作流已升级为 V2，可以继续编辑')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '工作流升级失败')
    }
  }

  const handleReloadFlow = async () => {
    if (!flowInfo?.id) return
    try {
      await useWorkflowStore.getState().loadFlow(flowInfo.id, storeTeamId || undefined)
    } catch (error) {
      console.error('Failed to reload flow after history operation:', error)
    }
  }

  const handleRelease = async () => {
    if (!flowInfo?.id) {
      message.warning('请先加载工作流')
      return
    }
    try {
      await saveFlow()
      await releaseFlow(pluginType)
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
        {!effectiveReadonly && (
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Layers size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                  {appTitle}
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                    {appBadge}
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
                <Database size={16} /> {globalConfigLabel}
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
                onClick={() => setIsHistoryDrawerOpen(true)}
                disabled={!flowInfo?.id}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <History size={16} /> 历史
              </button>
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
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {!effectiveReadonly && <Sidebar pluginType={pluginType} />}

          <main className="flex-1 relative flex flex-col">
            {canUpgradeLegacyFlow && (
              <div className="h-12 shrink-0 border-b border-amber-200 bg-amber-50 px-4 flex items-center justify-between gap-4">
                <span className="text-sm text-amber-800">当前工作流为旧版格式，升级前保持只读。</span>
                <button
                  type="button"
                  onClick={handleUpgradeLegacyFlow}
                  disabled={isFlowSaving}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-900 bg-white border border-amber-300 rounded-md hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={16} className={isFlowSaving ? 'animate-spin' : ''} />
                  {isFlowSaving ? '升级中...' : '升级为 V2 后编辑'}
                </button>
              </div>
            )}
            <div className="flex-1 relative">
              <WorkflowCanvas readonly={effectiveReadonly} />

              {!effectiveReadonly && isAiMode && <AICommandCenter />}

              {!effectiveReadonly && (
                <div className="absolute bottom-4 left-4 z-10">
                  <button
                    onClick={handleOpenDrawer}
                    className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur border border-slate-200 text-slate-600 rounded-full shadow-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 group"
                  >
                    <Eye size={16} className="text-slate-400 group-hover:text-indigo-500" />
                    <span className="font-medium text-sm">{monitorButtonLabel}</span>
                  </button>
                </div>
              )}
            </div>
          </main>

          {!effectiveReadonly && (
            <ConfigPanel
              pluginType={pluginType}
              teamId={runtimeTeamIdForConfig}
              projectId={runtimeProjectIdForConfig}
            />
          )}
          {!effectiveReadonly && <DataDrawer />}
          {!effectiveReadonly && <SettingsModal />}
          {!effectiveReadonly && <GlobalConfigModal />}
          {!effectiveReadonly && (
            <ValidationReportModal
              isOpen={isValidationModalOpen}
              onClose={() => setIsValidationModalOpen(false)}
              result={validationResult}
            />
          )}
          {!effectiveReadonly && (
            <WorkflowHistoryDrawer
              open={isHistoryDrawerOpen}
              flowInfo={flowInfo}
              teamId={storeTeamId}
              onClose={() => setIsHistoryDrawerOpen(false)}
              onRollbackSuccess={handleReloadFlow}
            />
          )}
        </div>
      </div>
    </ReactFlowProvider>
  )
}

export const WorkflowApp = App

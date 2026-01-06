import React, { useState, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { WorkflowCanvas, Sidebar, ConfigPanel, DataDrawer, AICommandCenter, SettingsModal } from '.'
import GlobalConfigModal from './GlobalConfigModal'
import { Layers, Share2, Settings, ShieldCheck, Eye, Database } from 'lucide-react'
import { useWorkflowStore } from './store/useWorkflowStore'
import ValidationReportModal, { ValidationResult } from './ValidationReportModal'
import { validateWorkflow } from './validators/workflowValidator'
import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from './types'

interface WorkflowAppProps {
  initialNodes?: WorkflowNode[]
  initialEdges?: WorkflowEdge[]
  allowedNodeTypes?: WorkflowNodeType[]
}

const App: React.FC<WorkflowAppProps> = ({ 
  initialNodes, 
  initialEdges,
  allowedNodeTypes 
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
  } = useWorkflowStore()

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false)

  // 初始化节点和连线
  useEffect(() => {
    if (initialNodes || initialEdges) {
      setWorkflow(
        initialNodes || [],
        initialEdges || []
      )
    }
  }, [initialNodes, initialEdges, setWorkflow])

  // 初始化允许使用的节点类型
  useEffect(() => {
    if (allowedNodeTypes && allowedNodeTypes.length > 0) {
      // 更新当前激活模式的允许节点类型，或者更新 'general' 模式
      updateCategory('general', { allowedNodeTypes })
    }
  }, [allowedNodeTypes, updateCategory])

  const activeCategoryName = categories.find(c => c.id === activeCategoryId)?.name || '未命名模式'

  const handleVerify = () => {
    const result = validateWorkflow(nodes, edges)
    setValidationResult(result)
    setIsValidationModalOpen(true)
  }

  const handleOpenDrawer = () => {
    toggleDrawer(true)
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans">
        {/* Header */}
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
            <button
              onClick={() => toggleSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <Settings size={16} /> 配置工作流
            </button>
            <button
              onClick={handleVerify}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
            >
              <ShieldCheck size={16} /> 智能验证
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm shadow-indigo-200 transition-colors">
              <Share2 size={16} /> 发布流程
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar />

          <main className="flex-1 relative flex flex-col">
            <div className="flex-1 relative">
              <WorkflowCanvas />

              {/* AI Command Center (Floating) */}
              <AICommandCenter />

              {/* Bottom Monitor Trigger (moved slightly down/styled to avoid collision) */}
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

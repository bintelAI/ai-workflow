import React from 'react'
import { X, Settings } from 'lucide-react'
import { useWorkflowStore } from './store/useWorkflowStore'
import { VariableConfigEditor } from './configs/common/VariableConfigEditor'

const GlobalConfigModal: React.FC = () => {
  const { isGlobalConfigOpen, toggleGlobalConfig, globalVariables, setGlobalVariables } = useWorkflowStore()

  if (!isGlobalConfigOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[80vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Settings size={18} className="text-indigo-600" />
              全局变量配置
            </h3>
            <p className="text-xs text-slate-500 mt-1">配置全局变量，供所有节点使用</p>
          </div>
          <button
            onClick={() => toggleGlobalConfig(false)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              全局变量是可以在整个工作流中使用的变量，所有节点都可以通过变量绑定功能选择使用这些变量。
            </p>
          </div>

          <VariableConfigEditor
            variables={globalVariables}
            onVariablesChange={setGlobalVariables}
          />
        </div>
      </div>
    </div>
  )
}

export default GlobalConfigModal

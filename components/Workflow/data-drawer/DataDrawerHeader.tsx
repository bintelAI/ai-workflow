import React from 'react'
import {
  X,
  Activity,
  PlayCircle,
  StopCircle,
  RotateCcw,
  MessageSquare,
  SlidersHorizontal,
  Braces,
} from 'lucide-react'

interface DataDrawerHeaderProps {
  activeTab: 'timeline' | 'input' | 'chat' | 'ai'
  setActiveTab: (tab: 'timeline' | 'input' | 'chat' | 'ai') => void
  hasFailure: boolean
  failedCount: number
  isExecuting: boolean
  onSimulationRun: () => void
  onRun: () => void
  onStop: () => void
  onClose: () => void
}

export const DataDrawerHeader: React.FC<DataDrawerHeaderProps> = ({
  activeTab,
  setActiveTab,
  hasFailure,
  failedCount,
  isExecuting,
  onSimulationRun,
  onRun,
  onStop,
  onClose,
}) => {
  return (
    <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Activity className="text-indigo-600 w-5 h-5" />
          <h3 className="font-semibold text-slate-800">流程透视镜</h3>
        </div>

        <div className="flex bg-slate-200/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'timeline' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            调试时间线
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'input' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            运行输入
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'chat' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <MessageSquare size={12} /> 会话调试
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'ai' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <SparklesIcon /> AI 洞察
            {hasFailure && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">{failedCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSimulationRun}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          <RotateCcw size={14} /> 模拟运行
        </button>
        {isExecuting ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm transition-colors"
          >
            <StopCircle size={14} /> 停止运行
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
          >
            <PlayCircle size={14} /> 调试运行
          </button>
        )}
        <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 ml-2">
          <X size={18} />
        </button>
      </div>
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

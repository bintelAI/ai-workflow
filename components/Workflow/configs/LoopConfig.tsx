import React from 'react'
import {
  Repeat,
  ArrowRightFromLine,
  LogOut,
  StopCircle,
  Layers,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { VariableSelector } from './common'
import { ConditionBuilder } from './ConditionBuilder'

interface LoopConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
}

export const LoopConfig: React.FC<LoopConfigProps> = ({ config, onConfigChange }) => {
  const mode = config?.mode || 'loop'
  const concurrency = config?.concurrency ?? 10

  const handleModeChange = (newMode: 'iteration' | 'loop') => {
    onConfigChange('mode', newMode)
    // Reset or set defaults when mode changes
    if (newMode === 'iteration') {
      if (config?.concurrency === undefined) {
        onConfigChange('concurrency', 10)
      }
    }
  }

  const handleConcurrencyChange = (val: string) => {
    let num = parseInt(val)
    if (isNaN(num)) num = 1
    if (num < 1) num = 1
    if (num > 100) num = 100
    onConfigChange('concurrency', num)
  }

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start gap-3">
        <div className="bg-white p-2 rounded-md border border-indigo-200 shadow-sm">
          <Repeat className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-900">循环迭代 (Loop & Iterator)</h4>
          <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
            遍历数组并执行内部节点。支持顺序循环模式和并发迭代模式。
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
          <Zap size={12} className="text-amber-500" /> 执行模式
        </label>
        <div className="flex p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => handleModeChange('iteration')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'iteration'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers size={14} />
            迭代模式 (并发)
          </button>
          <button
            onClick={() => handleModeChange('loop')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'loop'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <RefreshCw size={14} />
            循环模式 (顺序)
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 px-1">
          {mode === 'iteration'
            ? '迭代模式：支持并发执行，无终止条件，持续处理直到数组结束或手动停止。'
            : '循环模式：按顺序逐个执行，支持配置复杂的终止条件。'}
        </p>
      </div>

      {/* Input Configuration */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
          <ArrowRightFromLine size={12} className="text-indigo-500" /> 输入：目标数组
        </label>
        <VariableSelector
          value={config?.targetArray || ''}
          onChange={val => onConfigChange('targetArray', val)}
          placeholder="选择要遍历的数组 (e.g. payload.items)"
        />
      </div>

      {mode === 'iteration' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
            <Layers size={12} className="text-indigo-500" /> 并发控制 (1-100)
          </label>
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <input
              type="range"
              min="1"
              max="100"
              value={concurrency}
              onChange={e => handleConcurrencyChange(e.target.value)}
              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="w-12 text-center py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-indigo-600">
              {concurrency}
            </div>
          </div>
        </div>
      )}

      {mode === 'loop' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
            <StopCircle size={12} className="text-rose-500" /> 终止条件
          </label>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
            <p className="text-[10px] text-slate-500 mb-2">
              配置循环终止的条件。当满足条件时，循环将立即停止并返回当前已处理的结果。
            </p>
            <ConditionBuilder
              conditionGroups={config?.terminationConditions || []}
              onChange={groups => onConfigChange('terminationConditions', groups)}
              scope="all"
            />
          </div>
        </div>
      )}

      <div className="h-px bg-slate-100"></div>

      {/* Output Configuration */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
          <LogOut size={12} className="text-emerald-500" /> 输出：结果聚合
        </label>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-[10px] text-slate-500 mb-2">
            选择循环内部的变量作为单次迭代的输出结果。节点执行结束后将返回一个包含所有结果的数组。
          </p>
          <VariableSelector
            value={config?.exportOutput || ''}
            onChange={val => onConfigChange('exportOutput', val)}
            placeholder="选择内部输出变量..."
            scope="internal"
          />
        </div>
      </div>
    </div>
  )
}

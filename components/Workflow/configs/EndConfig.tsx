import React, { useCallback } from 'react'
import { StopCircle, LogOut, Plus, Trash2 } from 'lucide-react'
import { VariableSelector } from './common/index'
import type { FlowField } from '@ai-flow/src/types/flow'

interface EndConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
  variables?: Array<{
    id: string
    type?: string
    label?: string
    params: FlowField[]
    variables?: any[]
  }>
}

export const EndConfig: React.FC<EndConfigProps> = ({ config, onConfigChange, variables = [] }) => {
  const outputs: Array<{ key: string; value: string; template?: string; refPath?: string; nodeId?: string; nodeType?: string; name?: string }> = config?.outputs || []

  const updateOutputs = useCallback(
    (next: Array<{ key: string; value: string; template?: string; refPath?: string; nodeId?: string; nodeType?: string; name?: string }>) => {
      onConfigChange('outputs', next)
    },
    [onConfigChange]
  )

  const handleAdd = () => {
    updateOutputs([...outputs, { key: '', value: '' }])
  }

  const handleRemove = (index: number) => {
    const next = [...outputs]
    next.splice(index, 1)
    updateOutputs(next)
  }

  const handleChange = (index: number, patch: Partial<{ key: string; value: string; template?: string; refPath?: string; nodeId?: string; nodeType?: string; name?: string }>) => {
    const next = [...outputs]
    next[index] = { ...next[index], ...patch }
    updateOutputs(next)
  }

  return (
    <div className="space-y-4">
      <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 mb-2 flex items-start gap-2">
        <StopCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-rose-800">结束节点 (End)</h4>
          <p className="text-[10px] text-rose-600 mt-1">
            定义工作流最终返回的数据结构。若为空，则默认返回最后执行节点的输出。
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <LogOut size={12} className="text-rose-500" /> 输出变量配置
          </label>
          <button
            onClick={handleAdd}
            className="px-2 py-1 text-xs rounded border border-dashed border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
          >
            <Plus size={12} /> 添加输出字段
          </button>
        </div>

        {outputs.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded border border-dashed border-slate-200">
            暂无输出映射
          </div>
        )}

        {outputs.map((item, index) => (
          <div key={index} className="grid min-w-0 grid-cols-[minmax(96px,140px)_minmax(0,1fr)_32px] gap-2 items-center">
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-white"
              placeholder="输出字段名"
              value={item.key}
              onChange={e => handleChange(index, { key: e.target.value })}
            />
            <VariableSelector
              field={item.name || ''}
              nodeId={item.nodeId || ''}
              nodeType={item.nodeType || ''}
              customValue={item.nodeId ? '' : item.value}
              value={item.template || item.value || ''}
              variables={variables}
              inputable
              onChange={data =>
                handleChange(index, {
                  value: data.value,
                  template: data.template,
                  refPath: data.refPath,
                  nodeId: data.nodeId,
                  nodeType: data.nodeType,
                  name: data.name,
                })
              }
              onClear={() =>
                handleChange(index, {
                  value: '',
                  template: '',
                  refPath: '',
                  nodeId: '',
                  nodeType: '',
                  name: '',
                })
              }
              placeholder="映射变量或输入固定值"
            />
            <button
              onClick={() => handleRemove(index)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

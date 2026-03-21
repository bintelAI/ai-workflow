import React from 'react'
import { FileJson, SlidersHorizontal, Braces } from 'lucide-react'

interface DataDrawerRunInputProps {
  inputMode: 'form' | 'json'
  setInputMode: (mode: 'form' | 'json') => void
  startNodeVariables: any[]
  renderFormInput: (variable: any, index: number) => React.ReactNode
  runPayloadPreview: string
  inputJson: string
  setInputJson: (value: string) => void
  saveAsDefaultDevInput: () => void
}

export const DataDrawerRunInput: React.FC<DataDrawerRunInputProps> = ({
  inputMode,
  setInputMode,
  startNodeVariables,
  renderFormInput,
  runPayloadPreview,
  inputJson,
  setInputJson,
  saveAsDefaultDevInput,
}) => {
  return (
    <div className="flex-1 flex gap-4 p-4 bg-slate-50 overflow-hidden">
      <div className="w-72 shrink-0 pt-2 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <FileJson size={16} className="text-indigo-500" /> 运行输入
          </h4>
          <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
            <p>支持两种测试方式：可视化表单填写，或直接编辑 JSON。</p>
            <p>点击式填写更适合快速测试，JSON 模式更适合复杂 payload。</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 text-[11px] font-semibold text-slate-600">输入模式</div>
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setInputMode('form')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${inputMode === 'form' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="inline-flex items-center gap-1">
                <SlidersHorizontal size={12} /> 可视化
              </span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('json')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${inputMode === 'json' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="inline-flex items-center gap-1">
                <Braces size={12} /> JSON
              </span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded text-[10px] text-slate-400">
          提示: 当前输入仅作用于本次调试运行，不会自动覆盖开始节点默认调试输入。
        </div>

        <button
          type="button"
          onClick={saveAsDefaultDevInput}
          className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
        >
          保存为开始节点默认调试输入
        </button>
      </div>

      <div className="flex-1 h-full overflow-hidden">
        {inputMode === 'form' ? (
          <div className="grid h-full grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="h-full overflow-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              {startNodeVariables.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  当前开始节点未配置变量，请切换到 JSON 模式输入测试数据。
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {startNodeVariables.map((variable: any, index: number) => {
                    const key = variable?.name || `var_${index + 1}`
                    return (
                      <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-semibold text-slate-700">
                              {variable?.displayName || key}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {key} · {variable?.type || 'text'}
                            </div>
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
                  })}
                </div>
              )}
            </div>
            <div className="h-full overflow-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 text-xs font-semibold text-slate-600">最终 Payload 预览</div>
              <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-words">
                {runPayloadPreview}
              </pre>
            </div>
          </div>
        ) : (
          <textarea
            className="w-full h-full bg-white border border-slate-300 rounded-lg p-4 text-xs font-mono text-slate-700 resize-none focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            value={inputJson}
            onChange={e => setInputJson(e.target.value)}
            spellCheck={false}
            placeholder="{ ... }"
          />
        )}
      </div>
    </div>
  )
}

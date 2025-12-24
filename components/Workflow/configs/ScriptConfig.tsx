import React from 'react'
import { TerminalSquare, ArrowRightFromLine } from 'lucide-react'
import { KeyValueEditor } from './common'
import { AIButton } from './common'

interface ScriptConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
  loadingField: string | null
  onAIGenerate: (field: string, isConfig: boolean) => void
}

export const ScriptConfig: React.FC<ScriptConfigProps> = ({
  config,
  onConfigChange,
  loadingField,
  onAIGenerate,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
            运行环境
          </label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            value={config?.language || 'javascript'}
            onChange={e => onConfigChange('language', e.target.value)}
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
            输出字段名
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            placeholder="result"
            value={config?.outputField || 'result'}
            onChange={e => onConfigChange('outputField', e.target.value)}
          />
        </div>
      </div>

      {/* Input Variables (Dify Style) */}
      <KeyValueEditor
        title="输入变量 (Input Args)"
        description="将外部变量映射为脚本入参，代码中通过 inputs.key 调用"
        keyPlaceholder="参数名 (e.g. arg1)"
        items={config?.inputVariables || []}
        onChange={items => onConfigChange('inputVariables', items)}
        icon={ArrowRightFromLine}
      />

      <div className="flex-1 flex flex-col min-h-[200px]">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
            <TerminalSquare size={12} className="text-indigo-500" />
            代码逻辑
          </label>
          <AIButton field="code" isConfig loadingField={loadingField} onGenerate={onAIGenerate} />
        </div>
        <textarea
          className="w-full flex-1 px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-slate-900 text-slate-50 resize-y"
          placeholder="// Access inputs via `inputs.argName`"
          value={config?.code || ''}
          onChange={e => onConfigChange('code', e.target.value)}
          rows={10}
        />
      </div>
    </div>
  )
}

import React from 'react'
import { Bug } from 'lucide-react'
import { VariableConfigEditor } from './common/VariableConfigEditor'

interface StartConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
}

export const StartConfig: React.FC<StartConfigProps> = ({ config, onConfigChange }) => {
  return (
    <>
      <div className="pt-4 mt-4 border-t border-slate-100">
        <VariableConfigEditor
          variables={config?.variables || []}
          onVariablesChange={(variables) => onConfigChange('variables', variables)}
        />
      </div>
      <div className="pt-4 mt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Bug size={14} className="text-indigo-500" />
            模拟数据 (Dev Data)
          </label>
          <div
            onClick={() => onConfigChange('devMode', !config?.devMode)}
            className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${config?.devMode !== false ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config?.devMode !== false ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </div>
        </div>
        {config?.devMode !== false && (
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-slate-900 text-emerald-400 resize-y min-h-[150px]"
            value={
              config?.devInput ||
              '{"order_id": "ORD-2024-001", "amount": 8500, "currency": "CNY", "requester": {"id": "U-8821", "name": "Alex Chen", "department": "Engineering"}, "items": [{"name": "Server License", "price": 4000}, {"name": "Cloud Credits", "price": 4500}]}'
            }
            onChange={e => onConfigChange('devInput', e.target.value)}
          />
        )}
      </div>
    </>
  )
}

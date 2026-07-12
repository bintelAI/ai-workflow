import React from 'react'
import { AlertCircle, LockKeyhole } from 'lucide-react'

export interface SQLConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
}

export const SQLConfig: React.FC<SQLConfigProps> = ({ config }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span>
          通用 SQL 节点是历史占位节点，后端没有对应执行器，已不允许新建或继续配置。维表多表查询请使用“查询项目表”节点的多表 queryPlan 模式。
        </span>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <LockKeyhole size={13} className="text-slate-500" />
          历史 SQL 配置只读
        </div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-600">
          {config.sql || '当前历史节点没有保存 SQL 内容。'}
        </pre>
      </div>
    </div>
  )
}

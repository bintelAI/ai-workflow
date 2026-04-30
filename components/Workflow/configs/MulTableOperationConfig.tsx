import React from 'react'
import { AlertCircle, Database, FileText, ListFilter, Rows3, Trash2 } from 'lucide-react'

import { WorkflowNodeType } from '../types'
import { VariableInput } from './common/index'

interface MulTableOperationConfigProps {
  nodeType: WorkflowNodeType
  config: Record<string, any>
  onConfigChange: (key: string, value: any) => void
}

const OPERATION_META = {
  [WorkflowNodeType.MUL_QUERY]: {
    title: '查询项目表',
    description: '按目标项目和表查询行数据。后端会按管理员身份做项目、表、行列权限校验。',
    icon: Rows3,
  },
  [WorkflowNodeType.MUL_UPDATE_ROW]: {
    title: '修改项目表行',
    description: '按行 ID 修改指定字段。当前 MVP 不支持按条件批量修改，避免误伤多行数据。',
    icon: FileText,
  },
  [WorkflowNodeType.MUL_DELETE_ROW]: {
    title: '删除项目表行',
    description: '按行 ID 删除单行数据。当前 MVP 不支持按条件批量删除。',
    icon: Trash2,
  },
}

const getOperationMeta = (nodeType: WorkflowNodeType) =>
  OPERATION_META[nodeType as keyof typeof OPERATION_META] || OPERATION_META[WorkflowNodeType.MUL_QUERY]

const MulTableOperationConfig: React.FC<MulTableOperationConfigProps> = ({
  nodeType,
  config,
  onConfigChange,
}) => {
  const meta = getOperationMeta(nodeType)
  const MetaIcon = meta.icon
  const isQuery = nodeType === WorkflowNodeType.MUL_QUERY
  const isUpdate = nodeType === WorkflowNodeType.MUL_UPDATE_ROW
  const isDelete = nodeType === WorkflowNodeType.MUL_DELETE_ROW

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-sky-100 bg-sky-50 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <MetaIcon size={15} className="text-sky-600" />
          {meta.title}
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600">{meta.description}</p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-500 uppercase flex items-center gap-1.5">
          <Database size={12} className="text-sky-600" />
          目标项目 ID
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          value={config.targetProjectId || ''}
          onChange={event => onConfigChange('targetProjectId', event.target.value)}
          placeholder="project_xxx，支持跨项目但必须在同一团队内"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-500 uppercase">目标表 Sheet ID</label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          value={config.sheetId || ''}
          onChange={event => onConfigChange('sheetId', event.target.value)}
          placeholder="sheet_xxx"
        />
      </div>

      {isQuery && (
        <>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-500 uppercase flex items-center gap-1.5">
              <ListFilter size={12} className="text-sky-600" />
              过滤条件 JSON
            </label>
            <textarea
              className="min-h-[92px] w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-sky-500"
              value={config.filtersJson || '[]'}
              onChange={event => onConfigChange('filtersJson', event.target.value)}
              placeholder='[{"columnId":"status","operator":"eq","value":"open"}]'
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 uppercase">返回模式</label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                value={config.returnMode || 'list'}
                onChange={event => onConfigChange('returnMode', event.target.value)}
              >
                <option value="list">列表</option>
                <option value="first">仅第一行</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 uppercase">最多返回</label>
              <input
                type="number"
                min="1"
                max="1000"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                value={config.maxRows ?? 20}
                onChange={event => onConfigChange('maxRows', event.target.value ? Number(event.target.value) : '')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-500 uppercase">返回字段</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              value={config.returnFields || ''}
              onChange={event => onConfigChange('returnFields', event.target.value)}
              placeholder="留空返回可见字段；多个字段用英文逗号分隔"
            />
          </div>
        </>
      )}

      {(isUpdate || isDelete) && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-500 uppercase">行 ID</label>
          <VariableInput
            value={config.rowIdTemplate || ''}
            onChange={value => onConfigChange('rowIdTemplate', value)}
            placeholder="{{nodes.query_1.data.firstRow.rowId}}"
          />
        </div>
      )}

      {isUpdate && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-500 uppercase">修改字段 JSON</label>
          <textarea
            className="min-h-[110px] w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-sky-500"
            value={config.fieldMappingsJson || '{}'}
            onChange={event => onConfigChange('fieldMappingsJson', event.target.value)}
            placeholder='{"status":"done","amount":"{{payload.amount}}"}'
          />
        </div>
      )}

      <div className="flex gap-2 rounded-md border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span>跨项目读写只允许同团队项目，最终权限以后端管理员身份校验结果为准。</span>
      </div>
    </div>
  )
}

export default MulTableOperationConfig

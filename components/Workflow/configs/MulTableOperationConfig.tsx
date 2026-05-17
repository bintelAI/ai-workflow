import React, { useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, Database, FileText, Link2, ListFilter, Rows3, Search, Trash2 } from 'lucide-react'

import { WorkflowNodeType } from '../types'
import { VariableInput, VariableTextArea } from './common/index'
import MulQueryBindingModal, { type MulQueryBinding } from './MulQueryBindingModal'
import MulUpdateRowBindingModal, {
  type MulUpdateRowTargetBinding,
} from './MulUpdateRowBindingModal'

interface MulTableOperationConfigProps {
  nodeType: WorkflowNodeType
  config: Record<string, any>
  onConfigChange: (key: string, value: any) => void
  onConfigPatch?: (patch: Record<string, any>) => void
  teamId?: string | null
  projectId?: string | null
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

const buildFieldMappingsJson = (binding: MulUpdateRowTargetBinding) => {
  const mappings = Object.fromEntries(
    (binding.fieldBindings || [])
      .filter(item => item.targetFieldId && item.sourceTemplate)
      .map(item => [item.targetFieldId, item.sourceTemplate])
  )
  return JSON.stringify(mappings, null, 2)
}

const buildFiltersJson = (binding: MulQueryBinding) =>
  JSON.stringify(
    (binding.filters || []).map(({ id, columnLabel, columnType, ...filter }) => filter),
    null,
    2
  )

const MulTableOperationConfig: React.FC<MulTableOperationConfigProps> = ({
  nodeType,
  config,
  onConfigChange,
  onConfigPatch,
  teamId,
  projectId,
}) => {
  const meta = getOperationMeta(nodeType)
  const MetaIcon = meta.icon
  const isQuery = nodeType === WorkflowNodeType.MUL_QUERY
  const isUpdate = nodeType === WorkflowNodeType.MUL_UPDATE_ROW
  const isDelete = nodeType === WorkflowNodeType.MUL_DELETE_ROW
  const [bindingModalOpen, setBindingModalOpen] = useState(false)
  const [queryBindingModalOpen, setQueryBindingModalOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const queryBinding = config.queryBinding as MulQueryBinding | undefined
  const targetBinding = config.targetBinding as MulUpdateRowTargetBinding | undefined
  const bindingRows = useMemo(
    () => (targetBinding?.fieldBindings || []).filter(item => item.targetFieldId && item.sourceTemplate),
    [targetBinding?.fieldBindings]
  )
  const queryFilters = useMemo(
    () => (queryBinding?.filters || []).filter(item => item.columnId && item.operator),
    [queryBinding?.filters]
  )

  const handleSaveQueryBinding = (binding: MulQueryBinding) => {
    const patch = {
      queryBinding: binding,
      targetProjectId: binding.projectId,
      sheetId: binding.sheetId,
      filtersJson: buildFiltersJson(binding),
      filterMatchType: binding.filterMatchType || 'and',
    }

    if (onConfigPatch) {
      onConfigPatch(patch)
    } else {
      Object.entries(patch).forEach(([key, value]) => onConfigChange(key, value))
    }
    setQueryBindingModalOpen(false)
  }

  const handleSaveBinding = (binding: MulUpdateRowTargetBinding) => {
    const patch = {
      targetBinding: binding,
      targetProjectId: binding.projectId,
      sheetId: binding.sheetId,
      rowIdTemplate: binding.rowIdTemplate || '',
      fieldMappingsJson: buildFieldMappingsJson(binding),
    }

    if (onConfigPatch) {
      onConfigPatch(patch)
    } else {
      Object.entries(patch).forEach(([key, value]) => onConfigChange(key, value))
    }
    setBindingModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-sky-100 bg-sky-50 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <MetaIcon size={15} className="text-sky-600" />
          {meta.title}
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600">{meta.description}</p>
      </div>

      {isQuery && (
        <>
          <div className="rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Search size={13} className="text-sky-600" />
                查询绑定
              </div>
              <button
                type="button"
                onClick={() => setQueryBindingModalOpen(true)}
                className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                打开绑定
              </button>
            </div>
            <div className="space-y-2 p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <span className="text-slate-400">项目：</span>
                  <span className="font-mono text-slate-700">{queryBinding?.projectName || config.targetProjectId || '未配置'}</span>
                </div>
                <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <span className="text-slate-400">表：</span>
                  <span className="font-mono text-slate-700">{queryBinding?.sheetName || config.sheetId || '未配置'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs">
                <span className="text-slate-500">筛选 {queryFilters.length} 条</span>
                <span className="font-mono uppercase text-slate-500">{queryBinding?.filterMatchType || config.filterMatchType || 'and'}</span>
              </div>
            </div>
          </div>

          <MulQueryBindingModal
            open={queryBindingModalOpen}
            value={queryBinding || {
              projectId: config.targetProjectId || projectId || '',
              sheetId: config.sheetId || '',
              filters: [],
              filterMatchType: config.filterMatchType === 'or' ? 'or' : 'and',
            }}
            teamId={teamId}
            projectId={projectId}
            onCancel={() => setQueryBindingModalOpen(false)}
            onSave={handleSaveQueryBinding}
          />
        </>
      )}

      {isUpdate && (
        <>
          <div className="rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Link2 size={13} className="text-sky-600" />
                绑定字段
              </div>
              <button
                type="button"
                onClick={() => setBindingModalOpen(true)}
                className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                打开绑定
              </button>
            </div>
            <div className="space-y-2 p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <span className="text-slate-400">项目：</span>
                  <span className="font-mono text-slate-700">{targetBinding?.projectName || config.targetProjectId || '未配置'}</span>
                </div>
                <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <span className="text-slate-400">表：</span>
                  <span className="font-mono text-slate-700">{targetBinding?.sheetName || config.sheetId || '未配置'}</span>
                </div>
              </div>
              <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs">
                <span className="text-slate-400">行 ID：</span>
                <span className="font-mono text-slate-700">{targetBinding?.rowIdTemplate || config.rowIdTemplate || '空则新增'}</span>
              </div>
              <div className="overflow-hidden rounded border border-slate-100">
                <div className="grid grid-cols-2 bg-slate-50 text-xs font-medium text-slate-500">
                  <div className="border-r border-slate-100 px-2 py-1.5">左侧写入字段</div>
                  <div className="px-2 py-1.5">右侧绑定信息</div>
                </div>
                {bindingRows.length ? (
                  bindingRows.map(item => (
                    <div key={item.targetFieldId} className="grid grid-cols-2 border-t border-slate-100 text-xs">
                      <div className="min-w-0 border-r border-slate-100 px-2 py-1.5">
                        <div className="truncate font-medium text-slate-700">{item.targetFieldLabel || item.targetFieldId}</div>
                        <div className="truncate font-mono text-slate-400">{item.targetFieldId}</div>
                      </div>
                      <div className="min-w-0 px-2 py-1.5 font-mono text-slate-700">
                        <div className="truncate">{item.sourceTemplate}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-3 text-center text-xs text-slate-400">暂无字段绑定</div>
                )}
              </div>
            </div>
          </div>

          <MulUpdateRowBindingModal
            open={bindingModalOpen}
            value={targetBinding || null}
            teamId={teamId}
            projectId={projectId}
            onCancel={() => setBindingModalOpen(false)}
            onSave={handleSaveBinding}
          />
        </>
      )}

      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-500 uppercase flex items-center gap-1.5">
          <Database size={12} className="text-sky-600" />
          目标项目 ID
        </label>
        <VariableInput
          value={config.targetProjectId || ''}
          onChange={value => onConfigChange('targetProjectId', value)}
          placeholder="   project_xxx，支持跨项目但必须在同一团队内"
          scope="all"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-500 uppercase">目标表 Sheet ID</label>
        <VariableInput
          value={config.sheetId || ''}
          onChange={value => onConfigChange('sheetId', value)}
          placeholder="   sheet_xxx"
          scope="all"
        />
      </div>

      {isQuery && (
        <>
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
            <VariableInput
              value={config.returnFields || ''}
              onChange={value => onConfigChange('returnFields', value)}
              placeholder="留空返回可见字段；多个字段用英文逗号分隔"
              scope="all"
            />
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setAdvancedOpen(open => !open)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-600"
            >
              <span className="flex items-center gap-1.5">
                <ListFilter size={12} className="text-sky-600" />
                高级配置 · 过滤条件 JSON
              </span>
              <ChevronDown size={14} className={`transition ${advancedOpen ? 'rotate-180' : ''}`} />
            </button>
            {advancedOpen && (
              <div className="space-y-2 border-t border-slate-100 p-3">
                <label className="block text-xs font-medium text-slate-500 uppercase">过滤条件 JSON</label>
                <VariableTextArea
                  value={config.filtersJson || '[]'}
                  onChange={value => onConfigChange('filtersJson', value)}
                  placeholder='[{"columnId":"status","operator":"equals","value":"open"}]'
                  rows={4}
                  scope="all"
                  plainTextMode
                />
              </div>
            )}
          </div>
        </>
      )}

      {(isUpdate || isDelete) && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-500 uppercase">行 ID</label>
          <VariableInput
            value={config.rowIdTemplate || ''}
            onChange={value => onConfigChange('rowIdTemplate', value)}
            placeholder="   空为新增行数据"
            scope="all"
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

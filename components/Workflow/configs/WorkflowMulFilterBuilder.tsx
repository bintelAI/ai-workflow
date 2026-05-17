import React, { useMemo, useState } from 'react'
import { Button, DatePicker, Input, Select } from 'antd'
import { PencilLine, Plus, Trash2 } from 'lucide-react'

import type { WorkflowMulColumn } from '@ai-flow-src/api/mul'
import { VariableBindModal } from './VariableBindModal'

export type WorkflowMulFilterMatchType = 'and' | 'or'

export interface WorkflowMulFilter {
  id: string
  columnId: string
  columnLabel?: string
  columnType?: string
  operator: string
  value: any
}

interface WorkflowMulFilterBuilderProps {
  filters: WorkflowMulFilter[]
  columns: WorkflowMulColumn[]
  matchType: WorkflowMulFilterMatchType
  onChange: (filters: WorkflowMulFilter[]) => void
  onMatchTypeChange: (type: WorkflowMulFilterMatchType) => void
}

const EMPTY_OPERATORS = [
  { label: '为空', value: 'isEmpty' },
  { label: '不为空', value: 'isNotEmpty' },
]

const getColumnKey = (column: WorkflowMulColumn) => String(column.fieldId || column.id || '')

const isEmptyOperator = (operator: string) => operator === 'isEmpty' || operator === 'isNotEmpty'

const isMultiValueOperator = (operator: string) =>
  ['isAnyOf', 'isNoneOf', 'hasAnyOf', 'hasAllOf', 'hasNoneOf'].includes(operator)

const WORKFLOW_FILTER_STATUS_OPTIONS = [
  { label: '未发起', value: 'not_started' },
  { label: '待审批', value: 'waiting_approval' },
  { label: '已通过', value: 'approved' },
  { label: '已完成', value: 'completed' },
  { label: '已驳回', value: 'rejected' },
  { label: '已撤回', value: 'recalled' },
  { label: '已取消', value: 'cancelled' },
  { label: '失败', value: 'failed' },
]

const getOperators = (column?: WorkflowMulColumn | null) => {
  const type = column?.type || 'text'

  if (['number', 'rating', 'progress', 'autoNumber'].includes(type)) {
    return [
      { label: '=', value: 'equals' },
      { label: '≠', value: 'isNot' },
      { label: '>', value: 'gt' },
      { label: '<', value: 'lt' },
      { label: '>=', value: 'gte' },
      { label: '<=', value: 'lte' },
      ...EMPTY_OPERATORS,
    ]
  }

  if (type === 'date') {
    return [
      { label: '是', value: 'isSame' },
      { label: '不是', value: 'isNot' },
      { label: '早于', value: 'isBefore' },
      { label: '晚于', value: 'isAfter' },
      { label: '早于或等于', value: 'isOnOrBefore' },
      { label: '晚于或等于', value: 'isOnOrAfter' },
      { label: '在范围内', value: 'isWithin' },
      ...EMPTY_OPERATORS,
    ]
  }

  if (['select', 'person', 'department', 'system', 'workflow', 'hierarchy'].includes(type)) {
    return [
      { label: '是', value: 'equals' },
      { label: '不是', value: 'isNot' },
      { label: '包含任意', value: 'isAnyOf' },
      { label: '不包含任意', value: 'isNoneOf' },
      ...EMPTY_OPERATORS,
    ]
  }

  if (['multiSelect', 'relation'].includes(type)) {
    return [
      { label: '包含任意', value: 'hasAnyOf' },
      { label: '包含所有', value: 'hasAllOf' },
      { label: '不包含任意', value: 'hasNoneOf' },
      { label: '完全等于', value: 'isExact' },
      ...EMPTY_OPERATORS,
    ]
  }

  if (['image', 'file', 'button', 'signature'].includes(type)) {
    return EMPTY_OPERATORS
  }

  return [
    { label: '包含', value: 'contains' },
    { label: '不包含', value: 'doesNotContain' },
    { label: '等于', value: 'equals' },
    { label: '不等于', value: 'isNot' },
    { label: '开头是', value: 'startsWith' },
    { label: '结尾是', value: 'endsWith' },
    ...EMPTY_OPERATORS,
  ]
}

const normalizeListInput = (value: any) => {
  if (Array.isArray(value)) return value.join(', ')
  return String(value ?? '')
}

const parseListInput = (value: string) =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

const getColumnOptions = (column?: WorkflowMulColumn) => {
  const rawOptions = column?.options || column?.config?.options || []
  if (!Array.isArray(rawOptions)) return []
  return rawOptions
    .map(option => {
      if (typeof option === 'string') return { label: option, value: option }
      const value = String(option.id || option.value || option.label || '')
      return {
        label: option.label || option.name || value,
        value,
      }
    })
    .filter(option => option.value)
}

const FilterValueInput: React.FC<{
  filter: WorkflowMulFilter
  column?: WorkflowMulColumn
  onChange: (value: any) => void
}> = ({ filter, column, onChange }) => {
  const [variableOpen, setVariableOpen] = useState(false)
  const type = column?.type || filter.columnType || 'text'
  const isListValue = isMultiValueOperator(filter.operator)

  const suffix = (
    <button
      type="button"
      onClick={() => setVariableOpen(true)}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
      title="选择变量"
    >
      <PencilLine size={14} />
    </button>
  )

  const input = (() => {
    if (type === 'date' && filter.operator === 'isWithin') {
      return (
        <Input
          size="small"
          value={normalizeListInput(filter.value)}
          onChange={event => onChange(parseListInput(event.target.value))}
          placeholder="开始日期, 结束日期，或绑定变量"
          suffix={suffix}
        />
      )
    }

    if (type === 'date') {
      return (
        <DatePicker
          size="small"
          className="w-full"
          value={null}
          onChange={date => onChange(date ? date.format('YYYY-MM-DD') : '')}
          placeholder={String(filter.value || '选择日期或用右侧变量')}
          suffixIcon={suffix}
        />
      )
    }

    if (type === 'checkbox' || type === 'switch') {
      return (
        <div className="flex gap-1">
          <Select
            size="small"
            className="min-w-0 flex-1"
            value={String(filter.value ?? '')}
            onChange={value => onChange(value === 'true')}
            options={[
              { label: type === 'switch' ? '开启' : '已选中', value: 'true' },
              { label: type === 'switch' ? '关闭' : '未选中', value: 'false' },
            ]}
          />
          {suffix}
        </div>
      )
    }

    if (type === 'workflow') {
      return (
        <div className="flex gap-1">
          <Select
            size="small"
            className="min-w-0 flex-1"
            value={filter.value}
            onChange={onChange}
            mode={isListValue ? 'multiple' : undefined}
            showSearch
            optionFilterProp="label"
            maxTagCount={1}
            placeholder="选择流程状态"
            options={WORKFLOW_FILTER_STATUS_OPTIONS}
          />
          {suffix}
        </div>
      )
    }

    if (['select', 'multiSelect', 'hierarchy', 'person', 'department', 'system'].includes(type)) {
      const options = getColumnOptions(column)
      const selectMode = isListValue || type === 'multiSelect' ? 'multiple' : undefined
      return (
        <div className="flex gap-1">
          <Select
            size="small"
            className="min-w-0 flex-1"
            value={filter.value}
            onChange={onChange}
            mode={selectMode}
            showSearch
            optionFilterProp="label"
            maxTagCount={1}
            placeholder={options.length ? '选择值' : '输入或绑定变量'}
            options={options}
          />
          {suffix}
        </div>
      )
    }

    return (
      <Input
        size="small"
        value={isListValue ? normalizeListInput(filter.value) : String(filter.value ?? '')}
        onChange={event => onChange(isListValue ? parseListInput(event.target.value) : event.target.value)}
        placeholder={isListValue ? '多个值用英文逗号分隔，支持变量' : '输入值或绑定变量'}
        suffix={suffix}
      />
    )
  })()

  return (
    <>
      {input}
      <VariableBindModal
        isOpen={variableOpen}
        onClose={() => setVariableOpen(false)}
        onSelect={selected => {
          onChange(isListValue ? [selected] : selected)
          setVariableOpen(false)
        }}
        currentValue={isListValue ? normalizeListInput(filter.value) : String(filter.value ?? '')}
        scope="all"
      />
    </>
  )
}

const WorkflowMulFilterBuilder: React.FC<WorkflowMulFilterBuilderProps> = ({
  filters,
  columns,
  matchType,
  onChange,
  onMatchTypeChange,
}) => {
  const filterableColumns = useMemo(() => columns.filter(column => getColumnKey(column)), [columns])

  const updateFilter = (id: string, patch: Partial<WorkflowMulFilter>) => {
    onChange(
      filters.map(filter => {
        if (filter.id !== id) return filter
        if (patch.columnId && patch.columnId !== filter.columnId) {
          const column = filterableColumns.find(item => getColumnKey(item) === patch.columnId)
          const operator = getOperators(column)[0]?.value || 'contains'
          return {
            ...filter,
            ...patch,
            columnLabel: column?.label || column?.name || patch.columnId,
            columnType: column?.type || 'text',
            operator,
            value: '',
          }
        }
        return { ...filter, ...patch }
      })
    )
  }

  const addFilter = () => {
    const column = filterableColumns[0]
    if (!column) return
    const columnId = getColumnKey(column)
    onChange([
      ...filters,
      {
        id: `filter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        columnId,
        columnLabel: column.label || column.name || columnId,
        columnType: column.type || 'text',
        operator: getOperators(column)[0]?.value || 'contains',
        value: '',
      },
    ])
  }

  return (
    <div className="rounded-md border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-xs font-semibold text-slate-600">筛选条件</span>
        {filters.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            符合
            <Select
              size="small"
              value={matchType}
              onChange={onMatchTypeChange}
              className="w-24"
              options={[
                { label: '所有', value: 'and' },
                { label: '任一', value: 'or' },
              ]}
            />
          </div>
        )}
      </div>

      <div className="space-y-3 overflow-x-auto p-3">
        {filters.length ? (
          filters.map((filter, index) => {
            const column = filterableColumns.find(item => getColumnKey(item) === filter.columnId)
            return (
              <div key={filter.id} className="grid min-w-[760px] grid-cols-[42px_220px_120px_1fr_32px] items-center gap-2 whitespace-nowrap">
                <span className="text-center text-xs uppercase text-slate-400">{index === 0 ? '当' : matchType}</span>
                <Select
                  size="small"
                  showSearch
                  className="w-full"
                  optionFilterProp="label"
                  value={filter.columnId}
                  onChange={value => updateFilter(filter.id, { columnId: value })}
                  options={filterableColumns.map(item => {
                    const value = getColumnKey(item)
                    return { label: item.label || item.name || value, value }
                  })}
                />
                <Select
                  size="small"
                  className="w-full"
                  value={filter.operator}
                  onChange={value => updateFilter(filter.id, { operator: value, value: isEmptyOperator(value) ? '' : filter.value })}
                  options={getOperators(column)}
                />
                {isEmptyOperator(filter.operator) ? (
                  <span className="text-xs text-slate-400">无需填写值</span>
                ) : (
                  <FilterValueInput filter={filter} column={column} onChange={value => updateFilter(filter.id, { value })} />
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<Trash2 size={14} />}
                  onClick={() => onChange(filters.filter(item => item.id !== filter.id))}
                />
              </div>
            )
          })
        ) : (
          <div className="py-6 text-center text-sm text-slate-400">暂无筛选条件</div>
        )}

        <Button type="dashed" block icon={<Plus size={14} />} onClick={addFilter} disabled={!filterableColumns.length}>
          添加筛选
        </Button>
      </div>
    </div>
  )
}

export default WorkflowMulFilterBuilder

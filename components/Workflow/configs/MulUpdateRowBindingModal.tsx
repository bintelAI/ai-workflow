import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Input, Modal, Select, Spin, Table, Tag } from 'antd'
import { PencilLine, Trash2 } from 'lucide-react'

import { mulApi, type WorkflowMulColumn, type WorkflowMulProject, type WorkflowMulSheet } from '@ai-flow-src/api/mul'
import { VariableBindModal } from './VariableBindModal'
import { VariableInput } from './common/index'

export interface MulUpdateRowFieldBinding {
  targetFieldId: string
  targetFieldLabel?: string
  targetFieldType?: string
  sourceTemplate: string
}

export interface MulUpdateRowTargetBinding {
  projectId: string
  projectName?: string
  sheetId: string
  sheetName?: string
  rowIdTemplate?: string
  fieldBindings: MulUpdateRowFieldBinding[]
}

interface MulUpdateRowBindingModalProps {
  open: boolean
  value?: MulUpdateRowTargetBinding | null
  teamId?: string | null
  projectId?: string | null
  onCancel: () => void
  onSave: (value: MulUpdateRowTargetBinding) => void
}

const getColumnKey = (column: WorkflowMulColumn) => String(column.fieldId || column.id || '')

const filterWritableColumns = (columns: WorkflowMulColumn[]) =>
  columns.filter(column => {
    const fieldId = getColumnKey(column)
    if (!fieldId) return false
    const systemField = column.config?.systemField || column.systemField
    return !systemField && !fieldId.startsWith('__system_')
  })

const BindingTemplateInput: React.FC<{
  value: string
  placeholder?: string
  onChange: (value: string) => void
}> = ({ value, placeholder, onChange }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        suffix={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
            title="选择变量"
          >
            <PencilLine size={14} />
          </button>
        }
      />
      <VariableBindModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={selected => {
          onChange(selected)
          setOpen(false)
        }}
        currentValue={value}
        scope="all"
      />
    </>
  )
}

const MulUpdateRowBindingModal: React.FC<MulUpdateRowBindingModalProps> = ({
  open,
  value,
  teamId,
  projectId,
  onCancel,
  onSave,
}) => {
  const [projectLoading, setProjectLoading] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [columnLoading, setColumnLoading] = useState(false)
  const [projects, setProjects] = useState<WorkflowMulProject[]>([])
  const [sheets, setSheets] = useState<WorkflowMulSheet[]>([])
  const [columns, setColumns] = useState<WorkflowMulColumn[]>([])
  const [draft, setDraft] = useState<MulUpdateRowTargetBinding>({
    projectId: '',
    sheetId: '',
    rowIdTemplate: '',
    fieldBindings: [],
  })

  useEffect(() => {
    if (!open) return
    setDraft({
      projectId: value?.projectId || projectId || '',
      projectName: value?.projectName,
      sheetId: value?.sheetId || '',
      sheetName: value?.sheetName,
      rowIdTemplate: value?.rowIdTemplate || '',
      fieldBindings: value?.fieldBindings || [],
    })
  }, [open, projectId, value])

  useEffect(() => {
    if (!open || !teamId) {
      setProjects([])
      return
    }

    setProjectLoading(true)
    mulApi
      .getTeamProjects(teamId)
      .then(list => {
        if (!list.some(item => item.id === projectId) && projectId) {
          setProjects([{ id: projectId, name: projectId }, ...list])
          return
        }
        setProjects(list)
      })
      .catch(() => {
        setProjects(projectId ? [{ id: projectId, name: projectId }] : [])
      })
      .finally(() => setProjectLoading(false))
  }, [open, projectId, teamId])

  useEffect(() => {
    if (!open || !draft.projectId) {
      setSheets([])
      return
    }

    setSheetLoading(true)
    mulApi
      .getProjectSheets(draft.projectId)
      .then(list => setSheets(list.filter(sheet => String(sheet.type || 'sheet') === 'sheet')))
      .catch(() => setSheets([]))
      .finally(() => setSheetLoading(false))
  }, [draft.projectId, open])

  useEffect(() => {
    if (!open || !teamId || !draft.projectId || !draft.sheetId) {
      setColumns([])
      return
    }

    setColumnLoading(true)
    mulApi
      .getSheetColumns(teamId, draft.projectId, draft.sheetId)
      .then(list => setColumns(filterWritableColumns(list)))
      .catch(() => setColumns([]))
      .finally(() => setColumnLoading(false))
  }, [draft.projectId, draft.sheetId, open, teamId])

  const handleProjectChange = useCallback(
    (nextProjectId: string) => {
      const project = projects.find(item => item.id === nextProjectId)
      setDraft({
        projectId: nextProjectId,
        projectName: project?.name,
        sheetId: '',
        sheetName: '',
        rowIdTemplate: draft.rowIdTemplate || '',
        fieldBindings: [],
      })
      setColumns([])
    },
    [draft.rowIdTemplate, projects]
  )

  const handleSheetChange = useCallback(
    (sheetId: string) => {
      const sheet = sheets.find(item => item.sheetId === sheetId)
      setDraft(current => ({
        ...current,
        sheetId,
        sheetName: sheet?.name,
        fieldBindings: [],
      }))
    },
    [sheets]
  )

  const updateBindingSource = useCallback((targetFieldId: string, sourceTemplate: string, column?: WorkflowMulColumn) => {
    setDraft(current => ({
      ...current,
      fieldBindings: sourceTemplate
        ? [
            ...current.fieldBindings.filter(item => item.targetFieldId !== targetFieldId),
            {
              targetFieldId,
              targetFieldLabel: column?.label || column?.name || targetFieldId,
              targetFieldType: column?.type || 'text',
              sourceTemplate,
            },
          ]
        : current.fieldBindings.filter(item => item.targetFieldId !== targetFieldId),
    }))
  }, [])

  const clearBinding = useCallback((targetFieldId: string) => {
    setDraft(current => ({
      ...current,
      fieldBindings: current.fieldBindings.filter(item => item.targetFieldId !== targetFieldId),
    }))
  }, [])

  const handleSave = useCallback(() => {
    const selectedProject = projects.find(item => item.id === draft.projectId)
    const selectedSheet = sheets.find(item => item.sheetId === draft.sheetId)
    onSave({
      ...draft,
      projectName: draft.projectName || selectedProject?.name,
      sheetName: draft.sheetName || selectedSheet?.name,
      fieldBindings: draft.fieldBindings.filter(item => item.targetFieldId && item.sourceTemplate),
    })
  }, [draft, onSave, projects, sheets])

  return (
    <Modal
      title="绑定写入字段"
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      okText="保存绑定"
      cancelText="关闭"
      width={1040}
      destroyOnHidden
      okButtonProps={{
        disabled: !draft.projectId || !draft.sheetId || !draft.fieldBindings.some(item => item.sourceTemplate),
      }}
    >
      <div className="space-y-4">
        <Alert
          type="info"
          showIcon
          message="行 ID 有值时更新目标行，行 ID 为空时新增目标行。字段绑定只会写入右侧已配置来源的数据。"
        />

        <Spin spinning={projectLoading || sheetLoading}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500">目标项目</span>
              <Select
                showSearch
                loading={projectLoading}
                value={draft.projectId || undefined}
                onChange={handleProjectChange}
                placeholder="选择要写入的项目"
                optionFilterProp="label"
                options={projects.map(project => ({
                  label: project.name || project.id,
                  value: project.id,
                }))}
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500">目标表</span>
              <Select
                showSearch
                loading={sheetLoading}
                value={draft.sheetId || undefined}
                onChange={handleSheetChange}
                placeholder="选择要写入的数据表"
                disabled={!draft.projectId}
                optionFilterProp="label"
                notFoundContent={sheetLoading ? '正在加载...' : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据表" />}
                options={sheets.map(sheet => ({
                  label: sheet.name || sheet.sheetId,
                  value: sheet.sheetId,
                }))}
              />
            </div>
          </div>
        </Spin>

        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-500">行 ID 绑定</span>
          <VariableInput
            value={draft.rowIdTemplate || ''}
            onChange={rowIdTemplate => setDraft(current => ({ ...current, rowIdTemplate }))}
            placeholder="留空则新增；填写行 ID 或变量则更新"
            scope="all"
          />
        </div>

        <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-4">
          <div className="rounded-md border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-xs font-semibold text-slate-600">写入绑定</span>
              <span className="text-xs text-slate-400">目标字段和绑定变量合并展示</span>
            </div>
            <Spin spinning={columnLoading}>
              <Table
                rowKey={getColumnKey}
                size="small"
                pagination={false}
                dataSource={columns}
                locale={{ emptyText: '选择表后展示字段' }}
                columns={[
                  {
                    title: '写入字段',
                    width: 220,
                    render: (_: unknown, record: WorkflowMulColumn) => {
                      const fieldId = getColumnKey(record)
                      return (
                        <div>
                          <div className="text-sm font-medium text-slate-700">
                            {record.label || record.name || fieldId}
                          </div>
                          <div className="text-xs text-slate-400">{fieldId}</div>
                          <Tag className="mt-1" color="blue">
                            {record.type || 'text'}
                          </Tag>
                        </div>
                      )
                    },
                  },
                  {
                    title: '绑定来源',
                    render: (_: unknown, record: WorkflowMulColumn) => {
                      const fieldId = getColumnKey(record)
                      const binding = draft.fieldBindings.find(item => item.targetFieldId === fieldId)
                      return (
                        <BindingTemplateInput
                          value={binding?.sourceTemplate || ''}
                          placeholder="选择或输入来源变量"
                          onChange={value => updateBindingSource(fieldId, value, record)}
                        />
                      )
                    },
                  },
                  {
                    title: '',
                    width: 52,
                    render: (_: unknown, record: WorkflowMulColumn) => {
                      const fieldId = getColumnKey(record)
                      const binding = draft.fieldBindings.find(item => item.targetFieldId === fieldId)
                      if (!binding?.sourceTemplate) return null
                      return (
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 size={14} />}
                          onClick={() => clearBinding(fieldId)}
                        />
                      )
                    },
                  },
                ]}
              />
            </Spin>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default MulUpdateRowBindingModal

import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Empty, Modal, Select, Spin } from 'antd'

import { mulApi, type WorkflowMulColumn, type WorkflowMulProject, type WorkflowMulSheet } from '@ai-flow-src/api/mul'
import WorkflowMulFilterBuilder, {
  type WorkflowMulFilter,
  type WorkflowMulFilterMatchType,
} from './WorkflowMulFilterBuilder'

export interface MulQueryBinding {
  projectId: string
  projectName?: string
  sheetId: string
  sheetName?: string
  filters: WorkflowMulFilter[]
  filterMatchType: WorkflowMulFilterMatchType
}

interface MulQueryBindingModalProps {
  open: boolean
  value?: MulQueryBinding | null
  teamId?: string | null
  projectId?: string | null
  onCancel: () => void
  onSave: (value: MulQueryBinding) => void
}

const normalizeFilters = (filters: any[]): WorkflowMulFilter[] =>
  (Array.isArray(filters) ? filters : [])
    .filter(item => item?.columnId && item?.operator)
    .map(item => ({
      id: String(item.id || `filter_${item.columnId}_${item.operator}`),
      columnId: String(item.columnId),
      columnLabel: item.columnLabel,
      columnType: item.columnType,
      operator: String(item.operator),
      value: item.value ?? '',
    }))

const getColumnKey = (column: WorkflowMulColumn) => String(column.fieldId || column.id || '')

const MulQueryBindingModal: React.FC<MulQueryBindingModalProps> = ({
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
  const [draft, setDraft] = useState<MulQueryBinding>({
    projectId: '',
    sheetId: '',
    filters: [],
    filterMatchType: 'and',
  })

  useEffect(() => {
    if (!open) return
    setDraft({
      projectId: value?.projectId || projectId || '',
      projectName: value?.projectName,
      sheetId: value?.sheetId || '',
      sheetName: value?.sheetName,
      filters: normalizeFilters(value?.filters || []),
      filterMatchType: value?.filterMatchType === 'or' ? 'or' : 'and',
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
      .then(list => setColumns(list.filter(column => getColumnKey(column))))
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
        filters: [],
        filterMatchType: 'and',
      })
      setColumns([])
    },
    [projects]
  )

  const handleSheetChange = useCallback(
    (sheetId: string) => {
      const sheet = sheets.find(item => item.sheetId === sheetId)
      setDraft(current => ({
        ...current,
        sheetId,
        sheetName: sheet?.name,
        filters: [],
      }))
    },
    [sheets]
  )

  const handleSave = useCallback(() => {
    const selectedProject = projects.find(item => item.id === draft.projectId)
    const selectedSheet = sheets.find(item => item.sheetId === draft.sheetId)
    onSave({
      ...draft,
      projectName: draft.projectName || selectedProject?.name,
      sheetName: draft.sheetName || selectedSheet?.name,
      filters: normalizeFilters(draft.filters),
      filterMatchType: draft.filterMatchType === 'or' ? 'or' : 'and',
    })
  }, [draft, onSave, projects, sheets])

  return (
    <Modal
      title="查询绑定"
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      okText="保存绑定"
      cancelText="关闭"
      width={1040}
      destroyOnHidden
      okButtonProps={{ disabled: !draft.projectId || !draft.sheetId }}
    >
      <div className="space-y-4">
        <Alert type="info" showIcon message="选择查询目标表后，可用可视化筛选条件生成后端查询过滤 JSON，筛选值支持绑定工作流变量。" />

        <Spin spinning={projectLoading || sheetLoading}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500">目标项目</span>
              <Select
                showSearch
                loading={projectLoading}
                value={draft.projectId || undefined}
                onChange={handleProjectChange}
                placeholder="选择要查询的项目"
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
                placeholder="选择要查询的数据表"
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

        <Spin spinning={columnLoading}>
          <WorkflowMulFilterBuilder
            filters={draft.filters}
            columns={columns}
            matchType={draft.filterMatchType}
            onChange={filters => setDraft(current => ({ ...current, filters }))}
            onMatchTypeChange={filterMatchType => setDraft(current => ({ ...current, filterMatchType }))}
          />
        </Spin>
      </div>
    </Modal>
  )
}

export default MulQueryBindingModal

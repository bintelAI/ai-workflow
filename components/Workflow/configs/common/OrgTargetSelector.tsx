import React from 'react'
import { Avatar, Button, Empty, Modal, Table, Tabs, Tree } from 'antd'
import { Building2, CheckCircle2, Users } from 'lucide-react'

import type { WorkflowOrgDepartment, WorkflowProjectMember } from '@ai-flow-src/api/org'

interface OrgTargetSelectorValue {
  users?: Array<{ id: string; name: string; departmentId?: string }>
  departments?: Array<{ id: string; name: string }>
}

interface OrgTargetSelectorProps {
  open: boolean
  onClose: () => void
  title: string
  members: WorkflowProjectMember[]
  departments: WorkflowOrgDepartment[]
  value?: OrgTargetSelectorValue
  onConfirm: (value: Required<OrgTargetSelectorValue>) => void
  allowDepartment?: boolean
  allowUser?: boolean
}

const flattenDepartments = (items: WorkflowOrgDepartment[]): WorkflowOrgDepartment[] => {
  const result: WorkflowOrgDepartment[] = []
  items.forEach(item => {
    result.push(item)
    if (item.children?.length) {
      result.push(...flattenDepartments(item.children))
    }
  })
  return result
}

const buildTreeData = (items: WorkflowOrgDepartment[]): any[] =>
  items.map(item => ({
    title: item.name,
    key: item.id,
    children: Array.isArray(item.children) ? buildTreeData(item.children) : [],
  }))

export const OrgTargetSelector: React.FC<OrgTargetSelectorProps> = ({
  open,
  onClose,
  title,
  members,
  departments,
  value,
  onConfirm,
  allowDepartment = true,
  allowUser = true,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>(allowUser ? 'users' : 'departments')
  const [selectedUserIds, setSelectedUserIds] = React.useState<React.Key[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = React.useState<React.Key[]>([])

  const flatDepartments = React.useMemo(() => flattenDepartments(departments), [departments])
  const departmentMap = React.useMemo(
    () => new Map(flatDepartments.map(item => [String(item.id), item])),
    [flatDepartments]
  )

  React.useEffect(() => {
    if (!open) {
      return
    }
    setSelectedUserIds((value?.users || []).map(item => item.id))
    setSelectedDepartmentIds((value?.departments || []).map(item => item.id))
  }, [open, value])

  const selectedUsers = React.useMemo(
    () =>
      members
        .filter(item => selectedUserIds.includes(item.id))
        .map(item => ({
          id: item.id,
          name: item.name,
          departmentId: item.departmentId,
        })),
    [members, selectedUserIds]
  )

  const selectedDepartments = React.useMemo(
    () =>
      selectedDepartmentIds
        .map(id => departmentMap.get(String(id)))
        .filter(Boolean)
        .map(item => ({
          id: String(item!.id),
          name: item!.name,
        })),
    [departmentMap, selectedDepartmentIds]
  )

  const columns = [
    {
      title: '成员',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: WorkflowProjectMember) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar || undefined}>{record.name?.[0] || 'U'}</Avatar>
          <div>
            <div className="text-sm font-medium text-slate-800">{record.name}</div>
            <div className="text-xs text-slate-400">{record.email || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'departmentId',
      key: 'departmentId',
      width: 160,
      render: (departmentId: string | undefined) =>
        departmentId ? departmentMap.get(String(departmentId))?.name || '-' : '-',
    },
  ]

  const tabs = [
    allowUser
      ? {
          key: 'users',
          label: '项目成员',
          children: (
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              columns={columns as any}
              dataSource={members}
              locale={{ emptyText: <Empty description="暂无项目成员" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              rowSelection={{
                selectedRowKeys: selectedUserIds,
                onChange: keys => setSelectedUserIds(keys),
              }}
            />
          ),
        }
      : null,
    allowDepartment
      ? {
          key: 'departments',
          label: '团队部门',
          children: departments.length ? (
            <Tree
              checkable
              defaultExpandAll
              checkedKeys={selectedDepartmentIds}
              onCheck={checkedKeys =>
                setSelectedDepartmentIds(
                  Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked
                )
              }
              treeData={buildTreeData(departments)}
            />
          ) : (
            <Empty description="暂无团队部门" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; children: React.ReactNode }>

  const hasSelection = selectedUsers.length > 0 || selectedDepartments.length > 0

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <Users size={16} className="text-indigo-500" />
          <span>{title}</span>
        </div>
      }
      onCancel={onClose}
      width={820}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {allowUser && (
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-indigo-500" />
                已选项目成员 {selectedUsers.length} 人
              </span>
            )}
            {allowDepartment && (
              <span className="flex items-center gap-1">
                <Building2 size={12} className="text-sky-500" />
                已选团队部门 {selectedDepartments.length} 个
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              disabled={!hasSelection}
              onClick={() => {
                onConfirm({
                  users: selectedUsers,
                  departments: selectedDepartments,
                })
                onClose()
              }}
            >
              确定
            </Button>
          </div>
        </div>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
    </Modal>
  )
}

export default OrgTargetSelector

import React from 'react'
import { Avatar, Button, Checkbox, Empty, Modal, Table, Tabs, Tree } from 'antd'
import { Building2, CheckCircle2, ShieldCheck, UserCog, Users } from 'lucide-react'

import type { WorkflowOrgDepartment, WorkflowProjectMember, WorkflowProjectRole } from '@ai-flow-src/api/org'

interface OrgTargetSelectorValue {
  users?: Array<{ id: string; name: string; departmentId?: string }>
  departments?: Array<{ id: string; name: string }>
  departmentLeaders?: Array<{ id: string; name: string }>
  projectRoles?: Array<{ id: string; name: string }>
  projectRoleOwners?: Array<{ id: string; name: string }>
  deptLeader?: boolean
  directManager?: boolean
}

interface OrgTargetSelectorProps {
  open: boolean
  onClose: () => void
  title: string
  members: WorkflowProjectMember[]
  departments: WorkflowOrgDepartment[]
  roles?: WorkflowProjectRole[]
  value?: OrgTargetSelectorValue
  onConfirm: (value: Required<OrgTargetSelectorValue>) => void
  allowDepartment?: boolean
  allowDepartmentLeader?: boolean
  allowUser?: boolean
  allowProjectRole?: boolean
  allowProjectRoleOwner?: boolean
  allowDynamic?: boolean
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

const mergeSelectedItems = <T extends { id: string; name: string }>(
  ids: React.Key[],
  valueItems: T[] | undefined,
  resolveItem: (id: string) => T | undefined
) =>
  ids.map(id => {
    const key = String(id)
    return resolveItem(key) || valueItems?.find(item => String(item.id) === key)
  }).filter(Boolean) as T[]

export const OrgTargetSelector: React.FC<OrgTargetSelectorProps> = ({
  open,
  onClose,
  title,
  members,
  departments,
  roles = [],
  value,
  onConfirm,
  allowDepartment = true,
  allowDepartmentLeader = false,
  allowUser = true,
  allowProjectRole = false,
  allowProjectRoleOwner = false,
  allowDynamic = false,
}) => {
  const getDefaultTab = () => {
    if (allowUser) return 'users'
    if (allowDepartment) return 'departments'
    if (allowDepartmentLeader) return 'departmentLeaders'
    if (allowProjectRole) return 'projectRoles'
    if (allowProjectRoleOwner) return 'projectRoleOwners'
    return 'dynamic'
  }
  const [activeTab, setActiveTab] = React.useState<string>(getDefaultTab())
  const [selectedUserIds, setSelectedUserIds] = React.useState<React.Key[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = React.useState<React.Key[]>([])
  const [selectedDepartmentLeaderIds, setSelectedDepartmentLeaderIds] = React.useState<React.Key[]>([])
  const [selectedProjectRoleIds, setSelectedProjectRoleIds] = React.useState<React.Key[]>([])
  const [selectedProjectRoleOwnerIds, setSelectedProjectRoleOwnerIds] = React.useState<React.Key[]>([])
  const [deptLeaderChecked, setDeptLeaderChecked] = React.useState(false)
  const [directManagerChecked, setDirectManagerChecked] = React.useState(false)

  const flatDepartments = React.useMemo(() => flattenDepartments(departments), [departments])
  const departmentMap = React.useMemo(
    () => new Map(flatDepartments.map(item => [String(item.id), item])),
    [flatDepartments]
  )
  const roleMap = React.useMemo(
    () => new Map(roles.map(item => [String(item.id), item])),
    [roles]
  )

  React.useEffect(() => {
    if (!open) {
      return
    }
    setActiveTab(getDefaultTab())
    setSelectedUserIds((value?.users || []).map(item => item.id))
    setSelectedDepartmentIds((value?.departments || []).map(item => item.id))
    setSelectedDepartmentLeaderIds((value?.departmentLeaders || []).map(item => item.id))
    setSelectedProjectRoleIds((value?.projectRoles || []).map(item => item.id))
    setSelectedProjectRoleOwnerIds((value?.projectRoleOwners || []).map(item => item.id))
    setDeptLeaderChecked(Boolean(value?.deptLeader))
    setDirectManagerChecked(Boolean(value?.directManager))
  }, [open, value])

  const selectedUsers = React.useMemo(
    () => mergeSelectedItems(
      selectedUserIds,
      value?.users,
      id => {
        const member = members.find(item => String(item.id) === id)
        return member ? {
          id: member.id,
          name: member.name,
          departmentId: member.departmentId,
        } : undefined
      }
    ),
    [members, selectedUserIds, value?.users]
  )

  const selectedDepartments = React.useMemo(
    () => mergeSelectedItems(
      selectedDepartmentIds,
      value?.departments,
      id => {
        const department = departmentMap.get(id)
        return department ? { id: String(department.id), name: department.name } : undefined
      }
    ),
    [departmentMap, selectedDepartmentIds, value?.departments]
  )
  const selectedDepartmentLeaders = React.useMemo(
    () => mergeSelectedItems(
      selectedDepartmentLeaderIds,
      value?.departmentLeaders,
      id => {
        const department = departmentMap.get(id)
        return department ? { id: String(department.id), name: department.name } : undefined
      }
    ),
    [departmentMap, selectedDepartmentLeaderIds, value?.departmentLeaders]
  )
  const selectedProjectRoles = React.useMemo(
    () => mergeSelectedItems(
      selectedProjectRoleIds,
      value?.projectRoles,
      id => {
        const role = roleMap.get(id)
        return role ? { id: String(role.id), name: role.name } : undefined
      }
    ),
    [roleMap, selectedProjectRoleIds, value?.projectRoles]
  )
  const selectedProjectRoleOwners = React.useMemo(
    () => mergeSelectedItems(
      selectedProjectRoleOwnerIds,
      value?.projectRoleOwners,
      id => {
        const role = roleMap.get(id)
        return role ? { id: String(role.id), name: role.name } : undefined
      }
    ),
    [roleMap, selectedProjectRoleOwnerIds, value?.projectRoleOwners]
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

  const roleColumns = [
    {
      title: '项目角色',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: WorkflowProjectRole) => (
        <div>
          <div className="text-sm font-medium text-slate-800">{record.name}</div>
          {record.description && <div className="text-xs text-slate-400">{record.description}</div>}
        </div>
      ),
    },
  ]

  const roleOwnerColumns = [
    {
      title: '角色负责人',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: WorkflowProjectRole) => (
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-800">{record.name}</div>
            <div className="text-xs text-slate-400">
              {record.ownerUserName ? `负责人：${record.ownerUserName}` : '未配置负责人'}
            </div>
          </div>
          {!record.ownerUserName && (
            <span className="rounded bg-rose-50 px-2 py-0.5 text-xs text-rose-600">未配置</span>
          )}
        </div>
      ),
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
          label: '团队部门成员',
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
    allowDepartmentLeader
      ? {
          key: 'departmentLeaders',
          label: '部门负责人',
          children: departments.length ? (
            <Tree
              checkable
              defaultExpandAll
              checkedKeys={selectedDepartmentLeaderIds}
              onCheck={checkedKeys =>
                setSelectedDepartmentLeaderIds(
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
    allowProjectRole
      ? {
          key: 'projectRoles',
          label: '项目角色成员',
          children: (
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              columns={roleColumns as any}
              dataSource={roles}
              locale={{ emptyText: <Empty description="暂无项目角色" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              rowSelection={{
                selectedRowKeys: selectedProjectRoleIds,
                onChange: keys => setSelectedProjectRoleIds(keys),
              }}
            />
          ),
        }
      : null,
    allowProjectRoleOwner
      ? {
          key: 'projectRoleOwners',
          label: '角色负责人',
          children: (
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              columns={roleOwnerColumns as any}
              dataSource={roles}
              locale={{ emptyText: <Empty description="暂无项目角色" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              rowSelection={{
                selectedRowKeys: selectedProjectRoleOwnerIds,
                onChange: keys => setSelectedProjectRoleOwnerIds(keys),
              }}
            />
          ),
        }
      : null,
    allowDynamic
      ? {
          key: 'dynamic',
          label: '动态负责人',
          children: (
            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <Checkbox checked={deptLeaderChecked} onChange={event => setDeptLeaderChecked(event.target.checked)}>
                <span className="text-sm text-slate-700">发起人部门负责人</span>
              </Checkbox>
              <Checkbox checked={directManagerChecked} onChange={event => setDirectManagerChecked(event.target.checked)}>
                <span className="text-sm text-slate-700">直属上级</span>
              </Checkbox>
              <div className="text-xs text-slate-500">
                发起人部门负责人按发起人所属部门动态解析；直属上级会在负责人为本人时向上级部门继续查找。
              </div>
            </div>
          ),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; children: React.ReactNode }>

  const hasSelection =
    selectedUsers.length > 0 ||
    selectedDepartments.length > 0 ||
    selectedDepartmentLeaders.length > 0 ||
    selectedProjectRoles.length > 0 ||
    selectedProjectRoleOwners.length > 0 ||
    deptLeaderChecked ||
    directManagerChecked

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
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {allowUser && selectedUsers.length > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-indigo-500" />
                已选项目成员 {selectedUsers.length} 人
              </span>
            )}
            {allowDepartment && selectedDepartments.length > 0 && (
              <span className="flex items-center gap-1">
                <Building2 size={12} className="text-sky-500" />
                已选团队部门 {selectedDepartments.length} 个
              </span>
            )}
            {allowDepartmentLeader && selectedDepartmentLeaders.length > 0 && (
              <span className="flex items-center gap-1">
                <Building2 size={12} className="text-cyan-500" />
                已选部门负责人 {selectedDepartmentLeaders.length} 个
              </span>
            )}
            {allowProjectRole && selectedProjectRoles.length > 0 && (
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                已选角色成员 {selectedProjectRoles.length} 个
              </span>
            )}
            {allowProjectRoleOwner && selectedProjectRoleOwners.length > 0 && (
              <span className="flex items-center gap-1">
                <UserCog size={12} className="text-amber-500" />
                已选角色负责人 {selectedProjectRoleOwners.length} 个
              </span>
            )}
            {allowDynamic && deptLeaderChecked && (
              <span className="flex items-center gap-1">
                <UserCog size={12} className="text-violet-500" />
                已选发起人部门负责人
              </span>
            )}
            {allowDynamic && directManagerChecked && (
              <span className="flex items-center gap-1">
                <UserCog size={12} className="text-violet-500" />
                已选直属上级
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
                  departmentLeaders: selectedDepartmentLeaders,
                  projectRoles: selectedProjectRoles,
                  projectRoleOwners: selectedProjectRoleOwners,
                  deptLeader: deptLeaderChecked,
                  directManager: directManagerChecked,
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

import request from './request'

export interface WorkflowOrgDepartment {
  id: string
  name: string
  parentId?: string
  description?: string
  managerId?: string
  children?: WorkflowOrgDepartment[]
}

export interface WorkflowProjectMember {
  id: string
  name: string
  email: string
  role: number
  avatar: string
  status?: string | number
  departmentId?: string
}

const normalizeId = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  return String(value)
}

const normalizeDepartmentTree = (items: any[] = []): WorkflowOrgDepartment[] =>
  items.map(item => ({
    ...item,
    id: String(item.id),
    parentId: normalizeId(item.parentId),
    managerId: normalizeId(item.managerId),
    children: Array.isArray(item.children) ? normalizeDepartmentTree(item.children) : [],
  }))

export const orgApi = {
  async getTeamDepartments(teamId: string) {
    const res = await request.get<any, { data: any[] }>(`/app/org/${teamId}/department/list`)
    return normalizeDepartmentTree(Array.isArray(res?.data) ? res.data : [])
  },

  async getProjectMembers(teamId: string, projectId: string) {
    const res = await request.get<any, { data: any[] }>(`/app/org/${teamId}/team_user/list`, {
      params: { projectId },
    })

    const list = Array.isArray(res?.data) ? res.data : []
    return list.map((item: any) => ({
      id: String(item.id),
      name: item.name || item.nickName || item.username || String(item.id),
      email: item.email || '',
      role: Number(item.role || 0),
      avatar: item.avatar || item.headImg || '',
      status: item.status,
      departmentId: normalizeId(item.departmentId),
    })) as WorkflowProjectMember[]
  },
}

export default orgApi

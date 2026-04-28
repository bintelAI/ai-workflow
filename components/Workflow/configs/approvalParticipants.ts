import type { WorkflowProjectRole } from '@ai-flow-src/api/org'

export type ApprovalParticipantRule = {
  sourceType: string
  sourceValue?: string
  sourceName?: string
  sourceLabel?: string
}

export const summarizeApprovalParticipants = (rules: ApprovalParticipantRule[]) =>
  rules
    .map(rule => rule?.sourceName || rule?.sourceLabel || rule?.sourceValue)
    .filter(Boolean)
    .join(', ')

export const buildOrgParticipantRules = (
  currentRules: ApprovalParticipantRule[],
  value: {
    users: Array<{ id: string; name: string; departmentId?: string }>
    departments: Array<{ id: string; name: string }>
  }
) => [
  ...value.users.map(user => ({
    sourceType: 'user',
    sourceValue: user.id,
    sourceName: user.name,
    sourceLabel: user.name,
  })),
  ...value.departments.map(department => ({
    sourceType: 'department',
    sourceValue: department.id,
    sourceName: department.name,
    sourceLabel: department.name,
  })),
  ...currentRules.filter(rule => rule?.sourceType !== 'user' && rule?.sourceType !== 'department'),
]

export const buildProjectRoleParticipantRules = (
  currentRules: ApprovalParticipantRule[],
  roles: WorkflowProjectRole[],
  selectedRoleIds: string[]
) => [
  ...currentRules.filter(rule => rule?.sourceType !== 'project_role'),
  ...roles
    .filter(role => selectedRoleIds.includes(role.id))
    .map(role => ({
      sourceType: 'project_role',
      sourceValue: role.id,
      sourceName: role.name,
      sourceLabel: role.name,
    })),
]

export const buildDynamicParticipantRules = (
  currentRules: ApprovalParticipantRule[],
  sourceType: 'dept_leader' | 'direct_manager',
  checked: boolean
) => {
  const nextRules = currentRules.filter(rule => rule?.sourceType !== sourceType)
  if (!checked) {
    return nextRules
  }

  const label = sourceType === 'dept_leader' ? '部门负责人' : '直属上级'
  return [
    ...nextRules,
    {
      sourceType,
      sourceName: label,
      sourceLabel: label,
    },
  ]
}

import React, { useState } from 'react'
import { Bell, User } from 'lucide-react'
import { VariableTextArea } from './common'
import { getRuntimeProjectId, getRuntimeTeamId } from '@ai-flow/utils/runtime'
import {
  orgApi,
  type WorkflowOrgDepartment,
  type WorkflowProjectMember,
  type WorkflowProjectRole,
} from '@ai-flow-src/api/org'
import OrgTargetSelector from './common/OrgTargetSelector'
import {
  buildSelectorParticipantRules,
  summarizeApprovalParticipants,
  type ApprovalParticipantRule,
} from './approvalParticipants'

interface NotificationConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
}

export const NotificationConfig: React.FC<NotificationConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [departments, setDepartments] = useState<WorkflowOrgDepartment[]>([])
  const [members, setMembers] = useState<WorkflowProjectMember[]>([])
  const [roles, setRoles] = useState<WorkflowProjectRole[]>([])
  const [selectorLoading, setSelectorLoading] = useState(false)
  const participantRules: ApprovalParticipantRule[] = Array.isArray(config?.participantRules)
    ? config.participantRules
    : []
  const selectedUsers = participantRules.filter((item: any) => item?.sourceType === 'user')
  const selectedDepartments = participantRules.filter((item: any) => item?.sourceType === 'department')
  const selectedDepartmentLeaders = participantRules.filter((item: any) => item?.sourceType === 'dept_leader' && item?.sourceValue)
  const selectedProjectRoles = participantRules.filter((item: any) => item?.sourceType === 'project_role')
  const selectedProjectRoleOwners = participantRules.filter((item: any) => item?.sourceType === 'project_role_owner')
  const hasDeptLeaderRule = participantRules.some((item: any) => item?.sourceType === 'dept_leader' && !item?.sourceValue)
  const hasDirectManagerRule = participantRules.some((item: any) => item?.sourceType === 'direct_manager')

  const loadOrgOptions = async () => {
    const teamId = getRuntimeTeamId()
    const projectId = getRuntimeProjectId()
    if (!teamId || !projectId) {
      setDepartments([])
      setMembers([])
      setRoles([])
      return
    }
    setSelectorLoading(true)
    try {
      const [nextDepartments, nextMembers, nextRoles] = await Promise.all([
        orgApi.getTeamDepartments(teamId),
        orgApi.getProjectMembers(teamId, projectId),
        orgApi.getProjectRoles(teamId, projectId),
      ])
      setDepartments(nextDepartments)
      setMembers(nextMembers)
      setRoles(nextRoles)
    } finally {
      setSelectorLoading(false)
    }
  }

  const openSelector = async () => {
    await loadOrgOptions()
    setSelectorOpen(true)
  }

  const syncParticipantRules = (value: {
    users: Array<{ id: string; name: string; departmentId?: string }>
    departments: Array<{ id: string; name: string }>
    departmentLeaders?: Array<{ id: string; name: string }>
    projectRoles?: Array<{ id: string; name: string }>
    projectRoleOwners?: Array<{ id: string; name: string }>
    deptLeader?: boolean
    directManager?: boolean
  }) => {
    const nextRules = buildSelectorParticipantRules(value)
    onConfigChange('participantRules', nextRules)
    onConfigChange('recipient', summarizeApprovalParticipants(nextRules))
    onConfigChange('channel', 'inbox')
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">通知渠道</label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
          value={config?.channel || 'inbox'}
          onChange={e => onConfigChange('channel', e.target.value)}
        >
          <option value="inbox">站内消息</option>
          <option value="email">邮件 (兼容旧配置)</option>
          <option value="slack">Slack / 飞书 (兼容旧配置)</option>
          <option value="sms">短信 (兼容旧配置)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">接收人</label>
        <div className="flex items-center gap-2">
          <User className="text-slate-400 w-4 h-4" />
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
            placeholder="请选择项目成员或团队部门"
            value={summarizeApprovalParticipants(participantRules) || config?.recipient || ''}
            readOnly
          />
          <button
            type="button"
            className="px-3 py-2 text-xs rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            onClick={openSelector}
            disabled={selectorLoading}
          >
            {selectorLoading ? '加载中...' : '选择'}
          </button>
        </div>
        {participantRules.length === 0 && config?.recipient && (
          <div className="mt-1 text-xs text-amber-600">
            当前为旧版接收人配置，保存前建议重新选择站内消息接收人。
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">消息标题</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          placeholder="流程通知"
          value={config?.title || ''}
          onChange={e => onConfigChange('title', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
          消息内容模板
        </label>
        <VariableTextArea
          value={config?.message || ''}
          onChange={value => onConfigChange('message', value)}
          placeholder="支持使用变量 {{payload.key}}"
          rows={4}
          scope="all"
        />
      </div>
      <OrgTargetSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        title="选择通知接收人"
        members={members}
        departments={departments}
        roles={roles}
        value={{
          users: selectedUsers.map((item: any) => ({
            id: String(item.sourceValue),
            name: item.sourceName || item.sourceLabel || String(item.sourceValue),
          })),
          departments: selectedDepartments.map((item: any) => ({
            id: String(item.sourceValue),
            name: item.sourceName || item.sourceLabel || String(item.sourceValue),
          })),
          departmentLeaders: selectedDepartmentLeaders.map((item: any) => ({
            id: String(item.sourceValue),
            name: item.sourceName || item.sourceLabel || String(item.sourceValue),
          })),
          projectRoles: selectedProjectRoles.map((item: any) => ({
            id: String(item.sourceValue),
            name: item.sourceName || item.sourceLabel || String(item.sourceValue),
          })),
          projectRoleOwners: selectedProjectRoleOwners.map((item: any) => ({
            id: String(item.sourceValue),
            name: item.sourceName || item.sourceLabel || String(item.sourceValue),
          })),
          deptLeader: hasDeptLeaderRule,
          directManager: hasDirectManagerRule,
        }}
        onConfirm={value => {
          syncParticipantRules(value)
          setSelectorOpen(false)
        }}
        allowDepartment
        allowDepartmentLeader
        allowUser
        allowProjectRole
        allowProjectRoleOwner
        allowDynamic
      />
    </div>
  )
}

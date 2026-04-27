import React from 'react'
import { Send, User } from 'lucide-react'
import { getRuntimeProjectId, getRuntimeTeamId } from '@ai-flow/utils/runtime'
import { orgApi, type WorkflowOrgDepartment, type WorkflowProjectMember } from '@ai-flow-src/api/org'
import OrgTargetSelector from './common/OrgTargetSelector'

interface CCConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
}

export const CCConfig: React.FC<CCConfigProps> = ({ config, onConfigChange }) => {
  const [selectorOpen, setSelectorOpen] = React.useState(false)
  const [departments, setDepartments] = React.useState<WorkflowOrgDepartment[]>([])
  const [members, setMembers] = React.useState<WorkflowProjectMember[]>([])
  const [selectorLoading, setSelectorLoading] = React.useState(false)
  const selectedUsers = Array.isArray(config?.recipientUsers) ? config.recipientUsers : []
  const selectedDepartments = Array.isArray(config?.recipientDepartments)
    ? config.recipientDepartments
    : []

  const loadOrgOptions = async () => {
    const teamId = getRuntimeTeamId()
    const projectId = getRuntimeProjectId()
    if (!teamId || !projectId) {
      setDepartments([])
      setMembers([])
      return
    }
    setSelectorLoading(true)
    try {
      const [nextDepartments, nextMembers] = await Promise.all([
        orgApi.getTeamDepartments(teamId),
        orgApi.getProjectMembers(teamId, projectId),
      ])
      setDepartments(nextDepartments)
      setMembers(nextMembers)
    } finally {
      setSelectorLoading(false)
    }
  }

  const openSelector = async () => {
    await loadOrgOptions()
    setSelectorOpen(true)
  }

  const handleRecipientConfirm = (value: {
    users: Array<{ id: string; name: string; departmentId?: string }>
    departments: Array<{ id: string; name: string }>
  }) => {
    onConfigChange('recipientUsers', value.users)
    onConfigChange('recipientDepartments', value.departments)
    onConfigChange(
      'recipients',
      [...value.users.map(item => item.name), ...value.departments.map(item => item.name)].join(', ')
    )
    onConfigChange(
      'recipient',
      [...value.users.map(item => item.name), ...value.departments.map(item => item.name)].join(', ')
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-2">
        <Send className="inline-block w-3 h-3 mr-1 text-indigo-600" />
        <span className="text-xs text-indigo-700">配置抄送人员和抄送方式</span>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
          <User size={12} className="text-indigo-500" />
          抄送人配置
        </label>
        <div className="flex items-center gap-2">
          <User className="text-slate-400 w-4 h-4" />
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
            placeholder="请选择项目成员或团队部门"
            value={config?.recipients || config?.recipient || ''}
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
        {(selectedUsers.length > 0 || selectedDepartments.length > 0) && (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-2">
            {selectedUsers.length > 0 && (
              <div>项目成员：{selectedUsers.map((item: any) => item?.name || item?.id).join('，')}</div>
            )}
            {selectedDepartments.length > 0 && (
              <div>团队部门：{selectedDepartments.map((item: any) => item?.name || item?.id).join('，')}</div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">抄送方式</label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
          value={config?.channel || 'email'}
          onChange={e => onConfigChange('channel', e.target.value)}
        >
          <option value="email">邮件 (Email)</option>
          <option value="slack">Slack / 飞书</option>
          <option value="sms">短信 (SMS)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">抄送时机</label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
          value={config?.timing || 'immediate'}
          onChange={e => onConfigChange('timing', e.target.value)}
        >
          <option value="immediate">立即抄送</option>
          <option value="after_approval">审批后抄送</option>
          <option value="on_failure">失败时抄送</option>
        </select>
      </div>

      <OrgTargetSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        title="选择抄送对象"
        members={members}
        departments={departments}
        value={{
          users: selectedUsers,
          departments: selectedDepartments,
        }}
        onConfirm={handleRecipientConfirm}
      />
    </div>
  )
}

import React, { useState } from 'react'
import { VariableTextArea } from './common'
import {
  CheckSquare,
  Users,
  Clock,
  Bell,
  FileText,
  User,
  LayoutGrid,
  Save,
} from 'lucide-react'
import { useWorkflowStore } from '../store/useWorkflowStore'
import { WorkflowNodeType } from '../types'
import type { WorkflowVariableGroup } from '../utils/workflowVariables'
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
import { getApprovalInputFields, type ApprovalFieldPermission } from './approvalInput'
import ApprovalFieldPermissionList, { type ApprovalFieldOption } from './ApprovalFieldPermissionList'
import ApprovalAutoApprovalConfig from './ApprovalAutoApprovalConfig'

interface ApprovalConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
  variables?: WorkflowVariableGroup[]
}

type TabKey = 'personnel' | 'approval' | 'buttons' | 'fields'

export const ApprovalConfig: React.FC<ApprovalConfigProps> = ({ config, onConfigChange, variables = [] }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('personnel')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [departments, setDepartments] = useState<WorkflowOrgDepartment[]>([])
  const [members, setMembers] = useState<WorkflowProjectMember[]>([])
  const [roles, setRoles] = useState<WorkflowProjectRole[]>([])
  const [selectorLoading, setSelectorLoading] = useState(false)

  // 按钮配置数据
  const buttonConfig = config?.buttonConfig || {
    save: true, submit: true, approve: true, reject: true, return: true,
    jump: true, addSign: true, print: true, transfer: true, copy: false,
  }

  // 从store获取全局数据
  const workflowStore = useWorkflowStore()
  const startNode = workflowStore.nodes.find(node => node.type === WorkflowNodeType.START)
  const startConfig = (startNode?.data.config || {}) as Record<string, any>

  // 提取兼容模拟数据的字段结构。Approval 模式优先使用开始节点的审批表数据入参。
  const extractFields = (obj: any, prefix: string = ''): ApprovalFieldOption[] => {
    const fields: ApprovalFieldOption[] = []

    if (typeof obj !== 'object' || obj === null) {
      return fields
    }

    Object.entries(obj).forEach(([key, value]) => {
      const fieldKey = prefix ? `${prefix}_${key}` : key
      const fieldLabel = prefix ? `${prefix} ${key}` : key

      fields.push({ key: fieldKey, label: fieldLabel, source: 'devInput' })

      // 递归提取嵌套对象的字段
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        fields.push(...extractFields(value, fieldKey))
      }
    })

    return fields
  }

  const approvalInputFields = getApprovalInputFields(startConfig.approvalInputConfig)
  let globalFields: ApprovalFieldOption[] = approvalInputFields.map(field => ({
    key: field.variableName || field.fieldId,
    label: field.label || field.fieldName || field.fieldId,
    required: field.required,
    source: 'approvalInput',
  }))
  const usingApprovalInputFields = globalFields.length > 0

  try {
    if (globalFields.length === 0 && startConfig.devInput) {
      const globalData = JSON.parse(startConfig.devInput)
      globalFields = extractFields(globalData)
    }
  } catch (e) {
    console.error('Failed to parse global data:', e)
  }

  // 初始化字段配置。开始节点只定义入参和必填，审批节点显式配置读写/隐藏权限。
  const initialFieldConfig: Record<string, ApprovalFieldPermission> = {}
  globalFields.forEach(field => {
    initialFieldConfig[field.key] = 'readonly'
  })

  // 字段配置数据
  const fieldConfig = {
    ...initialFieldConfig,
    ...(config?.fieldConfig || {}),
  }
  const autoApproval = config?.autoApproval || {}
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

  const updateParticipantRules = (nextRules: ApprovalParticipantRule[]) => {
    onConfigChange('participantRules', nextRules)
    onConfigChange('approver', summarizeApprovalParticipants(nextRules))
  }

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
    updateParticipantRules(buildSelectorParticipantRules(value))
  }

  const handleButtonChange = (buttonName: keyof typeof buttonConfig) => {
    onConfigChange('buttonConfig', {
      ...buttonConfig,
      [buttonName]: !buttonConfig[buttonName],
    })
  }

  const handleFieldChange = (fieldName: string, value: 'editable' | 'readonly' | 'hidden') => {
    onConfigChange('fieldConfig', {
      ...fieldConfig,
      [fieldName]: value,
    })
  }

  const updateAutoApproval = (patch: Record<string, any>) => {
    onConfigChange('autoApproval', {
      enabled: false,
      fallback: 'manual',
      ...autoApproval,
      ...patch,
    })
  }

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
        <CheckSquare className="inline-block w-3 h-3 mr-1 text-blue-600" />
        <span className="text-xs text-blue-700">配置审批规则、审批人和通知设置</span>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-slate-200 relative w-full">
        <nav className="flex space-x-4 w-full">
          {[
            { key: 'personnel' as TabKey, label: '人员配置', icon: Users },
            { key: 'approval' as TabKey, label: '审批配置', icon: CheckSquare },
            { key: 'buttons' as TabKey, label: '按钮配置', icon: CheckSquare },
            { key: 'fields' as TabKey, label: '字段配置', icon: LayoutGrid },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="space-y-5">
        {/* 人员配置 */}
        {activeTab === 'personnel' && (
          <div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <Users size={12} className="text-blue-500" />
                审批人配置
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="请选择项目成员或团队部门"
                    value={config?.approver || selectedUsers.map((item: any) => item?.sourceName).join(', ')}
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
                {participantRules.length > 0 && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-2">
                    {selectedUsers.length > 0 && (
                      <div>项目成员：{selectedUsers.map((item: any) => item?.sourceName || item?.sourceValue).join('，')}</div>
                    )}
                    {selectedDepartments.length > 0 && (
                      <div>团队部门成员：{selectedDepartments.map((item: any) => item?.sourceName || item?.sourceValue).join('，')}</div>
                    )}
                    {selectedDepartmentLeaders.length > 0 && (
                      <div>部门负责人：{selectedDepartmentLeaders.map((item: any) => item?.sourceName || item?.sourceValue).join('，')}</div>
                    )}
                    {selectedProjectRoles.length > 0 && (
                      <div>项目角色成员：{selectedProjectRoles.map((item: any) => item?.sourceName || item?.sourceValue).join('，')}</div>
                    )}
                    {selectedProjectRoleOwners.length > 0 && (
                      <div>角色负责人：{selectedProjectRoleOwners.map((item: any) => item?.sourceName || item?.sourceValue).join('，')}</div>
                    )}
                    {hasDeptLeaderRule && <div>动态负责人：发起人部门负责人</div>}
                    {hasDirectManagerRule && <div>动态负责人：直属上级</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 审批配置 */}
        {activeTab === 'approval' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <CheckSquare size={12} className="text-blue-500" />
                审批规则
              </label>
              <div className="space-y-3">
                {/* 审批方式 */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">审批方式</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    value={config?.approvalType || 'single'}
                    onChange={e => onConfigChange('approvalType', e.target.value)}
                  >
                    <option value="single">单人审批</option>
                    <option value="parallel">并行审批</option>
                    <option value="serial">串行审批</option>
                  </select>
                </div>

                {/* 审批策略 */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">审批策略</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    value={config?.approvalStrategy || 'all'}
                    onChange={e => onConfigChange('approvalStrategy', e.target.value)}
                  >
                    <option value="all">全部通过</option>
                    <option value="any">任意通过</option>
                    <option value="majority">多数通过</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 超时设置 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <Clock size={12} className="text-blue-500" />
                超时设置
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="时长"
                    value={config?.timeout || 24}
                    onChange={e => onConfigChange('timeout', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    value={config?.timeoutUnit || 'hours'}
                    onChange={e => onConfigChange('timeoutUnit', e.target.value)}
                  >
                    <option value="hours">小时</option>
                    <option value="days">天</option>
                    <option value="minutes">分钟</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 通知设置 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <Bell size={12} className="text-blue-500" />
                通知设置
              </label>
              <div className="space-y-3">
                {/* 审批通知 */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-600">发送审批通知</label>
                  <div
                    onClick={() =>
                      onConfigChange('sendApprovalNotice', !config?.sendApprovalNotice)
                    }
                    className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${config?.sendApprovalNotice !== false ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config?.sendApprovalNotice !== false ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </div>
                </div>

                {/* 超时通知 */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-600">发送超时通知</label>
                  <div
                    onClick={() => onConfigChange('sendTimeoutNotice', !config?.sendTimeoutNotice)}
                    className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${config?.sendTimeoutNotice !== false ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config?.sendTimeoutNotice !== false ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </div>
                </div>

                {/* 通知接收人 */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    通知接收人
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="e.g. requester, admin@example.com"
                    value={config?.noticeRecipient || ''}
                    onChange={e => onConfigChange('noticeRecipient', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 审批表单配置 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <FileText size={12} className="text-blue-500" />
                审批表单配置
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">表单标题</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="e.g. 费用审批单"
                    value={config?.formTitle || ''}
                    onChange={e => onConfigChange('formTitle', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">表单描述</label>
                  <VariableTextArea
                    value={config?.formDescription || ''}
                    onChange={value => onConfigChange('formDescription', value)}
                    placeholder="审批表单的描述信息"
                    rows={2}
                    scope="all"
                  />
                </div>
              </div>
            </div>

            <ApprovalAutoApprovalConfig
              autoApproval={autoApproval}
              onChange={updateAutoApproval}
              variables={variables}
            />
          </div>
        )}

        {/* 按钮配置 */}
        {activeTab === 'buttons' && (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <CheckSquare size={12} className="text-blue-500" />
                参与者可以看见或操作哪些按钮
              </label>
            </div>

            <div className="space-y-3">
              {[
                { key: 'save' as const, label: '保存', icon: Save },
                { key: 'submit' as const, label: '提交', icon: CheckSquare },
                {
                  key: 'approve' as const,
                  label: '同意',
                  icon: CheckSquare,
                  color: 'text-green-500',
                },
                { key: 'reject' as const, label: '拒绝', icon: CheckSquare, color: 'text-red-500' },
                { key: 'return' as const, label: '退回', icon: CheckSquare },
                { key: 'jump' as const, label: '跳转', icon: CheckSquare },
                { key: 'addSign' as const, label: '加签', icon: CheckSquare },
                { key: 'print' as const, label: '打印', icon: CheckSquare },
                { key: 'transfer' as const, label: '转办', icon: CheckSquare },
                { key: 'copy' as const, label: '抄送', icon: CheckSquare },
              ].map(button => (
                <div key={button.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`button-${button.key}`}
                      checked={buttonConfig[button.key]}
                      onChange={() => handleButtonChange(button.key)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                    />
                    <label
                      htmlFor={`button-${button.key}`}
                      className="text-sm text-slate-700 flex items-center gap-1"
                    >
                      <button.icon size={16} className={button.color || 'text-slate-400'} />
                      {button.label}
                    </label>
                  </div>
                  <div className="text-xs text-slate-500">
                    {buttonConfig[button.key] ? '2/10' : '0/10'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <CheckSquare size={12} className="text-blue-500" />
                自定义跳转按钮
              </label>
              <div className="text-xs text-slate-500 py-2 bg-slate-50 rounded border border-slate-200">
                暂无自定义跳转按钮配置
              </div>
            </div>
          </div>
        )}

        {/* 字段配置 */}
        {activeTab === 'fields' && (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <LayoutGrid size={12} className="text-blue-500" />
                参与者可以看见或操作哪些字段
              </label>
              <p className="text-xs text-slate-500 mt-1">字段来源于开始节点的审批表数据入参。</p>
            </div>

            <ApprovalFieldPermissionList
              fields={globalFields}
              fieldConfig={fieldConfig}
              usingApprovalInputFields={usingApprovalInputFields}
              onFieldChange={handleFieldChange}
            />
          </div>
        )}
      </div>

      <OrgTargetSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        title="选择审批参与者"
        members={members}
        departments={departments}
        roles={roles}
        allowDepartmentLeader
        allowProjectRole
        allowProjectRoleOwner
        allowDynamic
        value={{
          users: selectedUsers.map((item: any) => ({
            id: String(item?.sourceValue),
            name: item?.sourceName || item?.sourceLabel || String(item?.sourceValue),
          })),
          departments: selectedDepartments.map((item: any) => ({
            id: String(item?.sourceValue),
            name: item?.sourceName || item?.sourceLabel || String(item?.sourceValue),
          })),
          departmentLeaders: selectedDepartmentLeaders.map((item: any) => ({
            id: String(item?.sourceValue),
            name: item?.sourceName || item?.sourceLabel || String(item?.sourceValue),
          })),
          projectRoles: selectedProjectRoles.map((item: any) => ({
            id: String(item?.sourceValue),
            name: item?.sourceName || item?.sourceLabel || String(item?.sourceValue),
          })),
          projectRoleOwners: selectedProjectRoleOwners.map((item: any) => ({
            id: String(item?.sourceValue),
            name: item?.sourceName || item?.sourceLabel || String(item?.sourceValue),
          })),
          deptLeader: hasDeptLeaderRule,
          directManager: hasDirectManagerRule,
        }}
        onConfirm={syncParticipantRules}
      />
    </div>
  )
}

import React from 'react'
import type { ApprovalFieldPermission } from './approvalInput'

export type ApprovalFieldOption = {
  key: string
  label: string
  permission?: ApprovalFieldPermission
  required?: boolean
  source: 'approvalInput' | 'devInput'
}

interface ApprovalFieldPermissionListProps {
  fields: ApprovalFieldOption[]
  fieldConfig: Record<string, ApprovalFieldPermission>
  usingApprovalInputFields: boolean
  onFieldChange: (fieldName: string, value: ApprovalFieldPermission) => void
}

const ApprovalFieldPermissionList: React.FC<ApprovalFieldPermissionListProps> = ({
  fields,
  fieldConfig,
  usingApprovalInputFields,
  onFieldChange,
}) => {
  if (fields.length === 0) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-700">
        请先在开始节点配置“审批表数据入参”，选择当前项目下的数据表和要传递的字段。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!usingApprovalInputFields && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          当前字段来自 Dev Input 兼容数据，建议改用“审批表数据入参”。
        </div>
      )}
      {fields.map(field => (
        <div key={field.key} className="flex items-center justify-between">
          <label className="text-sm text-slate-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-4">
            {(['editable', 'readonly', 'hidden'] as ApprovalFieldPermission[]).map(permission => (
              <label key={permission} className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="radio"
                  name={`field-${field.key}`}
                  value={permission}
                  checked={fieldConfig[field.key] === permission}
                  onChange={() => onFieldChange(field.key, permission)}
                  className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                {permission === 'editable' ? '可编辑' : permission === 'readonly' ? '只读' : '隐藏'}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ApprovalFieldPermissionList

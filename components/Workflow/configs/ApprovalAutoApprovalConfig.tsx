import React from 'react'
import { Activity } from 'lucide-react'
import type { WorkflowVariableGroup } from '../utils/workflowVariables'
import { VariableTextArea } from './common'
import LLMConfig from './LLMConfig'

interface ApprovalAutoApprovalConfigProps {
  autoApproval: Record<string, any>
  onChange: (patch: Record<string, any>) => void
  variables?: WorkflowVariableGroup[]
}

export const ApprovalAutoApprovalConfig: React.FC<ApprovalAutoApprovalConfigProps> = ({
  autoApproval,
  onChange,
  variables = [],
}) => {
  const update = (key: string, value: any) => onChange({ [key]: value })
  const patch = (patchValue: Record<string, any>) => onChange(patchValue)

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
        <Activity size={12} className="text-violet-500" />
        AI 自动审批
      </label>
      <div className="space-y-3 rounded-md border border-violet-100 bg-violet-50/60 p-3">
        <label className="flex items-center justify-between text-xs text-slate-700">
          <span>启动 AI 自动审批</span>
          <input
            type="checkbox"
            checked={Boolean(autoApproval.enabled)}
            onChange={event => onChange({ enabled: event.target.checked, fallback: 'manual' })}
            className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500 border-slate-300"
          />
        </label>

        {autoApproval.enabled && (
          <div className="space-y-4">
            <LLMConfig
              config={autoApproval}
              onConfigChange={update}
              onConfigPatch={patch}
              variables={variables}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                自动通过规则
              </label>
              <VariableTextArea
                rows={3}
                value={autoApproval.approveRules || ''}
                onChange={value => update('approveRules', value)}
                placeholder="例如：金额低于 500 元、票据齐全、未命中风险规则时自动通过"
                scope="all"
                plainTextMode
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                自动驳回规则
              </label>
              <VariableTextArea
                rows={3}
                value={autoApproval.rejectRules || ''}
                onChange={value => update('rejectRules', value)}
                placeholder="例如：票据缺失、金额超出禁止阈值、命中黑名单规则时自动驳回"
                scope="all"
                plainTextMode
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                人工审批兜底规则
              </label>
              <VariableTextArea
                rows={3}
                value={autoApproval.manualRules || ''}
                onChange={value => update('manualRules', value)}
                placeholder="例如：信息不足、风险边界不清、置信度不足时转人工审批"
                scope="all"
                plainTextMode
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                补充提示词
              </label>
              <VariableTextArea
                rows={3}
                value={autoApproval.userPrompt || ''}
                onChange={value => update('userPrompt', value)}
                placeholder="补充 AI 判断时需要关注的审批背景"
                scope="all"
                plainTextMode
              />
            </div>

            <div className="text-xs text-slate-500">
              只识别 自动通过、自动驳回、人工审批；缺值、非法值或模型异常固定转人工审批。
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApprovalAutoApprovalConfig

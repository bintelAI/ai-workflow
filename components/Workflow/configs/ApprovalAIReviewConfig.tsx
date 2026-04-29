import React from 'react'
import LLMConfig from './LLMConfig'
import { VariableTextArea } from './common'
import type { FlowField } from '@ai-flow/src/types/flow'

interface ApprovalAIReviewConfigProps {
  config: Record<string, any>
  onConfigChange: (key: string, value: any) => void
  onConfigPatch?: (patch: Record<string, any>) => void
  variables?: Array<{
    id: string
    type?: string
    label?: string
    params: FlowField[]
  }>
}

export const ApprovalAIReviewConfig: React.FC<ApprovalAIReviewConfigProps> = ({
  config,
  onConfigChange,
  onConfigPatch,
  variables = [],
}) => {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-700">
        AI 审批评估只输出三态决策，审批节点负责读取结果并执行自动通过、自动驳回或人工审批。
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
            自动通过规则
          </label>
          <VariableTextArea
            rows={3}
            value={config.approveRules || ''}
            onChange={value => onConfigChange('approveRules', value)}
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
            value={config.rejectRules || ''}
            onChange={value => onConfigChange('rejectRules', value)}
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
            value={config.manualRules || ''}
            onChange={value => onConfigChange('manualRules', value)}
            placeholder="例如：信息不足、风险边界不清、置信度不足时转人工审批"
            scope="all"
            plainTextMode
          />
        </div>
      </div>

      <LLMConfig
        config={config}
        onConfigChange={onConfigChange}
        onConfigPatch={onConfigPatch}
        variables={variables}
      />
    </div>
  )
}

export default ApprovalAIReviewConfig

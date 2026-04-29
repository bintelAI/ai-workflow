import React, { useMemo } from 'react'
import { Activity, Link2 } from 'lucide-react'
import type { WorkflowVariableGroup, WorkflowVariableMeta } from '../utils/workflowVariables'
import VariableSelector from './common/VariableSelector'

interface ApprovalAutoApprovalConfigProps {
  autoApproval: Record<string, any>
  onChange: (patch: Record<string, any>) => void
  variables?: WorkflowVariableGroup[]
}

interface ApprovalAIReviewSource {
  id: string
  label: string
  decision?: WorkflowVariableMeta
  reason?: WorkflowVariableMeta
}

const findVariable = (group: WorkflowVariableGroup, name: string) => {
  return group.variables.find(item => item.name === name || item.path.endsWith(`.${name}`))
}

const getSelectorValue = (value?: string) => value || ''

export const ApprovalAutoApprovalConfig: React.FC<ApprovalAutoApprovalConfigProps> = ({
  autoApproval,
  onChange,
  variables = [],
}) => {
  const approvalAIReviewSources = useMemo<ApprovalAIReviewSource[]>(() => {
    return variables
      .filter(group => group.type === 'approval_ai_review')
      .map(group => ({
        id: group.id,
        label: group.label || group.id,
        decision: findVariable(group, 'approvalDecision'),
        reason: findVariable(group, 'reason'),
      }))
      .filter(source => source.decision)
  }, [variables])

  const importReviewResult = (source: ApprovalAIReviewSource) => {
    if (!source.decision?.template) return
    onChange({
      enabled: true,
      decisionVariable: source.decision.template,
      reasonVariable: source.reason?.template || '',
    })
  }

  const handleVariableChange = (key: 'decisionVariable' | 'reasonVariable') => (data: {
    value?: string
    template?: string
    refPath?: string
  }) => {
    onChange({ [key]: data.template || data.value || (data.refPath ? `{{${data.refPath}}}` : '') })
  }

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
        <Activity size={12} className="text-violet-500" />
        AI 自动审批
      </label>
      <div className="space-y-3 rounded-md border border-violet-100 bg-violet-50/60 p-3">
        <label className="flex items-center justify-between text-xs text-slate-700">
          <span>启用 AI 自动审批</span>
          <input
            type="checkbox"
            checked={Boolean(autoApproval.enabled)}
            onChange={event => onChange({ enabled: event.target.checked })}
            className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500 border-slate-300"
          />
        </label>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">上游 AI 审批评估</label>
          {approvalAIReviewSources.length > 0 ? (
            <div className="space-y-2">
              {approvalAIReviewSources.map(source => (
                <div
                  key={source.id}
                  className="rounded-md border border-violet-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-700 truncate">
                        {source.label}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500 break-all">
                        {source.decision?.template}
                      </div>
                      {source.reason?.template && (
                        <div className="mt-1 font-mono text-[11px] text-slate-400 break-all">
                          {source.reason.template}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-700 hover:bg-violet-100"
                      onClick={() => importReviewResult(source)}
                    >
                      <Link2 size={12} />
                      引入 AI 审批评估结果
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-violet-200 bg-white px-3 py-2 text-xs text-slate-500">
              请先在当前审批节点前连接 AI 审批评估节点，再引入审批决策。
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">决策值来源</label>
          <VariableSelector
            value={getSelectorValue(autoApproval.decisionVariable)}
            customValue={getSelectorValue(autoApproval.decisionVariable)}
            variables={variables}
            placeholder="选择 approvalDecision 输出"
            inputable
            onChange={handleVariableChange('decisionVariable')}
            onClear={() => onChange({ decisionVariable: '' })}
            disabled={!autoApproval.enabled}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">审批意见来源</label>
          <VariableSelector
            value={getSelectorValue(autoApproval.reasonVariable)}
            customValue={getSelectorValue(autoApproval.reasonVariable)}
            variables={variables}
            placeholder="选择 reason 输出"
            inputable
            onChange={handleVariableChange('reasonVariable')}
            onClear={() => onChange({ reasonVariable: '' })}
            disabled={!autoApproval.enabled}
          />
        </div>

        <div className="text-xs text-slate-500">
          只识别 自动通过、自动驳回、人工审批；缺值或非法值固定转人工审批。
        </div>
      </div>
    </div>
  )
}

export default ApprovalAutoApprovalConfig

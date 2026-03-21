import React from 'react'
import { Activity, AlertTriangle, Bug, CheckCircle2, Eye, Lightbulb } from 'lucide-react'
import type { TimelineLogView } from './types'

const getNodeSuggestion = (log: TimelineLogView) => {
  switch (log.nodeType) {
    case 'api_call':
      return '检查目标 API 地址、请求方法、请求头和鉴权信息，重点确认超时、返回码和响应体结构是否符合预期。'
    case 'approval':
      return '检查审批人配置、审批条件和阈值判断，确认输入参数是否命中了错误的审批分支。'
    case 'llm':
      return '检查提示词模板、模型参数和上游变量映射，确认输入上下文是否缺失或格式不正确。'
    case 'condition':
      return '检查条件表达式和分支变量来源，确认字段类型、空值情况和比较逻辑是否正确。'
    case 'json_parse':
    case 'smart_parse':
      return '检查待解析内容是否满足结构要求，确认 schema、选择器或解析目标字段与实际输入一致。'
    case 'knowledge_retrieval':
      return '检查知识库 ID、检索关键词和召回数量，确认上游传入的查询文本非空且命中范围正确。'
    case 'variable':
      return '检查变量处理节点中的输入字段、代码逻辑和输出字段名，确认没有覆盖或遗漏关键字段。'
    case 'script':
      return '检查脚本执行逻辑、入参结构和返回对象格式，确认脚本没有抛出运行时异常。'
    case 'flow_call':
      return '检查被调用流程的输入输出定义、流程标签和参数映射，确认子流程返回结构与当前节点预期一致。'
    default:
      return '检查该节点的输入参数映射、输出字段结构以及与上游节点的变量引用关系是否正确。'
  }
}

interface DataDrawerInsightsProps {
  hasFailure: boolean
  timelineLogs: TimelineLogView[]
  handleViewNode: (nodeId: string) => void
}

export const DataDrawerInsights: React.FC<DataDrawerInsightsProps> = ({
  hasFailure,
  timelineLogs,
  handleViewNode,
}) => {
  const nodeTimelineLogs = timelineLogs.filter(log => !['debug', 'flow'].includes(log.nodeType))
  const failedLogs = nodeTimelineLogs.filter(l => l.status === 'failed')
  const slowLogs = nodeTimelineLogs.filter(l => l.duration > 300)

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={`bg-white rounded-xl p-4 shadow-sm border flex gap-4 ${hasFailure ? 'border-red-100' : 'border-slate-200'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${hasFailure ? 'bg-gradient-to-br from-red-500 to-orange-600 shadow-red-200' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'}`}>
            {hasFailure ? <Bug size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
              AI 全局诊断报告
              {hasFailure ? (
                <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full border border-red-200">发现异常</span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">运行正常</span>
              )}
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              {hasFailure
                ? `本次运行共 ${nodeTimelineLogs.length} 个节点步骤，其中 ${failedLogs.length} 个节点发生异常。你可以直接定位到对应节点，结合节点输入输出继续排查。`
                : `基于本次 ${nodeTimelineLogs.length} 个节点步骤的运行结果，流程整体健康度较高，未发现阻断性错误。`}
            </p>
          </div>
        </div>

        {failedLogs.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" /> 故障根因分析
            </h4>
            <div className="space-y-3">
              {failedLogs.map((log, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                      <span className="text-xs font-bold text-slate-700">{log.nodeLabel}</span>
                      <span className="text-[10px] text-slate-400">({log.nodeType})</span>
                    </div>
                    <button
                      onClick={() => handleViewNode(log.nodeId)}
                      className="text-indigo-600 hover:text-indigo-800 text-[10px] flex items-center gap-1 hover:underline"
                    >
                      <Eye size={12} /> 定位节点
                    </button>
                  </div>
                  <div className="text-[10px] text-red-700 font-mono ml-3.5 bg-white/50 p-2 rounded border border-red-100/50">
                    {log.errorMessage || 'Unknown Error'}
                  </div>
                  <div className="grid grid-cols-3 gap-2 ml-3.5">
                    <div className="rounded-lg border border-slate-200 bg-white/70 p-2">
                      <div className="text-[10px] font-semibold text-slate-500 mb-1">输入摘要</div>
                      <div className="text-[10px] text-slate-600 leading-relaxed">{log.inputSummary || '无数据'}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white/70 p-2">
                      <div className="text-[10px] font-semibold text-slate-500 mb-1">输出摘要</div>
                      <div className="text-[10px] text-slate-600 leading-relaxed">{log.outputSummary || '无数据'}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white/70 p-2">
                      <div className="text-[10px] font-semibold text-slate-500 mb-1">错误摘要</div>
                      <div className="text-[10px] text-red-600 leading-relaxed">{log.errorMessage || '无'}</div>
                    </div>
                  </div>
                  <div className="ml-3.5 flex items-start gap-1.5">
                    <Lightbulb size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-600">
                      <strong>AI 建议：</strong>
                      {getNodeSuggestion(log)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" /> 性能优化建议
            </h4>
            <ul className="space-y-2">
              {slowLogs
                .slice(0, 3)
                .map((l, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 text-xs text-slate-600 bg-slate-50 p-2 rounded hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                      <span>节点 "{l.nodeLabel}" 耗时较长 ({l.duration}ms)。</span>
                    </div>
                  </li>
                ))}
              {slowLogs.length === 0 && (
                <li className="text-xs text-slate-500 italic">暂无明显的性能瓶颈。</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> 执行耗时分布
            </h4>
            <div className="h-24 flex items-end justify-between gap-1 px-2">
              {nodeTimelineLogs.map((log, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={`w-full rounded-t transition-colors ${log.status === 'failed' ? 'bg-red-400 hover:bg-red-500' : 'bg-indigo-200 hover:bg-indigo-400'}`}
                    style={{ height: `${Math.min(log.duration / 5, 100)}%` }}
                  ></div>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {log.nodeLabel}: {log.duration}ms
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

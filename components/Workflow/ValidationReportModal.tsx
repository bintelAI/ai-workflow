import React, { useState } from 'react'
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Lightbulb,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export interface ValidationError {
  id: string
  type: 'error' | 'warning' | 'info'
  category: 'node_config' | 'connection' | 'workflow' | 'variable'
  nodeId?: string
  nodeLabel?: string
  message: string
  suggestion?: string
  fixAction?: () => void
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  summary: {
    totalNodes: number
    totalEdges: number
    errorCount: number
    warningCount: number
    infoCount: number
  }
}

const TYPE_META = {
  error: {
    icon: <XCircle size={18} className="text-red-500" />,
    sectionClassName: 'bg-red-50 border-red-200',
    itemClassName: 'bg-white border-red-100',
    headerHoverClassName: 'hover:bg-red-100/50',
    titleClassName: 'text-red-800',
    subTitleClassName: 'text-red-600',
    iconClassName: 'text-red-500',
    suggestionClassName: 'text-xs text-slate-600 bg-amber-50 p-2 rounded border border-amber-100',
    suggestionIconClassName: 'text-amber-500',
    title: '错误',
    subTitle: '必须修复才能运行',
    suggestionLabel: '修复建议：',
  },
  warning: {
    icon: <AlertTriangle size={18} className="text-amber-500" />,
    sectionClassName: 'bg-amber-50 border-amber-200',
    itemClassName: 'bg-white border-amber-100',
    headerHoverClassName: 'hover:bg-amber-100/50',
    titleClassName: 'text-amber-800',
    subTitleClassName: 'text-amber-600',
    iconClassName: 'text-amber-500',
    suggestionClassName: 'text-xs text-slate-600 bg-amber-50 p-2 rounded border border-amber-100',
    suggestionIconClassName: 'text-amber-500',
    title: '警告',
    subTitle: '建议修复以避免运行偏差',
    suggestionLabel: '修复建议：',
  },
  info: {
    icon: <Info size={18} className="text-blue-500" />,
    sectionClassName: 'bg-blue-50 border-blue-200',
    itemClassName: 'bg-white border-blue-100',
    headerHoverClassName: 'hover:bg-blue-100/50',
    titleClassName: 'text-blue-800',
    subTitleClassName: 'text-blue-600',
    iconClassName: 'text-blue-500',
    suggestionClassName: 'text-xs text-slate-600 bg-blue-50 p-2 rounded border border-blue-100',
    suggestionIconClassName: 'text-blue-500',
    title: '提示',
    subTitle: '当前节点玩法说明',
    suggestionLabel: '说明：',
  },
} as const

interface ValidationReportModalProps {
  isOpen: boolean
  onClose: () => void
  result: ValidationResult | null
}

const ValidationReportModal: React.FC<ValidationReportModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['errors', 'warnings'])
  )

  if (!isOpen || !result) return null

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const errors = result.errors.filter(e => e.type === 'error')
  const warnings = result.errors.filter(e => e.type === 'warning')
  const infos = result.errors.filter(e => e.type === 'info')

  const sections = [
    { key: 'errors', items: errors, type: 'error' as const },
    { key: 'warnings', items: warnings, type: 'warning' as const },
    { key: 'infos', items: infos, type: 'info' as const },
  ].filter(section => section.items.length > 0)

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'node_config':
        return '节点配置'
      case 'connection':
        return '连接关系'
      case 'workflow':
        return '工作流结构'
      case 'variable':
        return '变量引用'
      default:
        return '其他'
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[85vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${result.isValid ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {result.isValid ? (
                <ShieldCheck size={20} className="text-emerald-600" />
              ) : (
                <AlertCircle size={20} className="text-red-600" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">工作流验证报告</h2>
              <p className="text-xs text-slate-500">
                {result.isValid
                  ? '验证通过，当前工作流结构与节点配置可用于保存或运行'
                  : '以下结果已按当前节点玩法、分支句柄与变量作用域重新校验'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <ShieldCheck size={16} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">节点总数</div>
                <div className="font-bold text-slate-800">{result.summary.totalNodes}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <ArrowRight size={16} className="text-slate-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">连接总数</div>
                <div className="font-bold text-slate-800">{result.summary.totalEdges}</div>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle size={16} className="text-red-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">错误</div>
                <div
                  className={`font-bold ${result.summary.errorCount > 0 ? 'text-red-600' : 'text-slate-800'}`}
                >
                  {result.summary.errorCount}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">警告</div>
                <div
                  className={`font-bold ${result.summary.warningCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}
                >
                  {result.summary.warningCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errors.length === 0 && warnings.length === 0 && infos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">验证通过</h3>
              <p className="text-sm text-slate-500 max-w-md">
                工作流配置已通过前端校验，未发现结构、连接、变量引用或节点配置问题。
              </p>
            </div>
          ) : (
            <>
              {sections.map(section => {
                const meta = TYPE_META[section.type]

                return (
                  <div
                    key={section.key}
                    className={`${meta.sectionClassName} rounded-lg border overflow-hidden`}
                  >
                    <button
                      onClick={() => toggleSection(section.key)}
                      className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${meta.headerHoverClassName}`}
                    >
                      <div className="flex items-center gap-2">
                        {meta.icon}
                        <span className={`font-semibold ${meta.titleClassName}`}>
                          {meta.title} ({section.items.length})
                        </span>
                        <span className={`text-xs ${meta.subTitleClassName}`}>{meta.subTitle}</span>
                      </div>
                      {expandedSections.has(section.key) ? (
                        <ChevronUp size={18} className={meta.iconClassName} />
                      ) : (
                        <ChevronDown size={18} className={meta.iconClassName} />
                      )}
                    </button>
                    {expandedSections.has(section.key) && (
                      <div className="px-4 pb-4 space-y-3">
                        {section.items.map(item => (
                          <div
                            key={item.id}
                            className={`${meta.itemClassName} rounded-lg p-4 border`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                {meta.icon}
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {getCategoryLabel(item.category)}
                                </span>
                              </div>
                              {item.nodeLabel && (
                                <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                  {item.nodeLabel}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-800 font-medium mb-2">{item.message}</p>
                            {item.suggestion && (
                              <div className={`flex items-start gap-2 ${meta.suggestionClassName}`}>
                                <Lightbulb
                                  size={14}
                                  className={`${meta.suggestionIconClassName} mt-0.5 shrink-0`}
                                />
                                <span>
                                  <strong>{meta.suggestionLabel}</strong>
                                  {item.suggestion}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-slate-200 flex items-center justify-end gap-3 px-6 shrink-0 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            关闭
          </button>
          {result.isValid && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              继续运行
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ValidationReportModal

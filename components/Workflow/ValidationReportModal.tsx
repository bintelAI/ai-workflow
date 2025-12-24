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

  const getIconForType = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle size={18} className="text-red-500" />
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500" />
      case 'info':
        return <Info size={18} className="text-blue-500" />
      default:
        return <Info size={18} className="text-slate-400" />
    }
  }

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
                {result.isValid ? '验证通过，工作流配置完整' : '发现配置问题，请根据建议进行修复'}
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
                工作流配置完整，未发现任何问题。您可以放心保存或运行此工作流。
              </p>
            </div>
          ) : (
            <>
              {/* Errors Section */}
              {errors.length > 0 && (
                <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection('errors')}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle size={18} className="text-red-500" />
                      <span className="font-semibold text-red-800">错误 ({errors.length})</span>
                      <span className="text-xs text-red-600">必须修复才能运行</span>
                    </div>
                    {expandedSections.has('errors') ? (
                      <ChevronUp size={18} className="text-red-500" />
                    ) : (
                      <ChevronDown size={18} className="text-red-500" />
                    )}
                  </button>
                  {expandedSections.has('errors') && (
                    <div className="px-4 pb-4 space-y-3">
                      {errors.map(error => (
                        <div
                          key={error.id}
                          className="bg-white rounded-lg p-4 border border-red-100"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {getIconForType(error.type)}
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {getCategoryLabel(error.category)}
                              </span>
                            </div>
                            {error.nodeLabel && (
                              <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {error.nodeLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-800 font-medium mb-2">{error.message}</p>
                          {error.suggestion && (
                            <div className="flex items-start gap-2 text-xs text-slate-600 bg-amber-50 p-2 rounded border border-amber-100">
                              <Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                              <span>
                                <strong>修复建议：</strong>
                                {error.suggestion}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Warnings Section */}
              {warnings.length > 0 && (
                <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection('warnings')}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-500" />
                      <span className="font-semibold text-amber-800">警告 ({warnings.length})</span>
                      <span className="text-xs text-amber-600">建议修复以优化体验</span>
                    </div>
                    {expandedSections.has('warnings') ? (
                      <ChevronUp size={18} className="text-amber-500" />
                    ) : (
                      <ChevronDown size={18} className="text-amber-500" />
                    )}
                  </button>
                  {expandedSections.has('warnings') && (
                    <div className="px-4 pb-4 space-y-3">
                      {warnings.map(warning => (
                        <div
                          key={warning.id}
                          className="bg-white rounded-lg p-4 border border-amber-100"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {getIconForType(warning.type)}
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {getCategoryLabel(warning.category)}
                              </span>
                            </div>
                            {warning.nodeLabel && (
                              <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {warning.nodeLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-800 font-medium mb-2">
                            {warning.message}
                          </p>
                          {warning.suggestion && (
                            <div className="flex items-start gap-2 text-xs text-slate-600 bg-amber-50 p-2 rounded border border-amber-100">
                              <Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                              <span>
                                <strong>修复建议：</strong>
                                {warning.suggestion}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info Section */}
              {infos.length > 0 && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection('infos')}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Info size={18} className="text-blue-500" />
                      <span className="font-semibold text-blue-800">提示 ({infos.length})</span>
                      <span className="text-xs text-blue-600">优化建议</span>
                    </div>
                    {expandedSections.has('infos') ? (
                      <ChevronUp size={18} className="text-blue-500" />
                    ) : (
                      <ChevronDown size={18} className="text-blue-500" />
                    )}
                  </button>
                  {expandedSections.has('infos') && (
                    <div className="px-4 pb-4 space-y-3">
                      {infos.map(info => (
                        <div
                          key={info.id}
                          className="bg-white rounded-lg p-4 border border-blue-100"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {getIconForType(info.type)}
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {getCategoryLabel(info.category)}
                              </span>
                            </div>
                            {info.nodeLabel && (
                              <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {info.nodeLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-800 font-medium mb-2">{info.message}</p>
                          {info.suggestion && (
                            <div className="flex items-start gap-2 text-xs text-slate-600 bg-blue-50 p-2 rounded border border-blue-100">
                              <Lightbulb size={14} className="text-blue-500 mt-0.5 shrink-0" />
                              <span>
                                <strong>优化建议：</strong>
                                {info.suggestion}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

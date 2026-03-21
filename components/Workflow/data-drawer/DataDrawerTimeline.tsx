import React from 'react'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Code,
  Copy,
  Info,
} from 'lucide-react'
import type { TimelineLogView } from './types'

interface DataDrawerTimelineProps {
  timelineLogs: TimelineLogView[]
  selectedLog?: TimelineLogView
  selectedLogId: string | null
  setSelectedLogId: (id: string) => void
  isStarting: boolean
  onCopy: (value: any) => void
}

export const DataDrawerTimeline: React.FC<DataDrawerTimelineProps> = ({
  timelineLogs,
  selectedLog,
  selectedLogId,
  setSelectedLogId,
  isStarting,
  onCopy,
}) => {
  return (
    <>
      <div className="w-1/4 border-r border-slate-200 overflow-y-auto bg-white p-2">
        {timelineLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            {isStarting ? <Loader2 size={24} className="mb-2 opacity-50 animate-spin" /> : <Activity size={24} className="mb-2 opacity-50" />}
            <p className="text-xs">{isStarting ? '正在建立调试会话...' : '暂无数据，请运行调试或模拟'}</p>
          </div>
        ) : (
          <div className="relative pl-3 space-y-2 before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {timelineLogs.map(log => (
              <div
                key={log.id}
                onClick={() => setSelectedLogId(log.id)}
                className={`relative cursor-pointer group pl-6 transition-colors rounded-lg p-2 -ml-2 ${selectedLogId === log.id ? 'bg-indigo-50 ring-1 ring-indigo-200' : log.status === 'failed' ? 'bg-red-50/80 hover:bg-red-50' : 'hover:bg-slate-50'}`}
              >
                <div
                  className={`absolute left-[5px] top-3.5 w-2.5 h-2.5 rounded-full border-2 bg-white z-10 ${log.status === 'success' ? 'border-emerald-500' : log.status === 'failed' ? 'border-red-500' : log.status === 'info' ? 'border-sky-500' : 'border-indigo-500'}`}
                ></div>
                <div className="flex items-center justify-between mb-0.5 gap-2">
                  <span className={`font-medium text-xs truncate max-w-[120px] ${log.status === 'failed' ? 'text-red-600' : 'text-slate-800'}`}>
                    {log.nodeLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestampText}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className={`flex items-center gap-0.5 ${log.status === 'success' ? 'text-emerald-600' : log.status === 'failed' ? 'text-red-600' : log.status === 'info' ? 'text-sky-600' : 'text-indigo-600'}`}>
                    {log.status === 'success' ? (
                      <CheckCircle2 size={10} />
                    ) : log.status === 'failed' ? (
                      <XCircle size={10} />
                    ) : log.status === 'info' ? (
                      <Info size={10} />
                    ) : (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                    {log.status === 'success'
                      ? '输出完成'
                      : log.status === 'failed'
                        ? '输出异常'
                        : log.status === 'info'
                          ? '日志'
                          : '处理中'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{log.duration}ms</span>
                </div>
                <div className="mt-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 space-y-1">
                  <div className="text-[10px] text-slate-500 leading-relaxed">
                    <span className="font-medium text-slate-600">输入：</span>
                    {log.inputSummary || '无数据'}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-relaxed">
                    <span className="font-medium text-slate-600">输出：</span>
                    {log.outputSummary || '无数据'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 bg-slate-50 p-3 overflow-hidden flex gap-3">
        {selectedLog ? (
          <>
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden h-full">
              <div className="h-8 border-b border-slate-100 flex items-center justify-between px-3 gap-2 bg-slate-50/50 text-xs font-semibold text-slate-600 shrink-0">
                <div className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-indigo-500" /> 输入数据 (Input)
                </div>
                <button onClick={() => onCopy(selectedLog.input)} className="text-slate-400 hover:text-indigo-600">
                  <Copy size={12} />
                </button>
              </div>
              <div className="flex-1 p-3 overflow-auto space-y-3">
                {selectedLog.diffGroups && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 space-y-2">
                    <div className="text-[11px] font-semibold text-amber-700">输入输出差异</div>
                    {selectedLog.diffGroups.notes && selectedLog.diffGroups.notes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedLog.diffGroups.notes.map((item, index) => (
                          <span key={`${item}_${index}`} className="rounded-full bg-white px-2 py-1 text-[10px] text-amber-700 border border-amber-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded border border-emerald-200 bg-white p-2">
                        <div className="text-[10px] font-semibold text-emerald-700 mb-1">新增字段</div>
                        <div className="text-[10px] text-slate-600 leading-relaxed">
                          {selectedLog.diffGroups.added && selectedLog.diffGroups.added.length > 0
                            ? selectedLog.diffGroups.added.join('、')
                            : '无'}
                        </div>
                      </div>
                      <div className="rounded border border-rose-200 bg-white p-2">
                        <div className="text-[10px] font-semibold text-rose-700 mb-1">缺失字段</div>
                        <div className="text-[10px] text-slate-600 leading-relaxed">
                          {selectedLog.diffGroups.removed && selectedLog.diffGroups.removed.length > 0
                            ? selectedLog.diffGroups.removed.join('、')
                            : '无'}
                        </div>
                      </div>
                      <div className="rounded border border-indigo-200 bg-white p-2">
                        <div className="text-[10px] font-semibold text-indigo-700 mb-1">变更字段</div>
                        <div className="text-[10px] text-slate-600 leading-relaxed">
                          {selectedLog.diffGroups.changed && selectedLog.diffGroups.changed.length > 0
                            ? selectedLog.diffGroups.changed.join('、')
                            : '无'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {selectedLog.diffSummary && selectedLog.diffSummary.length > 0 && false && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                    <div className="mb-1 text-[11px] font-semibold text-amber-700">输入输出差异</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.diffSummary.map((item, index) => (
                        <span key={`${item}_${index}`} className="rounded-full bg-white px-2 py-1 text-[10px] text-amber-700 border border-amber-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-words">
                  {JSON.stringify(selectedLog.input, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden h-full">
              <div className="h-8 border-b border-slate-100 flex items-center justify-between px-3 gap-2 bg-slate-50/50 text-xs font-semibold text-slate-600 shrink-0">
                <div className="flex items-center gap-2">
                  <Code
                    size={14}
                    className={selectedLog.status === 'success' ? 'text-emerald-500' : selectedLog.status === 'failed' ? 'text-red-500' : 'text-indigo-500'}
                  />
                  {selectedLog.status === 'failed' ? '错误详情 (Error Detail)' : '输出结果 (Output)'}
                </div>
                <button
                  onClick={() => onCopy(selectedLog.errorMessage ? { error: selectedLog.errorMessage, output: selectedLog.output } : selectedLog.output)}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <Copy size={12} />
                </button>
              </div>
              <div className="flex-1 p-3 overflow-auto space-y-3">
                {(selectedLog.content || '').length > 0 && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-slate-500">流式内容</div>
                    <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-words">
                      {selectedLog.content}
                    </pre>
                  </div>
                )}
                {selectedLog.toolCalls && selectedLog.toolCalls.length > 0 && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-slate-500">工具调用</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.toolCalls.map((toolCall: any, index: number) => (
                        <span key={`${toolCall.name}_${index}`} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
                          {toolCall.type === 'start' ? '开始' : '结束'}：{toolCall.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <pre className={`text-xs font-mono whitespace-pre-wrap break-words ${selectedLog.status === 'failed' ? 'text-red-600' : 'text-slate-600'}`}>
                  {selectedLog.errorMessage
                    ? JSON.stringify({ error: selectedLog.errorMessage, output: selectedLog.output }, null, 2)
                    : JSON.stringify(selectedLog.output, null, 2)}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <p>选择左侧步骤查看详情</p>
          </div>
        )}
      </div>
    </>
  )
}

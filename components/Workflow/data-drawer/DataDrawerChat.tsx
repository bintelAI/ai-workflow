import React from 'react'
import { MessageSquare, SlidersHorizontal } from 'lucide-react'

interface DataDrawerChatProps {
  currentSessionId: string | null
  flowLabel?: string
  chatInputMode: 'form' | 'text'
  setChatInputMode: (mode: 'form' | 'text') => void
  startNodeVariables: any[]
  renderChatVariableCard: (variable: any, index: number) => React.ReactNode
  chatPayloadPreview: string
  chatMessages: Array<{ id: string; role: string; content: string }>
  isStarting: boolean
  chatQuery: string
  setChatQuery: (value: string) => void
  chatSending: boolean
  handleChatSend: () => void
}

export const DataDrawerChat: React.FC<DataDrawerChatProps> = ({
  currentSessionId,
  flowLabel,
  chatInputMode,
  setChatInputMode,
  startNodeVariables,
  renderChatVariableCard,
  chatPayloadPreview,
  chatMessages,
  isStarting,
  chatQuery,
  setChatQuery,
  chatSending,
  handleChatSend,
}) => {
  return (
    <div className="flex-1 p-4 bg-slate-50 overflow-hidden flex flex-col gap-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">
        当前会话：{currentSessionId || '未生成'}
        {flowLabel ? ` · flow: ${flowLabel}` : ''}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-[11px] font-semibold text-slate-600">会话输入模式</div>
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setChatInputMode('form')}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${chatInputMode === 'form' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="inline-flex items-center gap-1">
              <SlidersHorizontal size={12} /> 可视化
            </span>
          </button>
          <button
            type="button"
            onClick={() => setChatInputMode('text')}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${chatInputMode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={12} /> 纯文本
            </span>
          </button>
        </div>
      </div>

      {chatInputMode === 'form' && startNodeVariables.length > 0 && (
        <div className="grid max-h-64 grid-cols-[1.1fr_0.9fr] gap-3 overflow-hidden">
          <div className="overflow-auto rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 text-xs font-semibold text-slate-600">开始节点参数</div>
            <div className="grid grid-cols-2 gap-3">
              {startNodeVariables.map((variable: any, index: number) => renderChatVariableCard(variable, index))}
            </div>
          </div>
          <div className="overflow-auto rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 text-xs font-semibold text-slate-600">即将发送参数预览</div>
            <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-words">
              {chatPayloadPreview}
            </pre>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white p-3 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
            {isStarting ? '正在建立调试会话，请稍候...' : '当前会话暂无消息，输入内容后可继续调试。'}
          </div>
        ) : (
          chatMessages.map(messageItem => (
            <div
              key={messageItem.id}
              className={`rounded-lg border px-3 py-2 text-sm ${messageItem.role === 'user' ? 'border-indigo-200 bg-indigo-50 ml-8' : 'border-slate-200 bg-white mr-8'}`}
            >
              <div className="mb-1 text-[11px] text-slate-500">
                {messageItem.role === 'user' ? '用户输入' : '调试输出'}
              </div>
              <pre className="whitespace-pre-wrap break-words text-xs text-slate-700">
                {messageItem.content}
              </pre>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={chatQuery}
          onChange={e => setChatQuery(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
          placeholder={chatInputMode === 'form' ? '输入本轮测试说明或主消息内容...' : '输入内容，继续当前调试会话...'}
        />
        <button
          onClick={handleChatSend}
          disabled={!chatQuery.trim() || chatSending || !flowLabel || !currentSessionId}
          className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {chatSending ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  )
}

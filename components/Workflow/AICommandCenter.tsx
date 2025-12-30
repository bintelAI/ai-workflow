import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, ArrowRight, Loader2, Command, X, Bot } from 'lucide-react'
import { useWorkflowStore } from './store/useWorkflowStore'

export const AICommandCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const { generateWorkflowFromPrompt, isAIGenerating } = useWorkflowStore()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isAIGenerating) return
    
    try {
      await generateWorkflowFromPrompt(prompt)
      setPrompt('')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to generate workflow:', error)
      // Error is handled by store, but we keep window open so user knows it failed
    }
  }

  const suggestions = [
    '创建包含经理审批和飞书通知的报销流程',
    '当金额大于5000时进入高级审批，否则直接结束',
    '使用 LLM 对输入的客户投诉进行情感分析并分类',
    '每天定时调用 API 获取天气数据并发送邮件通知',
    '构建一个并行处理流程：同步执行数据清洗和备份',
    '新员工入职：自动开通账号、分配导师并发送通知',
    '创建一个带有 5 秒延迟的自动化回访流程',
    '实现一个循环 10 次的批量数据处理工作流',
  ]

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {/* Popup Window */}
      {isOpen && (
        <div className="w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200 origin-bottom-right">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
              <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Bot size={16} />
              </div>
              <span className="text-sm">AI 灵感助手</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 relative">
            {/* Loading Overlay */}
            {isAIGenerating && (
              <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center gap-3 text-indigo-600 font-medium animate-in fade-in rounded-b-2xl">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-xs animate-pulse">正在构建工作流...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="描述您想要的工作流..."
                disabled={isAIGenerating}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-24 text-sm leading-relaxed disabled:opacity-50"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isAIGenerating}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-sm"
              >
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles size={10} />
                推荐指令
              </p>
              <div className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => !isAIGenerating && setPrompt(s)}
                    disabled={isAIGenerating}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100 truncate disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
            h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50
            ${
              isOpen
                ? 'bg-slate-800 text-white rotate-90 hover:bg-slate-700'
                : 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white hover:scale-110 hover:shadow-indigo-500/30'
            }
        `}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>
    </div>
  )
}

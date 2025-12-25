import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  PlayCircle,
  StopCircle,
  CheckSquare,
  GitFork,
  Globe,
  Bell,
  Clock,
  Database,
  Code,
  Send,
  GripVertical,
  GitMerge,
  Bot,
  Repeat,
  Download,
  Upload,
  BookOpen,
  FileText,
  Smartphone,
  HardDrive,
  Search,
  X,
} from 'lucide-react'
import { useReactFlow } from 'reactflow'
import { WorkflowNodeType } from './types'
import { useWorkflowStore } from './store/useWorkflowStore'
import { SidebarProps } from './Workflow.types'

const DraggableNode = ({
  type,
  label,
  icon: Icon,
  color,
}: {
  type: WorkflowNodeType
  label: string
  icon: any
  color: string
}) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const getNodeBgColor = (type: WorkflowNodeType): string => {
    switch (type) {
      case WorkflowNodeType.START:
        return 'bg-emerald-50 border-emerald-100'
      case WorkflowNodeType.END:
        return 'bg-rose-50 border-rose-100'
      case WorkflowNodeType.CONDITION:
        return 'bg-amber-50 border-amber-100'
      case WorkflowNodeType.PARALLEL:
        return 'bg-teal-50 border-teal-100'
      case WorkflowNodeType.APPROVAL:
        return 'bg-blue-50 border-blue-100'
      case WorkflowNodeType.CC:
        return 'bg-indigo-50 border-indigo-100'
      case WorkflowNodeType.DELAY:
        return 'bg-yellow-50 border-yellow-100'
      case WorkflowNodeType.LOOP:
        return 'bg-purple-50 border-purple-100'
      case WorkflowNodeType.API_CALL:
        return 'bg-blue-50 border-blue-100'
      case WorkflowNodeType.NOTIFICATION:
        return 'bg-orange-50 border-orange-100'
      case WorkflowNodeType.DATA_OP:
        return 'bg-cyan-50 border-cyan-100'
      case WorkflowNodeType.SCRIPT:
        return 'bg-slate-50 border-slate-200'
      case WorkflowNodeType.LLM:
        return 'bg-fuchsia-50 border-fuchsia-100'
      case WorkflowNodeType.SQL:
        return 'bg-indigo-50 border-indigo-100'
      case WorkflowNodeType.KNOWLEDGE_RETRIEVAL:
        return 'bg-sky-50 border-sky-100'
      case WorkflowNodeType.DOCUMENT_EXTRACTOR:
        return 'bg-amber-50 border-amber-100'
      case WorkflowNodeType.CLOUD_PHONE:
        return 'bg-green-50 border-green-100'
      default:
        return 'bg-slate-50 border-slate-100'
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:shadow-md hover:border-indigo-300 transition-all active:cursor-grabbing group aspect-square"
      onDragStart={event => onDragStart(event, type)}
      draggable
    >
      <div
        className={`p-2.5 rounded-lg border transition-transform group-hover:scale-110 ${getNodeBgColor(type)}`}
      >
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const [width, setWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const sidebarRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { getViewport, setViewport } = useReactFlow()

  // Get store data for filtering
  const { categories, activeCategoryId, nodes, edges, setWorkflow, globalVariables } = useWorkflowStore()
  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const allowedNodes = new Set(
    (!activeCategory?.allowedNodeTypes || activeCategory.allowedNodeTypes.length === 0)
      ? Object.values(WorkflowNodeType)
      : activeCategory.allowedNodeTypes
  )

  // Node metadata for search
  const nodeMetadata: Record<WorkflowNodeType, { label: string; icon: any; color: string }> = {
    [WorkflowNodeType.START]: { label: '开始', icon: PlayCircle, color: 'text-emerald-500' },
    [WorkflowNodeType.END]: { label: '结束', icon: StopCircle, color: 'text-rose-500' },
    [WorkflowNodeType.CONDITION]: { label: '条件分支', icon: GitFork, color: 'text-amber-500' },
    [WorkflowNodeType.PARALLEL]: { label: '并行分支', icon: GitMerge, color: 'text-teal-500' },
    [WorkflowNodeType.APPROVAL]: { label: '审批节点', icon: CheckSquare, color: 'text-blue-500' },
    [WorkflowNodeType.CC]: { label: '抄送节点', icon: Send, color: 'text-indigo-500' },
    [WorkflowNodeType.DELAY]: { label: '延时等待', icon: Clock, color: 'text-yellow-500' },
    [WorkflowNodeType.LOOP]: { label: '循环迭代', icon: Repeat, color: 'text-indigo-600' },
    [WorkflowNodeType.API_CALL]: { label: 'API 调用', icon: Send, color: 'text-blue-500' },
    [WorkflowNodeType.NOTIFICATION]: { label: '消息通知', icon: Bell, color: 'text-orange-500' },
    [WorkflowNodeType.DATA_OP]: { label: '数据操作', icon: Database, color: 'text-cyan-500' },
    [WorkflowNodeType.SCRIPT]: { label: '脚本代码', icon: Code, color: 'text-slate-600' },
    [WorkflowNodeType.LLM]: { label: 'AI 模型', icon: Bot, color: 'text-fuchsia-500' },
    [WorkflowNodeType.SQL]: { label: 'SQL 执行', icon: Database, color: 'text-indigo-500' },
    [WorkflowNodeType.KNOWLEDGE_RETRIEVAL]: { label: '知识库检索', icon: BookOpen, color: 'text-sky-600' },
    [WorkflowNodeType.DOCUMENT_EXTRACTOR]: { label: '文档提取器', icon: FileText, color: 'text-amber-600' },
    [WorkflowNodeType.CLOUD_PHONE]: { label: '云手机控制', icon: Smartphone, color: 'text-green-500' },
    [WorkflowNodeType.STORAGE]: { label: '文件存储', icon: HardDrive, color: 'text-emerald-500' },
  }

  const handleExport = () => {
    const data = {
      nodes,
      edges,
      categories,
      activeCategoryId,
      globalVariables,
      viewport: getViewport(),
      exportedAt: new Date().toISOString(),
      version: '1.4',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workflow-export-${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        if (data.nodes && data.edges) {
          setWorkflow(data.nodes, data.edges, data.activeCategoryId, data.categories, data.globalVariables)

          if (data.viewport) {
            setTimeout(() => {
              setViewport(data.viewport, { duration: 800 })
            }, 100)
          }

          alert('工作流导入成功！')
        } else {
          alert('无效的工作流文件格式')
        }
      } catch (err) {
        console.error('Import failed:', err)
        alert('导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
    // Reset input
    event.target.value = ''
  }

  const startResizing = useCallback(() => {
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX
        if (newWidth > 180 && newWidth < 480) {
          setWidth(newWidth)
        }
      }
    },
    [isResizing]
  )

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  // Helper to render only if allowed
  const RenderNode: React.FC<{
    type: WorkflowNodeType
    label: string
    icon: any
    color: string
  }> = ({ type, label, icon, color }) => {
    if (!allowedNodes.has(type)) return null
    return <DraggableNode type={type} label={label} icon={icon} color={color} />
  }

  // Helper to check if a node matches search query
  const nodeMatchesSearch = (type: WorkflowNodeType): boolean => {
    if (!searchQuery.trim()) return true
    const metadata = nodeMetadata[type]
    return metadata?.label.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  }

  // Helper to check if a group has any visible children
  const hasVisibleNodes = (types: WorkflowNodeType[]) => {
    return types.some(t => allowedNodes.has(t) && nodeMatchesSearch(t))
  }

  // Get filtered nodes for a group
  const getFilteredNodes = (types: WorkflowNodeType[]) => {
    return types.filter(t => allowedNodes.has(t) && nodeMatchesSearch(t))
  }

  return (
    <aside
      ref={sidebarRef}
      className="bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 relative group"
      style={{ width: width }}
    >
      <div className="p-5 border-b border-slate-200 bg-white">
        <h2 className="font-bold text-slate-800">节点库</h2>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-500">拖拽节点到画布</p>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[100px]">
            {activeCategory?.name || 'General'}
          </span>
        </div>
        
        {/* Search Box */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索节点..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Basic Nodes Group */}
        {hasVisibleNodes([WorkflowNodeType.START, WorkflowNodeType.END]) && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              基础节点
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {getFilteredNodes([WorkflowNodeType.START, WorkflowNodeType.END]).map(type => {
                const metadata = nodeMetadata[type]
                return (
                  <RenderNode
                    key={type}
                    type={type}
                    label={metadata.label}
                    icon={metadata.icon}
                    color={metadata.color}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Logic Nodes Group */}
        {hasVisibleNodes([
          WorkflowNodeType.CONDITION,
          WorkflowNodeType.PARALLEL,
          WorkflowNodeType.APPROVAL,
          WorkflowNodeType.CC,
          WorkflowNodeType.DELAY,
          WorkflowNodeType.LOOP,
        ]) && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              逻辑控制
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {getFilteredNodes([
                WorkflowNodeType.LOOP,
                WorkflowNodeType.CONDITION,
                WorkflowNodeType.PARALLEL,
                WorkflowNodeType.APPROVAL,
                WorkflowNodeType.CC,
                WorkflowNodeType.DELAY,
              ]).map(type => {
                const metadata = nodeMetadata[type]
                return (
                  <RenderNode
                    key={type}
                    type={type}
                    label={metadata.label}
                    icon={metadata.icon}
                    color={metadata.color}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Automation Nodes Group */}
        {hasVisibleNodes([
          WorkflowNodeType.API_CALL,
          WorkflowNodeType.NOTIFICATION,
          WorkflowNodeType.DATA_OP,
          WorkflowNodeType.SCRIPT,
          WorkflowNodeType.LLM,
          WorkflowNodeType.SQL,
          WorkflowNodeType.KNOWLEDGE_RETRIEVAL,
          WorkflowNodeType.DOCUMENT_EXTRACTOR,
        ]) && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              自动化节点
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {getFilteredNodes([
                WorkflowNodeType.LLM,
                WorkflowNodeType.KNOWLEDGE_RETRIEVAL,
                WorkflowNodeType.DOCUMENT_EXTRACTOR,
                WorkflowNodeType.API_CALL,
                WorkflowNodeType.SQL,
                WorkflowNodeType.DATA_OP,
                WorkflowNodeType.SCRIPT,
                WorkflowNodeType.NOTIFICATION,
              ]).map(type => {
                const metadata = nodeMetadata[type]
                return (
                  <RenderNode
                    key={type}
                    type={type}
                    label={metadata.label}
                    icon={metadata.icon}
                    color={metadata.color}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Industry Nodes Group */}
        {hasVisibleNodes([WorkflowNodeType.CLOUD_PHONE, WorkflowNodeType.STORAGE]) && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              行业节点
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {getFilteredNodes([WorkflowNodeType.CLOUD_PHONE, WorkflowNodeType.STORAGE]).map(type => {
                const metadata = nodeMetadata[type]
                return (
                  <RenderNode
                    key={type}
                    type={type}
                    label={metadata.label}
                    icon={metadata.icon}
                    color={metadata.color}
                  />
                )
              })}
            </div>
          </div>
        )}

        {!hasVisibleNodes(Object.values(WorkflowNodeType)) && (
          <div className="text-center p-4 text-slate-400 text-xs">
            {searchQuery ? '未找到匹配的节点' : '当前模式未配置任何可用节点'}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2">
          <button
            onClick={handleImportClick}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            导入
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            导出
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />
      </div>

      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100"
        onMouseDown={startResizing}
      ></div>
    </aside>
  )
}

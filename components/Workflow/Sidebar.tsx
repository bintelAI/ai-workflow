import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Download,
  Upload,
  Search,
  X,
} from 'lucide-react'
import { useReactFlow } from 'reactflow'
import { WorkflowNodeType } from './types'
import { useWorkflowStore } from './store/useWorkflowStore'
import { SidebarProps } from './Workflow.types'
import { getDefaultCategoriesFromPluginModes } from './config/pluginModeRegistry'
import { NODE_GROUP_LABELS, getRegistryItems } from './config/nodeRegistry'

const DraggableNode = ({
  type,
  label,
  icon: Icon,
  color,
  bgClass,
}: {
  type: WorkflowNodeType
  label: string
  icon: any
  color: string
  bgClass: string
}) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const getNodeBgColor = (bgClass: string): string => bgClass

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:shadow-md hover:border-indigo-300 transition-all active:cursor-grabbing group aspect-square"
      onDragStart={event => onDragStart(event, type)}
      draggable
    >
      <div
        className={`p-2.5 rounded-lg border transition-transform group-hover:scale-110 ${getNodeBgColor(bgClass)}`}
      >
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ pluginType = 'all' }) => {
  const [width, setWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const sidebarRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { getViewport, setViewport } = useReactFlow()

  // Get store data for filtering
  const { categories, activeCategoryId, nodes, edges, setWorkflow, globalVariables } = useWorkflowStore()
  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const effectiveAllowedNodes = activeCategoryId === 'general'
    ? Object.values(WorkflowNodeType)
    : activeCategory?.allowedNodeTypes || []
  const allowedNodes = new Set(effectiveAllowedNodes)

  const registryItems = getRegistryItems()

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
          setWorkflow(
            data.nodes,
            data.edges,
            data.activeCategoryId,
            data.categories || getDefaultCategoriesFromPluginModes(),
            data.globalVariables
          )

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
    bgClass: string
  }> = ({ type, label, icon, color, bgClass }) => {
    if (!allowedNodes.has(type)) return null
    return <DraggableNode type={type} label={label} icon={icon} color={color} bgClass={bgClass} />
  }

  // Helper to check if a node matches search query
  const nodeMatchesSearch = (type: WorkflowNodeType): boolean => {
    if (!searchQuery.trim()) return true
    const metadata = registryItems.find(item => item.type === type)
    return metadata?.label.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  }

  const groupedRegistryItems = Object.entries(NODE_GROUP_LABELS).map(([group, label]) => ({
    group,
    label,
    items: registryItems.filter(
      item => item.group === group && allowedNodes.has(item.type) && nodeMatchesSearch(item.type)
    ),
  }))

  const helperText =
    pluginType === 'approval'
      ? '拖拽审批节点到画布，编排审批、抄送、条件与通知流程'
      : pluginType === 'automation'
        ? '拖拽自动化节点到画布，编排接口、数据、脚本与通知流程'
      : pluginType === 'ai'
        ? '拖拽 AI 节点到画布，编排模型、数据与工具调用流程'
        : '拖拽节点到画布'


  return (
    <aside
      ref={sidebarRef}
      className="bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 relative group"
      style={{ width: width }}
    >
      <div className="p-5 border-b border-slate-200 bg-white">
        <h2 className="font-bold text-slate-800">节点库</h2>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-500">{helperText}</p>
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
        {groupedRegistryItems.map(({ group, label, items }) => {
          if (items.length === 0) return null
          return (
            <div className="mb-6" key={group}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {label}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {items.map(item => (
                  <RenderNode
                    key={item.type}
                    type={item.type}
                    label={item.shortLabel || item.label}
                    icon={item.icon}
                    color={item.color}
                    bgClass={item.bgClass}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {groupedRegistryItems.every(group => group.items.length === 0) && (
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

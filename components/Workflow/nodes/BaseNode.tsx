import React, { useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow'
import {
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { WorkflowNodeType, NodeData, LayoutDirection } from '../types'
import { useWorkflowStore } from '../store/useWorkflowStore'
import { getNodeMeta } from '../config/nodeRegistry'

export const getNodeIcon = (type: string) => {
  const meta = getNodeMeta(type as WorkflowNodeType)
  const Icon = meta?.icon
  return Icon ? <Icon className={`w-5 h-5 ${meta.color}`} /> : null
}

export const getNodeTypeLabel = (type: string) => {
  return getNodeMeta(type as WorkflowNodeType)?.label || '未知节点'
}

export const getNodeIconBgColor = (type: string) => {
  return getNodeMeta(type as WorkflowNodeType)?.bgClass || 'bg-slate-50 border-slate-100'
}

export const getNodeColor = (type: string, selected: boolean, executionStatus?: string) => {
  // Priority: Execution Status > Selection > Default
  if (executionStatus === 'success')
    return 'ring-2 ring-emerald-500 border-emerald-500 shadow-md shadow-emerald-100 bg-emerald-50/10'
  if (executionStatus === 'failed')
    return 'ring-2 ring-rose-500 border-rose-500 shadow-md shadow-rose-100 bg-rose-50/10'
  if (executionStatus === 'running') return 'ring-2 ring-blue-400 border-blue-400 animate-pulse'

  if (selected) return 'ring-2 ring-indigo-500 border-indigo-500 shadow-md'
  return 'border-slate-200 shadow-sm hover:shadow-md'
}

interface BaseNodeProps extends NodeProps<NodeData> {
  children?: React.ReactNode
  showInputHandle?: boolean
  showOutputHandle?: boolean
  showAddButton?: boolean
  customHandles?: React.ReactNode
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  data,
  type,
  selected,
  isConnectable,
  children,
  showInputHandle = true,
  showOutputHandle = true,
  showAddButton = true,
  customHandles,
}) => {
  const { openNodeAppendMenu, deleteNode, nodeExecutionStatus, categories, activeCategoryId } =
    useWorkflowStore()
  const { getNode } = useReactFlow()

  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const layoutDirection: LayoutDirection = activeCategory?.layoutDirection || 'vertical'
  const isHorizontal = layoutDirection === 'horizontal'

  const inputPosition = isHorizontal ? Position.Left : Position.Top
  const outputPosition = isHorizontal ? Position.Right : Position.Bottom

  // Get Execution Status from Global Store
  const status = nodeExecutionStatus ? nodeExecutionStatus[id] : undefined

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const onAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const node = getNode(id)
    if (!node) return

    // Calculate position for the menu (to the right of the plus button)
    const width = node.width || 200
    const height = node.height || 74

    const menuPos = {
      x: node.position.x + width / 2 + 20,
      y: node.position.y + height + 30,
    }

    openNodeAppendMenu(id, menuPos)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNode(id)
    setShowMenu(false)
  }

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  return (
    <div
      className={`
      relative min-w-[200px] bg-white rounded-lg border transition-all duration-200 group
      ${getNodeColor(type || '', !!selected, status)}
    `}
    >
      {/* Execution Badge */}
      {status === 'failed' && (
        <div className="absolute -top-3 -right-3 z-50 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in">
          Failed
        </div>
      )}

      {/* Input Handle (All except Start) */}
      {showInputHandle && (
        <Handle
          type="target"
          position={inputPosition}
          isConnectable={isConnectable}
          className={`!bg-slate-400 hover:!bg-indigo-500 !w-3 !h-3 z-10 ${
            isHorizontal ? '!-left-1.5 !top-1/2 !-translate-y-1/2' : '!-top-1.5 !left-1/2 !-translate-x-1/2'
          }`}
        />
      )}

      {/* Node Header */}
      <div className="flex items-center p-3 border-b border-slate-100 gap-3">
        <div
          className={`p-2 rounded-md border transition-colors ${
            status === 'success'
              ? 'bg-emerald-50 border-emerald-100'
              : getNodeIconBgColor(type || '')
          }`}
        >
          {getNodeIcon(type || '')}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm truncate">{data.label}</h3>
          <p className="text-xs text-slate-500 truncate">{getNodeTypeLabel(type || '')}</p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={12} />
                删除节点
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Node Body (Optional Content) */}
      {data.description && (
        <div className="p-3 bg-slate-50/50 rounded-b-lg">
          <p className="text-xs text-slate-500 line-clamp-2">{data.description}</p>
        </div>
      )}

      {children}

      {/* Standard Output Handle (Single) */}
      {showOutputHandle && !customHandles && (
        <Handle
          type="source"
          position={outputPosition}
          isConnectable={isConnectable}
          className={`!bg-slate-400 hover:!bg-indigo-500 !w-3 !h-3 z-10 ${
            isHorizontal
              ? '!-right-1.5 !top-1/2 !-translate-y-1/2'
              : '!-bottom-1.5 !left-1/2 !-translate-x-1/2'
          }`}
        />
      )}

      {/* Custom Handles */}
      {customHandles}

      {/* Add Button */}
      {showAddButton && !customHandles && (
        <div
          className={`absolute z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
            isHorizontal
              ? '-right-14 top-1/2 -translate-y-1/2'
              : '-bottom-14 left-1/2 -translate-x-1/2'
          }`}
        >
          {isHorizontal ? (
            <>
              <div className="w-8 h-px bg-gradient-to-r from-slate-300 to-transparent my-auto mr-[-4px]"></div>
              <button
                onClick={onAddClick}
                className="bg-indigo-600 text-white rounded-full p-1.5 shadow-md hover:scale-110 hover:bg-indigo-700 transition-all cursor-pointer border-2 border-white"
                title="追加节点"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </>
          ) : (
            <>
              <div className="h-8 w-px bg-gradient-to-b from-slate-300 to-transparent mx-auto mb-[-4px]"></div>
              <button
                onClick={onAddClick}
                className="bg-indigo-600 text-white rounded-full p-1.5 shadow-md hover:scale-110 hover:bg-indigo-700 transition-all cursor-pointer border-2 border-white"
                title="追加节点"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

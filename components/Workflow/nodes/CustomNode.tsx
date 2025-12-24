import React, { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow'
import {
  PlayCircle,
  StopCircle,
  CheckSquare,
  GitFork,
  Globe,
  Bell,
  MoreVertical,
  Clock, // For Delay
  Database, // For Data Op
  Code, // For Script
  Send, // For CC
  Plus, // Import Plus icon
  Trash2,
  GitMerge, // For Parallel
  Bot, // For LLM
} from 'lucide-react'
import { WorkflowNodeType, NodeData } from '../../../types'
import { useWorkflowStore } from '../store/useWorkflowStore'

const getNodeIcon = (type: string) => {
  switch (type) {
    case WorkflowNodeType.START:
      return <PlayCircle className="w-5 h-5 text-emerald-500" />
    case WorkflowNodeType.END:
      return <StopCircle className="w-5 h-5 text-rose-500" />
    case WorkflowNodeType.APPROVAL:
      return <CheckSquare className="w-5 h-5 text-blue-500" />
    case WorkflowNodeType.CC:
      return <Send className="w-5 h-5 text-indigo-500" />
    case WorkflowNodeType.CONDITION:
      return <GitFork className="w-5 h-5 text-amber-500" />
    case WorkflowNodeType.PARALLEL:
      return <GitMerge className="w-5 h-5 text-teal-500" />
    case WorkflowNodeType.API_CALL:
      return <Globe className="w-5 h-5 text-violet-500" />
    case WorkflowNodeType.NOTIFICATION:
      return <Bell className="w-5 h-5 text-orange-500" />
    case WorkflowNodeType.DELAY:
      return <Clock className="w-5 h-5 text-yellow-500" />
    case WorkflowNodeType.DATA_OP:
      return <Database className="w-5 h-5 text-cyan-500" />
    case WorkflowNodeType.SCRIPT:
      return <Code className="w-5 h-5 text-slate-700" />
    case WorkflowNodeType.LLM:
      return <Bot className="w-5 h-5 text-fuchsia-500" />
    default:
      return <CheckSquare className="w-5 h-5 text-gray-500" />
  }
}

const getNodeTypeLabel = (type: string) => {
  switch (type) {
    case WorkflowNodeType.START:
      return '开始节点'
    case WorkflowNodeType.END:
      return '结束节点'
    case WorkflowNodeType.APPROVAL:
      return '审批节点'
    case WorkflowNodeType.CC:
      return '抄送节点'
    case WorkflowNodeType.CONDITION:
      return '条件节点'
    case WorkflowNodeType.PARALLEL:
      return '并行节点'
    case WorkflowNodeType.API_CALL:
      return 'API 调用'
    case WorkflowNodeType.NOTIFICATION:
      return '消息通知'
    case WorkflowNodeType.DELAY:
      return '延时等待'
    case WorkflowNodeType.DATA_OP:
      return '数据操作'
    case WorkflowNodeType.SCRIPT:
      return '脚本代码'
    case WorkflowNodeType.LLM:
      return 'LLM 模型'
    default:
      return '未知节点'
  }
}

const getNodeColor = (type: string, selected: boolean, executionStatus?: string) => {
  // Priority: Execution Status > Selection > Default
  if (executionStatus === 'success')
    return 'ring-2 ring-emerald-500 border-emerald-500 shadow-md shadow-emerald-100 bg-emerald-50/10'
  if (executionStatus === 'failed')
    return 'ring-2 ring-rose-500 border-rose-500 shadow-md shadow-rose-100 bg-rose-50/10'
  if (executionStatus === 'running') return 'ring-2 ring-blue-400 border-blue-400 animate-pulse'

  if (selected) return 'ring-2 ring-indigo-500 border-indigo-500 shadow-md'
  return 'border-slate-200 shadow-sm hover:shadow-md'
}

const CustomNode = ({ id, data, type, selected, isConnectable }: NodeProps<NodeData>) => {
  const isStart = type === WorkflowNodeType.START
  const isEnd = type === WorkflowNodeType.END
  const isCondition = type === WorkflowNodeType.CONDITION
  const isParallel = type === WorkflowNodeType.PARALLEL

  const { openNodeAppendMenu, deleteNode, nodeExecutionStatus } = useWorkflowStore()
  const { getNode } = useReactFlow()

  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Safe defaults for parallel branches
  const config = data.config as any
  const parallelBranches =
    config?.branches && Array.isArray(config.branches) ? config.branches : ['Branch 1', 'Branch 2']

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
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-slate-400 hover:!bg-indigo-500 !w-3 !h-3 !-top-1.5 z-10"
        />
      )}

      {/* Node Header */}
      <div className="flex items-center p-3 border-b border-slate-100 gap-3">
        <div
          className={`p-2 rounded-md bg-slate-50 border border-slate-100 transition-colors ${status === 'success' ? 'bg-emerald-50 border-emerald-100' : ''}`}
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

      {/* Standard Output Handle (Single) */}
      {!isEnd && !isCondition && !isParallel && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!bg-slate-400 hover:!bg-indigo-500 !w-3 !h-3 !-bottom-1.5 z-10"
        />
      )}

      {/* Condition Node Handles (Yes/No) */}
      {isCondition && (
        <>
          {/* Yes / True Handle */}
          <div className="absolute -bottom-6 left-1/4 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-[10px] font-bold text-emerald-600 mb-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              是
            </span>
          </div>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="!bg-emerald-400 hover:!bg-emerald-600 !w-3 !h-3 !-bottom-1.5 z-10"
            style={{ left: '25%' }}
          />

          {/* No / False Handle */}
          <div className="absolute -bottom-6 left-3/4 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-[10px] font-bold text-rose-600 mb-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
              否
            </span>
          </div>
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="!bg-rose-400 hover:!bg-rose-600 !w-3 !h-3 !-bottom-1.5 z-10"
            style={{ left: '75%' }}
          />
        </>
      )}

      {/* Parallel Node Handles (Dynamic) */}
      {isParallel && (
        <div className="absolute -bottom-2 w-full flex justify-between px-1 pointer-events-none">
          {parallelBranches.map((branch: string, index: number) => {
            const count = parallelBranches.length
            const percent = ((index + 0.5) / count) * 100

            return (
              <div key={index} className="relative w-full h-0">
                {/* Label */}
                <div
                  className="absolute -top-4 -translate-x-1/2 flex flex-col items-center w-24 text-center z-10"
                  style={{ left: `${percent}%` }}
                >
                  <span className="text-[9px] font-medium text-teal-600 mb-1 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 truncate max-w-full block shadow-sm">
                    {branch}
                  </span>
                </div>
                {/* Handle - Needs pointer-events-auto and proper z-index */}
                <Handle
                  id={`branch-${index}`}
                  type="source"
                  position={Position.Bottom}
                  isConnectable={isConnectable}
                  className="!bg-teal-400 hover:!bg-teal-600 !w-3.5 !h-3.5 z-50 pointer-events-auto cursor-crosshair border-2 border-white"
                  style={{ left: `${percent}%`, bottom: '-8px' }}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Add Button (Bottom Center) */}
      {!isEnd && !isCondition && !isParallel && (
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="h-8 w-px bg-gradient-to-b from-slate-300 to-transparent mx-auto mb-[-4px]"></div>
          <button
            onClick={onAddClick}
            className="bg-indigo-600 text-white rounded-full p-1.5 shadow-md hover:scale-110 hover:bg-indigo-700 transition-all cursor-pointer border-2 border-white"
            title="追加节点"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(CustomNode)

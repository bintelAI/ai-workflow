import React, { memo, useCallback } from 'react'
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow'
import { Repeat, PlayCircle, StopCircle, Plus } from 'lucide-react'
import { NodeData } from '../../../types'
import { useWorkflowStore } from '../store/useWorkflowStore'

const LoopNode = ({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  const { nodeExecutionStatus, openNodeAppendMenu } = useWorkflowStore()
  const { project, screenToFlowPosition } = useReactFlow()
  const status = nodeExecutionStatus ? nodeExecutionStatus[id] : undefined

  const handleAddNode = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      // Get the exact position of the click in the flow coordinate system
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      // Position the new node relative to the loop start
      const newNodeRelativePosition = { x: 120, y: 30 }

      openNodeAppendMenu(
        null,
        { x: position.x + 20, y: position.y - 10 },
        id,
        newNodeRelativePosition
      )

      // Flag in state that we're adding from the loop-start handle
      useWorkflowStore.setState(state => ({
        nodeMenu: {
          ...state.nodeMenu,
          // We'll use a custom property to signal this is a loop-start connection
          // Since NodeMenuState is defined in types.ts, we should be careful.
          // However, we can use the sourceNodeId as null and parentNodeId as id
          // and our store logic will handle the edge creation.
        },
      }))
    },
    [id, openNodeAppendMenu]
  )

  const getNodeColor = (status?: string) => {
    if (status === 'success') return 'border-emerald-500 bg-emerald-50/30'
    if (status === 'failed') return 'border-rose-500 bg-rose-50/30'
    if (status === 'running') return 'border-blue-400 bg-blue-50/30'
    return 'border-indigo-200 bg-slate-50/50'
  }

  const config = data.config as any

  return (
    <div
      className={`
      relative min-w-[300px] min-h-[200px] rounded-xl border-2 border-dashed transition-all duration-200 group flex flex-col
      ${getNodeColor(status)}
      ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
    `}
      style={{ width: '100%', height: '100%' }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={300}
        minHeight={200}
        handleStyle={{ width: 8, height: 8, borderRadius: 4 }}
      />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="loop-input"
        isConnectable={isConnectable}
        className="!bg-indigo-500 !w-4 !h-4 !-top-2.5 z-50 border-2 border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-indigo-100/80 backdrop-blur-sm rounded-t-lg border-b border-indigo-200">
        <div className="p-1.5 bg-indigo-500 rounded text-white shadow-sm">
          <Repeat size={16} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-indigo-900">{data.label}</h3>
          <p className="text-[10px] text-indigo-700/70 truncate max-w-[200px]">
            {config?.targetArray ? `循环对象: ${config.targetArray}` : '请配置循环数组'}
          </p>
        </div>
        {/* Plus button in header for quick add */}
        <button
          onClick={handleAddNode}
          className="p-1.5 text-indigo-600 hover:bg-indigo-200 rounded-md transition-colors"
          title="在循环内添加节点"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Output Handle - Main flow exit (Primary Source Handle) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop-output"
        isConnectable={isConnectable}
        className="!bg-indigo-500 !w-4 !h-4 !-bottom-2.5 z-50 border-2 border-white"
      />

      {/* Body Area (Visual Guide) */}
      <div className="flex-1 relative p-4">
        <div className="absolute top-4 left-4 flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <div className="relative group/plus">
              {/* Internal Start Handle (Secondary Source Handle) */}
              <Handle
                type="source"
                position={Position.Right}
                id="loop-start"
                isConnectable={isConnectable}
                className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white !static !translate-y-0"
              />
              <button
                onClick={handleAddNode}
                className="absolute -inset-1 flex items-center justify-center bg-indigo-500 text-white rounded-full opacity-0 group-hover/plus:opacity-100 transition-opacity z-10"
              >
                <Plus size={10} strokeWidth={3} />
              </button>
              {/* Permanent Plus for Visibility */}
              <div className="absolute -inset-1 flex items-center justify-center bg-indigo-500 text-white rounded-full pointer-events-none shadow-sm">
                <Plus size={10} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-wider">
              Start
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium ml-1">循环内部起点</p>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-30 pointer-events-none">
          <span className="text-[10px] font-mono text-slate-500">Loop End</span>
          <StopCircle size={14} className="text-slate-500" />
        </div>

        {!config?.targetArray && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-indigo-300 font-medium">拖入节点至此区域</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(LoopNode)

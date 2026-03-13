import React, { memo, useCallback } from 'react'
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow'
import { Repeat, PlayCircle, StopCircle, Plus } from 'lucide-react'
import { NodeData, LayoutDirection } from '../types'
import { useWorkflowStore } from '../store/useWorkflowStore'

const LoopNode = ({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  const { nodeExecutionStatus, openNodeAppendMenu, categories, activeCategoryId } =
    useWorkflowStore()
  const { project, screenToFlowPosition } = useReactFlow()
  const status = nodeExecutionStatus ? nodeExecutionStatus[id] : undefined

  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const layoutDirection: LayoutDirection = activeCategory?.layoutDirection || 'vertical'
  const isHorizontal = layoutDirection === 'horizontal'

  const handleAddNode = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      const newNodeRelativePosition = isHorizontal
        ? { x: 30, y: 80 }
        : { x: 120, y: 30 }

      openNodeAppendMenu(null, { x: position.x + 20, y: position.y - 10 }, id, newNodeRelativePosition)
    },
    [id, openNodeAppendMenu, isHorizontal]
  )

  const getNodeColor = (status?: string) => {
    if (status === 'success') return 'border-emerald-500 bg-emerald-50/30'
    if (status === 'failed') return 'border-rose-500 bg-rose-50/30'
    if (status === 'running') return 'border-blue-400 bg-blue-50/30'
    return 'border-indigo-200 bg-slate-50/50'
  }

  const config = data.config as any

  const inputHandle = isHorizontal ? (
    <Handle
      type="target"
      position={Position.Left}
      id="loop-input"
      isConnectable={isConnectable}
      className="!bg-indigo-500 !w-4 !h-4 !-left-2.5 z-50 border-2 border-white"
    />
  ) : (
    <Handle
      type="target"
      position={Position.Top}
      id="loop-input"
      isConnectable={isConnectable}
      className="!bg-indigo-500 !w-4 !h-4 !-top-2.5 z-50 border-2 border-white"
    />
  )

  const outputHandle = isHorizontal ? (
    <Handle
      type="source"
      position={Position.Right}
      id="loop-output"
      isConnectable={isConnectable}
      className="!bg-indigo-500 !w-4 !h-4 !-right-2.5 z-50 border-2 border-white"
    />
  ) : (
    <Handle
      type="source"
      position={Position.Bottom}
      id="loop-output"
      isConnectable={isConnectable}
      className="!bg-indigo-500 !w-4 !h-4 !-bottom-2.5 z-50 border-2 border-white"
    />
  )

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

      {inputHandle}

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
        <button
          onClick={handleAddNode}
          className="p-1.5 text-indigo-600 hover:bg-indigo-200 rounded-md transition-colors"
          title="在循环内添加节点"
        >
          <Plus size={16} />
        </button>
      </div>

      {outputHandle}

      <div className="flex-1 relative p-4">
        {isHorizontal ? (
          <>
            <div className="absolute left-4 top-4 flex items-center gap-1">
              <span className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-wider">
                Start
              </span>
              <div className="relative group/plus">
                <Handle
                  type="source"
                  position={Position.Left}
                  id="loop-start"
                  isConnectable={isConnectable}
                  className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white !static !translate-x-0"
                />
                <button
                  onClick={handleAddNode}
                  className="absolute -inset-1 flex items-center justify-center bg-indigo-500 text-white rounded-full opacity-0 group-hover/plus:opacity-100 transition-opacity z-10"
                >
                  <Plus size={10} strokeWidth={3} />
                </button>
                <div className="absolute -inset-1 flex items-center justify-center bg-indigo-500 text-white rounded-full pointer-events-none shadow-sm">
                  <Plus size={10} strokeWidth={3} />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-medium absolute left-4 top-10">
              循环内部起点
            </p>
            <div className="absolute right-4 bottom-4 flex items-center gap-2 opacity-30 pointer-events-none">
              <StopCircle size={14} className="text-slate-500" />
              <span className="text-[10px] font-mono text-slate-500">Loop End</span>
            </div>
          </>
        ) : (
          <>
            <div className="absolute top-4 left-4 flex flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <div className="relative group/plus">
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
          </>
        )}

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

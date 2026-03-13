import React, { memo, useEffect } from 'react'
import { NodeProps, Handle, Position, useUpdateNodeInternals } from 'reactflow'
import { NodeData, QuestionClassifierConfig, LayoutDirection } from '../types'
import { BaseNode } from './BaseNode'
import { useWorkflowStore } from '../store/useWorkflowStore'

const QuestionClassifierNode = (props: NodeProps<NodeData>) => {
  const { id, data, isConnectable } = props
  const config = data.config as QuestionClassifierConfig
  const categories = config?.categories || []
  const updateNodeInternals = useUpdateNodeInternals()
  const { categories: workflowCategories, activeCategoryId } = useWorkflowStore()

  const activeCategory = workflowCategories.find(c => c.id === activeCategoryId)
  const layoutDirection: LayoutDirection = activeCategory?.layoutDirection || 'vertical'
  const isHorizontal = layoutDirection === 'horizontal'

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, categories.length, updateNodeInternals])

  const customHandles = isHorizontal ? (
    <div className="absolute -right-2 h-full flex flex-col justify-around py-2 pointer-events-none">
      {categories.map((category, index) => {
        const totalHandles = categories.length + 1
        const topPosition = ((index + 1) / (totalHandles + 1)) * 100

        return (
          <React.Fragment key={category.id}>
            <div
              className="absolute -left-16 translate-y-1/2 flex items-center w-14 text-right z-10"
              style={{ top: `${topPosition}%` }}
            >
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 whitespace-nowrap max-w-full overflow-hidden text-ellipsis shadow-sm">
                {category.name}
              </span>
            </div>
            <Handle
              id={`source-${index}`}
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              className="!bg-indigo-400 hover:!bg-indigo-600 !w-3.5 !h-3.5 z-50 pointer-events-auto cursor-crosshair border-2 border-white"
              style={{ top: `${topPosition}%`, right: '-8px' }}
            />
          </React.Fragment>
        )
      })}

      {(() => {
        const totalHandles = categories.length + 1
        const topPosition = (totalHandles / (totalHandles + 1)) * 100
        return (
          <>
            <div
              className="absolute -left-16 translate-y-1/2 flex items-center w-14 text-right z-10"
              style={{ top: `${topPosition}%` }}
            >
              <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap shadow-sm">
                其他
              </span>
            </div>
            <Handle
              id="source-else"
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              className="!bg-slate-300 hover:!bg-slate-500 !w-3.5 !h-3.5 z-50 pointer-events-auto cursor-crosshair border-2 border-white"
              style={{ top: `${topPosition}%`, right: '-8px' }}
            />
          </>
        )
      })()}
    </div>
  ) : (
    <div className="absolute -bottom-2 w-full h-0 pointer-events-none">
      {categories.map((category, index) => {
        const totalHandles = categories.length + 1
        const leftPosition = ((index + 1) / (totalHandles + 1)) * 100

        return (
          <React.Fragment key={category.id}>
            <div
              className="absolute -bottom-6 flex flex-col items-center w-24 -translate-x-1/2"
              style={{ left: `${leftPosition}%` }}
            >
              <span className="text-[9px] font-bold text-indigo-600 mb-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 whitespace-nowrap max-w-full overflow-hidden text-ellipsis shadow-sm">
                {category.name}
              </span>
            </div>
            <Handle
              id={`source-${index}`}
              type="source"
              position={Position.Bottom}
              isConnectable={isConnectable}
              className="!bg-indigo-400 hover:!bg-indigo-600 !w-3.5 !h-3.5 z-50 pointer-events-auto cursor-crosshair border-2 border-white"
              style={{ left: `${leftPosition}%`, bottom: '-8px' }}
            />
          </React.Fragment>
        )
      })}

      {(() => {
        const totalHandles = categories.length + 1
        const leftPosition = (totalHandles / (totalHandles + 1)) * 100
        return (
          <>
            <div
              className="absolute -bottom-6 flex flex-col items-center w-24 -translate-x-1/2"
              style={{ left: `${leftPosition}%` }}
            >
              <span className="text-[9px] font-bold text-slate-500 mb-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap shadow-sm">
                其他
              </span>
            </div>
            <Handle
              id="source-else"
              type="source"
              position={Position.Bottom}
              isConnectable={isConnectable}
              className="!bg-slate-300 hover:!bg-slate-500 !w-3.5 !h-3.5 z-50 pointer-events-auto cursor-crosshair border-2 border-white"
              style={{ left: `${leftPosition}%`, bottom: '-8px' }}
            />
          </>
        )
      })()}
    </div>
  )

  return (
    <BaseNode
      {...props}
      customHandles={customHandles}
      showOutputHandle={false}
      showAddButton={false}
    />
  )
}

export default memo(QuestionClassifierNode)

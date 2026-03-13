import React, { memo } from 'react'
import { NodeProps, Handle, Position } from 'reactflow'
import { NodeData, LayoutDirection } from '../types'
import { BaseNode } from './BaseNode'
import { useWorkflowStore } from '../store/useWorkflowStore'

const ParallelNode = (props: NodeProps<NodeData>) => {
  const { isConnectable, data } = props
  const { categories, activeCategoryId } = useWorkflowStore()

  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const layoutDirection: LayoutDirection = activeCategory?.layoutDirection || 'vertical'
  const isHorizontal = layoutDirection === 'horizontal'

  const parallelBranches =
    data.config?.branches && Array.isArray(data.config.branches)
      ? data.config.branches
      : ['Branch 1', 'Branch 2']

  const customHandles = isHorizontal ? (
    <div className="absolute -right-2 h-full flex flex-col justify-between py-1 pointer-events-none">
      {parallelBranches.map((branch: string, index: number) => {
        const count = parallelBranches.length
        const percent = ((index + 0.5) / count) * 100

        return (
          <div key={index} className="relative h-full flex items-center">
            <div
              className="absolute -left-16 translate-y-1/2 flex items-center w-14 text-right z-10"
              style={{ top: `${percent}%` }}
            >
              <span className="text-[9px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 truncate max-w-full shadow-sm">
                {branch}
              </span>
            </div>
            <Handle
              id={`branch-${index}`}
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              className="!bg-teal-400 hover:!bg-teal-600 !w-3.5 !h-3.5 z-50 pointer-events-auto cursor-crosshair border-2 border-white"
              style={{ top: `${percent}%`, right: '-8px' }}
            />
          </div>
        )
      })}
    </div>
  ) : (
    <div className="absolute -bottom-2 w-full flex justify-between px-1 pointer-events-none">
      {parallelBranches.map((branch: string, index: number) => {
        const count = parallelBranches.length
        const percent = ((index + 0.5) / count) * 100

        return (
          <div key={index} className="relative w-full h-0">
            <div
              className="absolute -top-4 -translate-x-1/2 flex flex-col items-center w-24 text-center z-10"
              style={{ left: `${percent}%` }}
            >
              <span className="text-[9px] font-medium text-teal-600 mb-1 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 truncate max-w-full block shadow-sm">
                {branch}
              </span>
            </div>
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

export default memo(ParallelNode)

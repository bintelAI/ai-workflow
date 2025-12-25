import React, { memo } from 'react'
import { NodeProps, Handle, Position } from 'reactflow'
import { NodeData } from '../types'
import { BaseNode } from './BaseNode'

const ParallelNode = (props: NodeProps<NodeData>) => {
  const { isConnectable, data } = props

  // Safe defaults for parallel branches
  const parallelBranches =
    data.config?.branches && Array.isArray(data.config.branches)
      ? data.config.branches
      : ['Branch 1', 'Branch 2']

  const customHandles = (
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

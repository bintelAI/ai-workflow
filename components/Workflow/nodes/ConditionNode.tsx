import React, { memo } from 'react'
import { NodeProps, Handle, Position } from 'reactflow'
import { NodeData } from '../../../types'
import { BaseNode } from './BaseNode'

const ConditionNode = (props: NodeProps<NodeData>) => {
  const { isConnectable } = props

  const customHandles = (
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

export default memo(ConditionNode)

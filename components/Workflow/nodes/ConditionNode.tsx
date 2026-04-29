import React, { memo } from 'react'
import { NodeProps, Handle, Position } from 'reactflow'
import { NodeData, LayoutDirection } from '../types'
import { BaseNode } from './BaseNode'
import { useWorkflowStore } from '../store/useWorkflowStore'

const ConditionNode = (props: NodeProps<NodeData>) => {
  const { isConnectable } = props
  const { categories, activeCategoryId } = useWorkflowStore()

  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const layoutDirection: LayoutDirection = activeCategory?.layoutDirection || 'vertical'
  const isHorizontal = layoutDirection === 'horizontal'
  const trueLabel = '是 / 真'
  const falseLabel = '否 / 假'
  const labelClass =
    'text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm whitespace-nowrap leading-4'
  const trueLabelClass = `${labelClass} text-emerald-700 bg-emerald-50 border-emerald-200`
  const falseLabelClass = `${labelClass} text-rose-700 bg-rose-50 border-rose-200`

  const customHandles = isHorizontal ? (
    <>
      <div className="absolute -right-20 top-1/4 -translate-y-1/2 flex items-center pointer-events-none">
        <span className={trueLabelClass}>
          {trueLabel}
        </span>
      </div>
      <Handle
        id="source-if"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!bg-emerald-400 hover:!bg-emerald-600 !w-3 !h-3 !-right-1.5 z-10"
        style={{ top: '25%' }}
      />

      <div className="absolute -right-20 top-3/4 -translate-y-1/2 flex items-center pointer-events-none">
        <span className={falseLabelClass}>
          {falseLabel}
        </span>
      </div>
      <Handle
        id="source-else"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!bg-rose-400 hover:!bg-rose-600 !w-3 !h-3 !-right-1.5 z-10"
        style={{ top: '75%' }}
      />
    </>
  ) : (
    <>
      <Handle
        id="source-if"
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-emerald-400 hover:!bg-emerald-600 !w-3 !h-3 !-bottom-1.5 z-10"
        style={{ left: '25%' }}
      />

      <Handle
        id="source-else"
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-rose-400 hover:!bg-rose-600 !w-3 !h-3 !-bottom-1.5 z-10"
        style={{ left: '75%' }}
      />
      <div className="absolute -bottom-8 left-0 right-0 grid grid-cols-2 px-4 pointer-events-none">
        <div className="flex justify-start">
          <span className={trueLabelClass}>{trueLabel}</span>
        </div>
        <div className="flex justify-end">
          <span className={falseLabelClass}>{falseLabel}</span>
        </div>
      </div>
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

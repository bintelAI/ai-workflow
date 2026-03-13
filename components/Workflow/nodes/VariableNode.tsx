import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { NodeData } from '../types'
import { BaseNode } from './BaseNode'

const VariableNode = (props: NodeProps<NodeData>) => {
  return <BaseNode {...props} />
}

export default memo(VariableNode)

import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { NodeData } from '../types'
import { BaseNode } from './BaseNode'

const EndNode = (props: NodeProps<NodeData>) => {
  return <BaseNode {...props} showOutputHandle={false} showAddButton={false} />
}

export default memo(EndNode)

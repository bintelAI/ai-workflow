import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { NodeData } from '../../../types'
import { BaseNode } from './BaseNode'

const StartNode = (props: NodeProps<NodeData>) => {
  return <BaseNode {...props} showInputHandle={false} />
}

export default memo(StartNode)

import { NodeProps } from 'reactflow'
import { WorkflowNodeType } from '../types'
import { NodeData } from '../Workflow.types'
import React from 'react'
/**
 * 基础节点Props
 */
export interface BaseNodeProps extends NodeProps<NodeData> {
  showInputHandle?: boolean
  showOutputHandle?: boolean
}

/**
 * 节点类型配置
 */
export interface NodeTypeConfig {
  type: WorkflowNodeType
  label: string
  icon: React.ReactNode
  color: string
}

/**
 * 节点工具函数类型
 */
export interface NodeUtils {
  getNodeIcon: (type: WorkflowNodeType) => React.ReactNode
  getNodeTypeLabel: (type: WorkflowNodeType) => string
  getNodeColor: (type: WorkflowNodeType) => string
}

import React, { useMemo } from 'react'
import { WorkflowApp } from './components/Workflow/WorkflowApp'
import { WorkflowNodeType } from './components/Workflow/types'

/**
 * 应用根组件
 * 用于渲染Workflow应用
 */
const App: React.FC = () => {
  // 定义初始节点数组
  const initialNodes = useMemo(() => [
    {
      id: '1',
      type: WorkflowNodeType.START,
      position: { x: 400, y: 50 },
      data: {
        label: '开始申请',
        description: '发起审批申请',
        config: {},
      },
    },
    {
      id: '2',
      type: WorkflowNodeType.APPROVAL,
      position: { x: 400, y: 180 },
      data: {
        label: '主管审批',
        description: '直属主管进行审批',
        config: {
          approver: 'manager',
          approvalType: 'single',
        },
      },
    },
    {
      id: '3',
      type: WorkflowNodeType.CONDITION,
      position: { x: 400, y: 310 },
      data: {
        label: '审批结果',
        description: '根据审批结果分流',
        config: {
          expression: 'node_2.approved == true',
        },
      },
    },
    {
      id: '4',
      type: WorkflowNodeType.NOTIFICATION,
      position: { x: 250, y: 440 },
      data: {
        label: '通过通知',
        description: '发送审批通过通知',
        config: {
          channel: 'feishu',
          recipients: 'requester',
        },
      },
    },
    {
      id: '5',
      type: WorkflowNodeType.END,
      position: { x: 400, y: 570 },
      data: {
        label: '流程结束',
        description: '工作流正常结束',
        config: {},
      },
    },
  ], [])

  // 定义初始连线数组
  const initialEdges = useMemo(() => [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    },
    {
      id: 'e3-4',
      source: '3',
      target: '4',
      sourceHandle: 'true',
      animated: true,
      label: '通过',
      style: { stroke: '#10b981', strokeWidth: 2 },
    },
    {
      id: 'e3-5',
      source: '3',
      target: '5',
      sourceHandle: 'false',
      animated: true,
      label: '拒绝',
      style: { stroke: '#ef4444', strokeWidth: 2 },
    },
    {
      id: 'e4-5',
      source: '4',
      target: '5',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    },
  ], [])

  // 定义允许在侧边栏使用的节点类型
  const allowedNodeTypes = useMemo(() => [
    WorkflowNodeType.START,
    WorkflowNodeType.APPROVAL,
    WorkflowNodeType.CONDITION,
    WorkflowNodeType.CC,
    WorkflowNodeType.NOTIFICATION,
    WorkflowNodeType.DELAY,
    WorkflowNodeType.END,
  ], [])

  return (
    <WorkflowApp 
      initialNodes={initialNodes} 
      initialEdges={initialEdges} 
      allowedNodeTypes={allowedNodeTypes}
    />
  )
}

export default App

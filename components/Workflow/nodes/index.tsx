// 节点共享基础组件
import { BaseNode, getNodeIcon, getNodeTypeLabel, getNodeColor } from './BaseNode'

// 各种节点组件
import StartNode from './StartNode'
import EndNode from './EndNode'
import ApprovalNode from './ApprovalNode'
import CCNode from './CCNode'
import ConditionNode from './ConditionNode'
import APICallNode from './APICallNode'
import NotificationNode from './NotificationNode'
import DelayNode from './DelayNode'
import DataOpNode from './DataOpNode'
import ScriptNode from './ScriptNode'
import ParallelNode from './ParallelNode'
import LLMNode from './LLMNode'
import LoopNode from './LoopNode'
import SQLNode from './SQLNode'
import KnowledgeRetrievalNode from './KnowledgeRetrievalNode'
import DocumentExtractorNode from './DocumentExtractorNode'
import CloudPhoneNode from './CloudPhoneNode'

// 导出所有节点组件
export {
  // 基础组件和工具函数
  BaseNode,
  getNodeIcon,
  getNodeTypeLabel,
  getNodeColor,

  // 节点组件
  StartNode,
  EndNode,
  ApprovalNode,
  CCNode,
  ConditionNode,
  APICallNode,
  NotificationNode,
  DelayNode,
  DataOpNode,
  ScriptNode,
  ParallelNode,
  LLMNode,
  LoopNode,
  SQLNode,
  KnowledgeRetrievalNode,
  DocumentExtractorNode,
  CloudPhoneNode,
}

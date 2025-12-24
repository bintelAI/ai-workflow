import React, { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  Panel,
  Node,
} from 'reactflow'

import { useWorkflowStore } from './store/useWorkflowStore'
import {
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
} from './nodes' // Import all node components
import { CustomEdge } from './edges/CustomEdge'
import { WorkflowNodeType } from '../../types'
import { WorkflowCanvasProps } from './Workflow.types'
import {
  CheckSquare,
  GitFork,
  Globe,
  Bell,
  Clock,
  Database,
  Code,
  Send,
  X,
  GitMerge,
  Bot,
  Repeat, // Loop Icon
  BookOpen,
  FileText,
} from 'lucide-react'

// Register custom node types
const nodeTypes: NodeTypes = {
  [WorkflowNodeType.START]: StartNode,
  [WorkflowNodeType.END]: EndNode,
  [WorkflowNodeType.APPROVAL]: ApprovalNode,
  [WorkflowNodeType.CC]: CCNode,
  [WorkflowNodeType.CONDITION]: ConditionNode,
  [WorkflowNodeType.PARALLEL]: ParallelNode,
  [WorkflowNodeType.API_CALL]: APICallNode,
  [WorkflowNodeType.NOTIFICATION]: NotificationNode,
  [WorkflowNodeType.DELAY]: DelayNode,
  [WorkflowNodeType.DATA_OP]: DataOpNode,
  [WorkflowNodeType.SCRIPT]: ScriptNode,
  [WorkflowNodeType.LLM]: LLMNode,
  [WorkflowNodeType.LOOP]: LoopNode,
  [WorkflowNodeType.SQL]: SQLNode,
  [WorkflowNodeType.KNOWLEDGE_RETRIEVAL]: KnowledgeRetrievalNode,
  [WorkflowNodeType.DOCUMENT_EXTRACTOR]: DocumentExtractorNode,
}

// Register custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

const getLabelForType = (type: WorkflowNodeType) => {
  switch (type) {
    case WorkflowNodeType.LOOP:
      return '循环迭代'
    case WorkflowNodeType.START:
      return '开始节点'
    case WorkflowNodeType.END:
      return '结束节点'
    case WorkflowNodeType.APPROVAL:
      return '审批节点'
    case WorkflowNodeType.CC:
      return '抄送节点'
    case WorkflowNodeType.CONDITION:
      return '条件节点'
    case WorkflowNodeType.PARALLEL:
      return '并行节点'
    case WorkflowNodeType.API_CALL:
      return 'API 调用'
    case WorkflowNodeType.NOTIFICATION:
      return '消息通知'
    case WorkflowNodeType.DELAY:
      return '延时等待'
    case WorkflowNodeType.DATA_OP:
      return '数据操作'
    case WorkflowNodeType.SCRIPT:
      return '脚本代码'
    case WorkflowNodeType.LLM:
      return 'LLM 模型'
    case WorkflowNodeType.SQL:
      return 'SQL 节点'
    case WorkflowNodeType.KNOWLEDGE_RETRIEVAL:
      return '知识库检索'
    case WorkflowNodeType.DOCUMENT_EXTRACTOR:
      return '文档提取器'
    default:
      return '新节点'
  }
}

// Unified Add Menu Component
const NodeAddMenu = () => {
  const {
    edgeMenu,
    closeEdgeMenu,
    insertNodeBetween,
    nodeMenu,
    closeNodeMenu,
    appendNode,
    categories,
    activeCategoryId,
  } = useWorkflowStore()
  const menuRef = useRef<HTMLDivElement>(null)

  // Get active category allowed nodes
  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const allowedNodes = new Set(activeCategory?.allowedNodeTypes || Object.values(WorkflowNodeType))

  // Determine which menu is active
  const isOpen = edgeMenu.isOpen || nodeMenu.isOpen
  const position = edgeMenu.isOpen ? edgeMenu.position : nodeMenu.position
  const isInsertMode = edgeMenu.isOpen

  const { flowToScreenPosition } = useReactFlow()

  if (!isOpen || !position) return null

  // Convert flow position to screen position for absolute positioning
  const screenPos = flowToScreenPosition(position)

  const quickAddOptions = [
    { type: WorkflowNodeType.LLM, label: 'LLM 模型', icon: Bot, color: 'text-fuchsia-500' },
    {
      type: WorkflowNodeType.KNOWLEDGE_RETRIEVAL,
      label: '知识检索',
      icon: BookOpen,
      color: 'text-sky-600',
    },
    {
      type: WorkflowNodeType.DOCUMENT_EXTRACTOR,
      label: '文档提取',
      icon: FileText,
      color: 'text-amber-600',
    },
    { type: WorkflowNodeType.SQL, label: 'SQL 节点', icon: Database, color: 'text-indigo-500' },
    { type: WorkflowNodeType.LOOP, label: '循环迭代', icon: Repeat, color: 'text-indigo-600' }, // Added Loop
    { type: WorkflowNodeType.APPROVAL, label: '审批', icon: CheckSquare, color: 'text-blue-500' },
    { type: WorkflowNodeType.CONDITION, label: '条件', icon: GitFork, color: 'text-amber-500' },
    { type: WorkflowNodeType.PARALLEL, label: '并行', icon: GitMerge, color: 'text-teal-500' },
    { type: WorkflowNodeType.CC, label: '抄送', icon: Send, color: 'text-indigo-500' },
    { type: WorkflowNodeType.DATA_OP, label: '数据', icon: Database, color: 'text-cyan-500' },
    { type: WorkflowNodeType.DELAY, label: '延时', icon: Clock, color: 'text-yellow-500' },
    { type: WorkflowNodeType.API_CALL, label: 'API', icon: Globe, color: 'text-violet-500' },
    { type: WorkflowNodeType.NOTIFICATION, label: '通知', icon: Bell, color: 'text-orange-500' },
    { type: WorkflowNodeType.SCRIPT, label: '脚本', icon: Code, color: 'text-slate-700' },
    { type: WorkflowNodeType.END, label: '结束', icon: X, color: 'text-rose-500' },
  ]

  // Filter options based on active category
  const visibleOptions = quickAddOptions.filter(option => allowedNodes.has(option.type))

  const handleClose = () => {
    if (isInsertMode) closeEdgeMenu()
    else closeNodeMenu()
  }

  const handleSelect = (type: WorkflowNodeType) => {
    if (isInsertMode) {
      insertNodeBetween(type)
    } else {
      appendNode(type)
    }
  }

  return (
    <div
      className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 w-64 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
      style={{
        left: screenPos.x,
        top: screenPos.y,
        // Removed translate(-50%) to allow bottom-right positioning from anchor point
      }}
      ref={menuRef}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-2 border-b border-slate-100">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-500 px-2">
            {isInsertMode ? '插入节点' : nodeMenu.sourceNodeId ? '添加后续节点' : '添加内部节点'}
          </span>
          <span className="text-[10px] text-indigo-400 px-2 truncate max-w-[200px]">
            模式: {activeCategory?.name}
          </span>
        </div>
        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1">
          <X size={14} />
        </button>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {visibleOptions.length > 0 ? (
          visibleOptions.map(option => (
            <button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors text-left"
            >
              <option.icon className={`w-4 h-4 ${option.color}`} />
              <span className="text-xs text-slate-700 font-medium">{option.label}</span>
            </button>
          ))
        ) : (
          <div className="col-span-2 text-center text-xs text-slate-400 py-4">
            当前模式下无可用节点
          </div>
        )}
      </div>
    </div>
  )
}

const WorkflowCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    closeEdgeMenu,
    closeNodeMenu,
    onNodeDragStop,
  } = useWorkflowStore()

  const { project, getNodes } = useReactFlow()

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType

      if (typeof type === 'undefined' || !type) {
        return
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()

      if (!reactFlowBounds) return

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      // Default Descriptions and Configs
      let description = '新添加的节点'
      let config = {}

      if (type === WorkflowNodeType.KNOWLEDGE_RETRIEVAL) {
        description = '添加知识库检索'
      } else if (type === WorkflowNodeType.DOCUMENT_EXTRACTOR) {
        description = '从文档中提取内容'
      }

      if (type === WorkflowNodeType.START) {
        config = {
          triggerType: 'webhook',
          devMode: true,
          devInput:
            '{"order_id": "ORD-2024-001", "amount": 8500, "currency": "CNY", "requester": {"id": "U-8821", "name": "Alex Chen", "department": "Engineering"}, "items": [{"name": "Server License", "price": 4000}, {"name": "Cloud Credits", "price": 4500}]}',
        }
      } else if (type === WorkflowNodeType.LLM) {
        config = { model: 'gpt-4', temperature: 0.7, systemPrompt: '', userPrompt: '' }
      } else if (type === WorkflowNodeType.PARALLEL) {
        config = { branches: ['分支 1', '分支 2'] }
      } else if (type === WorkflowNodeType.LOOP) {
        config = { targetArray: '' }
      } else if (type === WorkflowNodeType.API_CALL) {
        config = {
          url: '',
          method: 'GET',
          queryParams: [],
          headers: [],
          bodyType: 'none',
          body: '',
        }
      } else if (type === WorkflowNodeType.CONDITION) {
        config = { expression: '', conditionGroups: [] }
      } else if (type === WorkflowNodeType.APPROVAL) {
        config = { approver: '', approvalType: 'single', timeout: 86400 }
      } else if (type === WorkflowNodeType.NOTIFICATION) {
        config = { channel: '', recipients: '', title: '', content: '' }
      } else if (type === WorkflowNodeType.DELAY) {
        config = { duration: 60 }
      } else if (type === WorkflowNodeType.SCRIPT) {
        config = { script: '' }
      } else if (type === WorkflowNodeType.SQL) {
        config = { databaseId: '', sql: '', unsafeMode: false }
      } else if (type === WorkflowNodeType.KNOWLEDGE_RETRIEVAL) {
        config = { knowledgeBaseId: '', query: '', topK: 5 }
      } else if (type === WorkflowNodeType.DOCUMENT_EXTRACTOR) {
        config = { documentUrl: '', extractFields: [] }
      } else if (type === WorkflowNodeType.DATA_OP) {
        config = { operation: 'map', mapping: {} }
      } else if (type === WorkflowNodeType.CC) {
        config = { recipients: '', message: '' }
      }

      const newNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        style: type === WorkflowNodeType.LOOP ? { width: 350, height: 250 } : undefined, // Default size for Loop
        data: {
          label: getLabelForType(type),
          description,
          config,
        },
      }

      addNode(newNode)
    },
    [project, addNode]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNode(node.id)
      closeEdgeMenu()
      closeNodeMenu()
    },
    [setSelectedNode, closeEdgeMenu, closeNodeMenu]
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    closeEdgeMenu()
    closeNodeMenu()
  }, [setSelectedNode, closeEdgeMenu, closeNodeMenu])

  // Handle Drag Stop to detect nesting in Loop Nodes
  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const allNodes = getNodes()
      // Call store action to handle parenting logic
      onNodeDragStop(event, node as any, allNodes as any)
    },
    [getNodes, onNodeDragStop]
  )

  return (
    <div className="flex-1 h-full w-full bg-slate-50 relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls className="!bg-white !border-slate-200 !shadow-lg [&>button]:!border-slate-100 [&>button:hover]:!bg-slate-50 [&_svg]:!fill-slate-600" />
        <MiniMap
          nodeColor={node => {
            switch (node.type) {
              case WorkflowNodeType.START:
                return '#10b981'
              case WorkflowNodeType.END:
                return '#f43f5e'
              case WorkflowNodeType.LOOP:
                return '#6366f1'
              default:
                return '#64748b'
            }
          }}
          maskColor="rgb(241, 245, 249, 0.7)"
          className="!bg-white !border !border-slate-200 !shadow-lg rounded-lg overflow-hidden"
        />
        <Panel
          position="top-right"
          className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-500"
        >
          {nodes.length} 个节点 • {edges.length} 条连线
        </Panel>

        {/* Render the unified menu */}
        <NodeAddMenu />
      </ReactFlow>
    </div>
  )
}

/**
 * 工作流画布组件
 * 提供工作流节点的可视化编辑和交互功能
 */
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = () => {
  return <WorkflowCanvasInner />
}

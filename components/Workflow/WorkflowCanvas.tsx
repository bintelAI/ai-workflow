import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
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
  CloudPhoneNode,
  StorageNode,
  QuestionClassifierNode,
  JSONParseNode,
  SmartParseNode,
  FlowCallNode,
  VariableNode,
} from './nodes' // Import all node components
import { CustomEdge } from './edges/CustomEdge'
import { WorkflowNodeType } from './types'
import { WorkflowCanvasProps } from './Workflow.types'
import { createDefaultNodePayload, getRegistryItems } from './config/nodeRegistry'
import { X, LayoutGrid } from 'lucide-react'

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
  [WorkflowNodeType.CLOUD_PHONE]: CloudPhoneNode,
  [WorkflowNodeType.STORAGE]: StorageNode,
  [WorkflowNodeType.QUESTION_CLASSIFIER]: QuestionClassifierNode,
  [WorkflowNodeType.JSON_PARSE]: JSONParseNode,
  [WorkflowNodeType.SMART_PARSE]: SmartParseNode,
  [WorkflowNodeType.FLOW_CALL]: FlowCallNode,
  [WorkflowNodeType.VARIABLE]: VariableNode,
}

// Register custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
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

  const registryItems = getRegistryItems()
  const quickAddOptions = registryItems
    .filter(item => item.visibleInQuickAdd !== false)
    .map(item => ({
      type: item.type,
      label: item.shortLabel || item.label,
      icon: item.icon,
      color: item.color,
    }))

  // Filter options based on active category and backend support
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

const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({ readonly = false }) => {
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
    applyAutoLayout,
    categories,
    activeCategoryId,
    selectedNodeId,
  } = useWorkflowStore()

  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const effectiveAllowedNodes = activeCategory?.allowedNodeTypes?.length
    ? activeCategory.allowedNodeTypes
    : Object.values(WorkflowNodeType)
  const allowedNodes = useMemo(
    () => new Set(effectiveAllowedNodes),
    [effectiveAllowedNodes]
  )

  const { project, getNodes, fitView, setCenter } = useReactFlow()

  const handleAutoLayout = useCallback(() => {
    const activeCategory = categories.find(c => c.id === activeCategoryId)
    const direction = activeCategory?.layoutDirection || 'vertical'
    applyAutoLayout(direction)
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [categories, activeCategoryId, applyAutoLayout, fitView])

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (readonly) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [readonly])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (readonly) {
        return
      }
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType

      if (typeof type === 'undefined' || !type || !allowedNodes.has(type)) {
        return
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()

      if (!reactFlowBounds) return

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode = createDefaultNodePayload(type, position)
      addNode(newNode)
    },
    [project, addNode, allowedNodes, readonly]
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

  useEffect(() => {
    const focusNode = (nodeId: string) => {
      const targetNode = nodes.find(node => node.id === nodeId)
      if (!targetNode) return

      const width = targetNode.width || 200
      const height = targetNode.height || 80
      setSelectedNode(nodeId)
      setCenter(targetNode.position.x + width / 2, targetNode.position.y + height / 2, {
        zoom: 1.1,
        duration: 400,
      })
    }

    const handleFocusEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId?: string }>
      const nodeId = customEvent.detail?.nodeId
      if (nodeId) {
        focusNode(nodeId)
      }
    }

    window.addEventListener('workflow-focus-node', handleFocusEvent as EventListener)
    return () => {
      window.removeEventListener('workflow-focus-node', handleFocusEvent as EventListener)
    }
  }, [nodes, setCenter, setSelectedNode])

  useEffect(() => {
    if (!selectedNodeId) return
    const targetNode = nodes.find(node => node.id === selectedNodeId)
    if (!targetNode) return

    const width = targetNode.width || 200
    const height = targetNode.height || 80
    setCenter(targetNode.position.x + width / 2, targetNode.position.y + height / 2, {
      zoom: 1.1,
      duration: 300,
    })
  }, [selectedNodeId, nodes, setCenter])

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
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        panOnDrag
        nodesDraggable
      >
        <Background color="#cbd5e1" gap={20} />
        {!readonly && (
          <>
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
              className="flex items-center gap-2"
            >
              <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-500">
                {nodes.length} 个节点 • {edges.length} 条连线
              </div>
              <button
                onClick={handleAutoLayout}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                title="一键整理工作流节点布局"
              >
                <LayoutGrid size={14} />
                一键整理
              </button>
            </Panel>
          </>
        )}

        {!readonly && <NodeAddMenu />}
      </ReactFlow>
    </div>
  )
}

/**
 * 工作流画布组件
 * 提供工作流节点的可视化编辑和交互功能
 */
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ readonly = false }) => {
  return <WorkflowCanvasInner readonly={readonly} />
}

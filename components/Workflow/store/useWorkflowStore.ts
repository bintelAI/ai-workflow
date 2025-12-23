import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
  MarkerType,
} from 'reactflow';
import { WorkflowStoreState, WorkflowNodeType, SimulationLog, WorkflowCategory, WorkflowNode } from '../../../types';
import { runSimulationLogic } from './simulationRunner';

// Default Data for Global Variables (Start Node)
export const DEFAULT_DEV_INPUT = JSON.stringify({
  order_id: "ORD-2024-001",
  amount: 8500,
  currency: "CNY",
  requester: {
    id: "U-8821",
    name: "Alex Chen",
    department: "Engineering"
  },
  items: [
    { name: "Server License", price: 4000 },
    { name: "Cloud Credits", price: 4500 }
  ]
}, null, 2);

// Initial dummy data
const initialNodes = [
  {
    id: '1',
    type: WorkflowNodeType.START,
    position: { x: 250, y: 50 },
    // Enable Dev Mode by default here
    data: { 
        label: '流程开始', 
        description: 'Webhook 触发',
        config: { 
            devMode: true,
            devInput: DEFAULT_DEV_INPUT
        } 
    },
  },
];

const initialEdges: any[] = [];

// --- Default Categories ---
const DEFAULT_CATEGORIES: WorkflowCategory[] = [
    {
        id: 'general',
        name: '全功能模式 (General)',
        description: '包含所有可用节点，适用于复杂混合场景。',
        isSystem: true,
        allowedNodeTypes: Object.values(WorkflowNodeType)
    },
    {
        id: 'business_approval',
        name: '行政审批流 (BPM)',
        description: '专注于OA审批、报销、请假等业务流程。屏蔽技术性节点。',
        isSystem: true,
        allowedNodeTypes: [
            WorkflowNodeType.START, WorkflowNodeType.END,
            WorkflowNodeType.APPROVAL, WorkflowNodeType.CC,
            WorkflowNodeType.CONDITION, WorkflowNodeType.PARALLEL,
            WorkflowNodeType.NOTIFICATION, WorkflowNodeType.DELAY,
            WorkflowNodeType.LOOP
        ]
    },
    {
        id: 'ai_agent',
        name: 'AI Agent 编排',
        description: '专注于 LLM 调用、数据处理和 API 集成。屏蔽人工审批节点。',
        isSystem: true,
        allowedNodeTypes: [
            WorkflowNodeType.START, WorkflowNodeType.END,
            WorkflowNodeType.LLM, WorkflowNodeType.API_CALL,
            WorkflowNodeType.SCRIPT, WorkflowNodeType.DATA_OP,
            WorkflowNodeType.CONDITION, WorkflowNodeType.PARALLEL,
            WorkflowNodeType.LOOP
        ]
    }
];

export const useWorkflowStore = create<WorkflowStoreState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: null,
      edgeMenu: {
        isOpen: false,
        edgeId: null,
        position: null,
        sourceId: null,
        targetId: null,
      },
      nodeMenu: {
        isOpen: false,
        sourceNodeId: null,
        position: null,
        parentNodeId: null, // Add parentNodeId to support adding to loop
      },
      
      isDrawerOpen: false,
      simulationLogs: [],
      nodeExecutionStatus: {}, 
      isAIGenerating: false,

      // --- Node Output Tracking Init ---
      nodeOutputs: {},

      // --- Settings Init ---
      isSettingsOpen: false,
      categories: DEFAULT_CATEGORIES,
      activeCategoryId: 'general',

      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection: Connection) => {
        set({
          edges: addEdge({ 
            ...connection, 
            type: 'custom', 
            animated: true, 
            markerEnd: { type: MarkerType.ArrowClosed }
          }, get().edges),
        });
      },

      addNode: (node) => {
        set({
          nodes: [...get().nodes, node],
        });
      },

      updateNodeData: (id, data) => {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === id) {
              return { ...node, data: { ...node.data, ...data } };
            }
            return node;
          }),
        });
      },

      setSelectedNode: (id) => {
        set({ selectedNodeId: id });
      },

      deleteNode: (id) => {
        set({
            nodes: get().nodes.filter((n) => n.id !== id && n.parentNode !== id), // Also delete children? Maybe not for now, but usually yes
            edges: get().edges.filter((e) => e.source !== id && e.target !== id),
            selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
        })
      },

      // --- NEW: Handle Dragging into Groups (Loop Node) ---
      onNodeDragStop: (event, node, allNodes) => {
          // Find Loop Nodes
          const loopNodes = allNodes.filter(n => n.type === WorkflowNodeType.LOOP && n.id !== node.id);
          
          // Check intersection
          // Simple bounding box intersection check
          const draggedNodeRect = {
              x: node.position.x, // Caution: if it was already parented, this is relative. We need absolute for checking.
              y: node.position.y,
              width: node.width || 200,
              height: node.height || 80
          };

          // Helper to get absolute position
          const getAbsPos = (n: any) => {
              if (n.parentNode) {
                  const parent = allNodes.find(p => p.id === n.parentNode);
                  if (parent) {
                      const pAbs = getAbsPos(parent);
                      return { x: pAbs.x + n.position.x, y: pAbs.y + n.position.y };
                  }
              }
              return n.position;
          };

          const absDraggedPos = getAbsPos(node);
          const absRect = {
              x: absDraggedPos.x,
              y: absDraggedPos.y,
              width: node.width || 200,
              height: node.height || 80
          };

          let newParentId: string | undefined = undefined;

          for (const loopNode of loopNodes) {
              const loopAbsPos = getAbsPos(loopNode);
              const loopRect = {
                  x: loopAbsPos.x,
                  y: loopAbsPos.y,
                  width: loopNode.width || 350,
                  height: loopNode.height || 250
              };

              // Check if Node Center is inside Loop Node
              const centerX = absRect.x + absRect.width / 2;
              const centerY = absRect.y + absRect.height / 2;

              if (
                  centerX >= loopRect.x && 
                  centerX <= loopRect.x + loopRect.width &&
                  centerY >= loopRect.y && 
                  centerY <= loopRect.y + loopRect.height
              ) {
                  newParentId = loopNode.id;
                  break;
              }
          }

          // Update Node
          if (node.parentNode !== newParentId) {
              set(state => ({
                  nodes: state.nodes.map(n => {
                      if (n.id === node.id) {
                          let newPosition = n.position;
                          
                          if (newParentId) {
                              // Converting to Child (Relative)
                              // Relative = AbsoluteChild - AbsoluteParent
                              const parent = allNodes.find(p => p.id === newParentId);
                              const parentAbs = getAbsPos(parent);
                              newPosition = {
                                  x: absRect.x - parentAbs.x,
                                  y: absRect.y - parentAbs.y
                              };
                              
                              // Ensure positive coordinates if possible, or ReactFlow handles it.
                              // Extent parent constrains it.
                              return { 
                                  ...n, 
                                  parentNode: newParentId, 
                                  extent: 'parent',
                                  position: newPosition
                              };
                          } else {
                              // Converting to Root (Absolute)
                              return {
                                  ...n,
                                  parentNode: undefined,
                                  extent: undefined,
                                  position: absRect // Restore absolute
                              };
                          }
                      }
                      return n;
                  })
              }));
          }
      },

      // Edge Menu Implementation
      openEdgeMenu: (edgeId, position, sourceId, targetId) => {
        get().closeNodeMenu();
        set({
          edgeMenu: {
            isOpen: true,
            edgeId,
            position,
            sourceId,
            targetId,
          }
        });
      },

      closeEdgeMenu: () => {
        set((state) => ({
          edgeMenu: {
            ...state.edgeMenu,
            isOpen: false,
          }
        }));
      },

      insertNodeBetween: (nodeType) => {
        const { edgeMenu, nodes, edges } = get();
        if (!edgeMenu.edgeId || !edgeMenu.sourceId || !edgeMenu.targetId) return;

        const sourceNode = nodes.find(n => n.id === edgeMenu.sourceId);
        const targetNode = nodes.find(n => n.id === edgeMenu.targetId);

        if (!sourceNode || !targetNode) return;

        const oldEdge = edges.find(e => e.id === edgeMenu.edgeId);

        const newNodeId = `${nodeType}_${Date.now()}`;
        const newNodePosition = {
          x: (sourceNode.position.x + targetNode.position.x) / 2,
          y: (sourceNode.position.y + targetNode.position.y) / 2,
        };

        let label = getNodeLabel(nodeType);
        let description = '插入的新节点';

        if (nodeType === WorkflowNodeType.KNOWLEDGE_RETRIEVAL) {
            description = '添加知识库检索';
        } else if (nodeType === WorkflowNodeType.DOCUMENT_EXTRACTOR) {
            description = '从文档中提取内容';
        }

        let config: any = {};
        if (nodeType === WorkflowNodeType.PARALLEL) {
            config = { branches: ['分支 1', '分支 2'] };
        }
        if (nodeType === WorkflowNodeType.LOOP) {
            config = { targetArray: '' };
        }

        const newNode: WorkflowNode = {
          id: newNodeId,
          type: nodeType,
          position: newNodePosition,
          // If we are inserting between two nodes that share a parent, the new node inherits it?
          // For simplicity, inserts are top-level unless logic is added.
          // But if source and target have same parent, inherit it.
          parentNode: (sourceNode.parentNode === targetNode.parentNode) ? sourceNode.parentNode : undefined,
          extent: (sourceNode.parentNode === targetNode.parentNode && sourceNode.parentNode) ? "parent" : undefined,
          style: nodeType === WorkflowNodeType.LOOP ? { width: 350, height: 250 } : undefined,
          data: { label, description, config },
        };

        let sourceHandle = oldEdge?.sourceHandle;
        if (sourceNode.type === WorkflowNodeType.LOOP && !sourceHandle) {
            sourceHandle = 'loop-output';
        }

        const newEdge1 = {
          id: `e${edgeMenu.sourceId}-${newNodeId}`,
          source: edgeMenu.sourceId,
          target: newNodeId,
          sourceHandle: sourceHandle,
          type: 'custom',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed }
        };
        
        let sourceHandleForSecondEdge: string | undefined = undefined;
        if (nodeType === WorkflowNodeType.PARALLEL) {
            sourceHandleForSecondEdge = 'branch-0'; 
        }

        let targetHandleForSecondEdge: string | undefined = undefined;
        if (targetNode.type === WorkflowNodeType.LOOP) {
            targetHandleForSecondEdge = 'loop-input';
        }

        const newEdge2 = {
          id: `e${newNodeId}-${edgeMenu.targetId}`,
          source: newNodeId,
          target: edgeMenu.targetId,
          sourceHandle: sourceHandleForSecondEdge,
          targetHandle: targetHandleForSecondEdge,
          type: 'custom',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed }
        };

        const newEdges = edges.filter(e => e.id !== edgeMenu.edgeId).concat([newEdge1, newEdge2]);
        const newNodes = [...nodes, newNode];

        set({
          nodes: newNodes,
          edges: newEdges,
          edgeMenu: { ...edgeMenu, isOpen: false }
        });
      },

      // Node Menu Implementation
      openNodeAppendMenu: (sourceNodeId, position, parentNodeId, canvasPosition) => {
        get().closeEdgeMenu(); // Ensure edge menu is closed
        set({
            nodeMenu: {
                isOpen: true,
                sourceNodeId,
                position,
                canvasPosition: canvasPosition || null,
                parentNodeId: parentNodeId || null
            }
        });
      },

      closeNodeMenu: () => {
          set((state) => ({
              nodeMenu: { ...state.nodeMenu, isOpen: false }
          }));
      },

      appendNode: (nodeType) => {
          const { nodeMenu, nodes, edges } = get();
          
          let newNodePosition = { x: 0, y: 0 };
          let parentNodeId = nodeMenu.parentNodeId;
          let sourceNode = null;

          if (nodeMenu.sourceNodeId) {
              sourceNode = nodes.find(n => n.id === nodeMenu.sourceNodeId);
              if (sourceNode) {
                  newNodePosition = {
                      x: sourceNode.position.x,
                      y: sourceNode.position.y + 150, 
                  };
                  parentNodeId = sourceNode.parentNode || parentNodeId;
              }
          } else if (nodeMenu.canvasPosition) {
              // Use the provided canvas position (already relative if parented)
              newNodePosition = nodeMenu.canvasPosition;
          }

          const newNodeId = `${nodeType}_${Date.now()}`;
          let label = getNodeLabel(nodeType);
          let description = '追加的新节点';
          
          if (nodeType === WorkflowNodeType.KNOWLEDGE_RETRIEVAL) {
              description = '添加知识库检索';
          } else if (nodeType === WorkflowNodeType.DOCUMENT_EXTRACTOR) {
              description = '从文档中提取内容';
          }

          let config: any = {};
          if (nodeType === WorkflowNodeType.PARALLEL) {
              config = { branches: ['分支 1', '分支 2'] };
          }
          if (nodeType === WorkflowNodeType.LOOP) {
              config = { targetArray: '' };
          }

          const newNode: WorkflowNode = {
              id: newNodeId,
              type: nodeType,
              position: newNodePosition,
              // Inherit Parent if inside a loop
              parentNode: parentNodeId || undefined,
              extent: parentNodeId ? "parent" : undefined,
              style: nodeType === WorkflowNodeType.LOOP ? { width: 350, height: 250 } : undefined,
              data: { label, description, config },
          };
          
          let newEdges = [...edges];
          if (nodeMenu.sourceNodeId) {
              const sourceNode = nodes.find(n => n.id === nodeMenu.sourceNodeId);
              let sourceHandle = undefined;
              
              // If the source is a loop node, default to the main output handle
              if (sourceNode?.type === WorkflowNodeType.LOOP) {
                  sourceHandle = 'loop-output';
              }

              // Determine target handle for the new node if it's a loop
              let targetHandle = undefined;
              if (nodeType === WorkflowNodeType.LOOP) {
                  targetHandle = 'loop-input';
              }

              const newEdge = {
                  id: `e${nodeMenu.sourceNodeId}-${newNodeId}`,
                  source: nodeMenu.sourceNodeId,
                  sourceHandle: sourceHandle,
                  target: newNodeId,
                  targetHandle: targetHandle,
                  type: 'custom',
                  animated: true,
                  markerEnd: { type: MarkerType.ArrowClosed }
              };
              newEdges.push(newEdge);
          } else if (nodeMenu.parentNodeId) {
              // If added via loop-start plus button, connect loop start handle to new node
              const parentNode = nodes.find(n => n.id === nodeMenu.parentNodeId);
              if (parentNode && parentNode.type === WorkflowNodeType.LOOP) {
                  const newEdge = {
                      id: `e${nodeMenu.parentNodeId}-start-${newNodeId}`,
                      source: nodeMenu.parentNodeId,
                      sourceHandle: 'loop-start',
                      target: newNodeId,
                      type: 'custom',
                      animated: true,
                      markerEnd: { type: MarkerType.ArrowClosed }
                  };
                  newEdges.push(newEdge);
              }
          }

          set({
              nodes: [...nodes, newNode],
              edges: newEdges,
              nodeMenu: { ...nodeMenu, isOpen: false }
          });
      },

      validateWorkflow: () => {
        const { nodes, edges } = get();
        const errors: string[] = [];
        
        // Basic validations
        const startNodes = nodes.filter(n => n.type === WorkflowNodeType.START);
        if (startNodes.length === 0) errors.push("❌ 错误: 流程必须包含一个【开始节点】");

        // Loop Validations
        const loopNodes = nodes.filter(n => n.type === WorkflowNodeType.LOOP);
        loopNodes.forEach(loop => {
            if (!(loop.data.config as any)?.targetArray) {
                errors.push(`⚠️ 警告: 循环节点 "${loop.data.label}" 未配置目标数组`);
            }
            // Check if loop has children
            const children = nodes.filter(n => n.parentNode === loop.id);
            if (children.length === 0) {
                errors.push(`⚠️ 警告: 循环节点 "${loop.data.label}" 内部是空的`);
            }
        });

        return errors;
      },

      toggleDrawer: (isOpen) => set((state) => ({ 
          isDrawerOpen: isOpen !== undefined ? isOpen : !state.isDrawerOpen 
      })),

      resetSimulation: () => {
          set({ simulationLogs: [], nodeExecutionStatus: {}, nodeOutputs: {} });
      },

      runSimulation: async (customInput?: string) => {
          const { nodes, edges } = get();
          set({ nodeExecutionStatus: {}, nodeOutputs: {} });

          const result = await runSimulationLogic(nodes, edges, customInput);

          set({ 
              simulationLogs: result.logs, 
              isDrawerOpen: true,
              nodeExecutionStatus: result.executionStatus,
              nodeOutputs: result.nodeOutputs 
          });
      },

      // --- Node Output Actions Implementation ---
      getNodeOutput: (nodeId: string) => {
          return get().nodeOutputs[nodeId] || {};
      },

      updateNodeOutput: (nodeId: string, output: any) => {
          set(state => ({
              nodeOutputs: { ...state.nodeOutputs, [nodeId]: output }
          }));
      },

      generateWorkflowFromPrompt: async (prompt) => {
        set({ isAIGenerating: true });
        
        try {
          // 使用process.env来获取环境变量，兼容Vite的环境变量处理
          const apiKey = (process.env as any).GEMINI_API_KEY || '';
          
          if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
            // 如果没有API密钥，使用模拟数据生成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 模拟生成工作流
            const newNodes = [
              {
                id: '1',
                type: WorkflowNodeType.START,
                position: { x: 250, y: 50 },
                data: { 
                  label: '流程开始', 
                  description: 'Webhook 触发',
                  config: { 
                    devMode: true,
                    devInput: DEFAULT_DEV_INPUT
                  } 
                },
              },
              {
                id: '2',
                type: WorkflowNodeType.CONDITION,
                position: { x: 250, y: 200 },
                data: { 
                  label: '条件判断', 
                  description: '判断是否需要审批',
                  config: { 
                    expression: 'amount > 1000',
                    conditionGroups: []
                  } 
                },
              },
              {
                id: '3',
                type: WorkflowNodeType.APPROVAL,
                position: { x: 450, y: 350 },
                data: { 
                  label: '审批节点', 
                  description: '经理审批',
                  config: { 
                    approver: 'manager',
                    approvalType: 'single',
                    formTitle: '费用审批单'
                  } 
                },
              },
              {
                id: '4',
                type: WorkflowNodeType.NOTIFICATION,
                position: { x: 50, y: 350 },
                data: { 
                  label: '通知节点', 
                  description: '发送通知',
                  config: { 
                    channel: 'feishu',
                    recipients: 'requester'
                  } 
                },
              },
              {
                id: '5',
                type: WorkflowNodeType.END,
                position: { x: 250, y: 500 },
                data: { 
                  label: '流程结束', 
                  description: '工作流结束'
                },
              }
            ];
            
            const newEdges = [
              { id: 'e1-2', source: '1', target: '2', type: 'custom', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
              { id: 'e2-3', source: '2', target: '3', sourceHandle: 'true', type: 'custom', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
              { id: 'e2-4', source: '2', target: '4', sourceHandle: 'false', type: 'custom', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
              { id: 'e3-5', source: '3', target: '5', type: 'custom', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
              { id: 'e4-5', source: '4', target: '5', type: 'custom', animated: true, markerEnd: { type: MarkerType.ArrowClosed } }
            ];
            
            set({ nodes: newNodes, edges: newEdges });
          } else {
            // 真实调用Gemini API生成工作流
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `根据用户需求生成工作流配置，返回JSON格式。用户需求：${prompt}\n\n可用节点类型：${Object.values(WorkflowNodeType).join(', ')}\n\n返回格式：{"nodes": [...], "edges": [...]}`
                  }]
                }]
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              const generatedContent = data.candidates[0].content.parts[0].text;
              
              // 解析生成的工作流配置
              const workflowConfig = JSON.parse(generatedContent);
              if (workflowConfig.nodes && workflowConfig.edges) {
                set({ nodes: workflowConfig.nodes, edges: workflowConfig.edges });
              }
            }
          }
        } catch (error) {
          console.error('生成工作流失败:', error);
          // 生成失败时，显示错误信息并重置为初始状态
          set({ 
            nodes: initialNodes, 
            edges: initialEdges 
          });
        } finally {
          set({ isAIGenerating: false });
        }
      },

      setWorkflow: (nodes, edges, activeCategoryId, categories) => {
        set((state) => ({ 
          nodes, 
          edges,
          activeCategoryId: activeCategoryId || state.activeCategoryId,
          categories: categories || state.categories
        }));
      },

      aiAutocompleteConfig: async (field, context) => {
          await new Promise(resolve => setTimeout(resolve, 800));
          return `AI 智能填充: ${field}`;
      },

      // --- Settings Actions Implementation ---
      toggleSettings: (isOpen) => set((state) => ({ 
        isSettingsOpen: isOpen !== undefined ? isOpen : !state.isSettingsOpen 
      })),

      setActiveCategory: (id) => set({ activeCategoryId: id }),

      addCategory: (category) => set((state) => ({
          categories: [...state.categories, category],
          activeCategoryId: category.id // Auto select new
      })),

      updateCategory: (id, updates) => set((state) => ({
          categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      deleteCategory: (id) => set((state) => {
          const isActive = state.activeCategoryId === id;
          const newCategories = state.categories.filter(c => c.id !== id);
          return {
              categories: newCategories,
              activeCategoryId: isActive ? 'general' : state.activeCategoryId
          }
      })
    }),
    {
      name: 'workflow-storage', // unique name
      storage: createJSONStorage(() => localStorage), // default is localStorage
      partialize: (state) => ({ 
          nodes: state.nodes, 
          edges: state.edges, 
          categories: state.categories,
          activeCategoryId: state.activeCategoryId 
      }),
    }
  )
);

// Helper
function getNodeLabel(nodeType: WorkflowNodeType): string {
    switch (nodeType) {
        case WorkflowNodeType.LOOP: return '循环迭代';
        case WorkflowNodeType.DELAY: return '延时等待';
        case WorkflowNodeType.DATA_OP: return '数据更新';
        case WorkflowNodeType.SCRIPT: return '脚本代码';
        case WorkflowNodeType.APPROVAL: return '审批节点';
        case WorkflowNodeType.CC: return '抄送节点';
        case WorkflowNodeType.CONDITION: return '条件分支';
        case WorkflowNodeType.PARALLEL: return '并行分支';
        case WorkflowNodeType.API_CALL: return 'API 调用';
        case WorkflowNodeType.NOTIFICATION: return '消息通知';
        case WorkflowNodeType.LLM: return 'LLM 模型';
        case WorkflowNodeType.KNOWLEDGE_RETRIEVAL: return '知识库检索';
        case WorkflowNodeType.DOCUMENT_EXTRACTOR: return '文档提取器';
        default: return '新节点';
    }
}

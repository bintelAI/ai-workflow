
import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
  MarkerType,
} from 'reactflow';
import { WorkflowStoreState, WorkflowNodeType, SimulationLog, WorkflowCategory } from '../../../types';

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

export const useWorkflowStore = create<WorkflowStoreState>((set, get) => ({
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
      data: { label, description: '插入的新节点', config },
    };

    const newEdge1 = {
      id: `e${edgeMenu.sourceId}-${newNodeId}`,
      source: edgeMenu.sourceId,
      target: newNodeId,
      sourceHandle: oldEdge?.sourceHandle,
      type: 'custom',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed }
    };
    
    let sourceHandleForSecondEdge: string | undefined = undefined;
    if (nodeType === WorkflowNodeType.PARALLEL) {
        sourceHandleForSecondEdge = 'branch-0'; 
    }

    const newEdge2 = {
      id: `e${newNodeId}-${edgeMenu.targetId}`,
      source: newNodeId,
      target: edgeMenu.targetId,
      sourceHandle: sourceHandleForSecondEdge,
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
  openNodeAppendMenu: (sourceNodeId, position) => {
    get().closeEdgeMenu(); // Ensure edge menu is closed
    set({
        nodeMenu: {
            isOpen: true,
            sourceNodeId,
            position
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
      if (!nodeMenu.sourceNodeId) return;

      const sourceNode = nodes.find(n => n.id === nodeMenu.sourceNodeId);
      if (!sourceNode) return;

      const newNodeId = `${nodeType}_${Date.now()}`;
      
      // Offset calculation
      const newNodePosition = {
          x: sourceNode.position.x,
          y: sourceNode.position.y + 150, 
      };

      let label = getNodeLabel(nodeType);
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
          parentNode: sourceNode.parentNode,
          extent: sourceNode.parentNode ? "parent" : undefined,
          style: nodeType === WorkflowNodeType.LOOP ? { width: 350, height: 250 } : undefined,
          data: { label, description: '追加的新节点', config },
      };
      
      const newEdge = {
          id: `e${nodeMenu.sourceNodeId}-${newNodeId}`,
          source: nodeMenu.sourceNodeId,
          target: newNodeId,
          type: 'custom',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed }
      };

      set({
          nodes: [...nodes, newNode],
          edges: [...edges, newEdge],
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
        if (!loop.data.config?.targetArray) {
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

  runSimulation: (customInput?: string) => {
      const { nodes, edges } = get();
      const logs: SimulationLog[] = [];
      const executionStatus: Record<string, 'success' | 'failed' | 'running' | 'idle'> = {};
      const nodeOutputs: Record<string, any> = {};

      const startNode = nodes.find(n => n.type === WorkflowNodeType.START);
      if (!startNode) return;

      set({ nodeExecutionStatus: {}, nodeOutputs: {} });

      // Helper to retrieve variable value from object path "a.b.c"
      const getVariableValue = (obj: any, path: string) => {
          if(!path) return undefined;
          // Handle 'loop.item' special case handled inside the loop logic
          if(path === 'payload') return obj.payload;
          
          const parts = path.split('.');
          let current = obj;
          for (const part of parts) {
              if (current === undefined || current === null) return undefined;
              current = current[part];
          }
          return current;
      };

      // Queue system
      const queue: { nodeId: string, incomingData: any }[] = [];
      
      let startTime = Date.now();
      let initialPayload = { order_id: 'ORD-2024-001', amount: 8500 };
      
      // Parse initial input
      if (customInput) {
          try { initialPayload = JSON.parse(customInput); } catch(e) {}
      } else if (startNode.data.config?.devInput) {
          try { initialPayload = JSON.parse(startNode.data.config.devInput); } catch (e) {}
      }

      // Initial Data Context
      const globalContext = {
          payload: initialPayload,
          steps: {}
      };

      queue.push({ 
          nodeId: startNode.id, 
          incomingData: { ...globalContext }
      });

      let steps = 0;
      const MAX_STEPS = 100;

      while (queue.length > 0 && steps < MAX_STEPS) {
          steps++;
          const currentItem = queue.shift();
          if (!currentItem) break;

          const { nodeId, incomingData } = currentItem;
          const node = nodes.find(n => n.id === nodeId);
          if (!node) continue;
          
          let isSuccess = true;
          let errorMessage = undefined;
          let outputData: Record<string, any> = {};

          // --- NODE EXECUTION LOGIC ---
          const config = node.data.config || {};
          const duration = Math.floor(Math.random() * 200) + 20;
          startTime += duration;

          let targetArrayPath = '';
          let arrayData: any = [];
          
          if (node.type === WorkflowNodeType.LOOP) {
              // 1. Get Target Array
              targetArrayPath = (config as any).targetArray || '';
              // Remove 'payload.' prefix if exists for easier lookup in current context or use helper
              arrayData = getVariableValue(incomingData, targetArrayPath);

              if (!Array.isArray(arrayData)) {
                  isSuccess = false;
                  errorMessage = `循环目标不是数组: ${targetArrayPath} = ${JSON.stringify(arrayData)}`;
                  outputData = { error: 'Invalid Array' };
              } else {
                  // 2. Iterate
                  const loopResults = [];
                  // Find start nodes inside the loop (nodes with no incoming edges FROM INSIDE the loop)
                  // For simplicity in this flat simulation, we just find nodes with parentNode === loop.id
                  // And we assume a linear execution inside for the demo, or just "process" them.
                  
                  const childNodes = nodes.filter(n => n.parentNode === node.id);
                  
                  if (childNodes.length > 0) {
                      // We will simulate the loop by creating virtual logs for children
                      // NOTE: A real recursive engine is complex. We will mock the children execution here.
                      
                      for (let i = 0; i < arrayData.length; i++) {
                          const item = arrayData[i];
                          const loopContext = { ...incomingData, loop: { item: item, index: i } };
                          
                          // Mock execution of children
                          childNodes.forEach(child => {
                              logs.push({
                                  stepId: `step-${Date.now()}-${steps}-loop${i}-${child.id}`,
                                  nodeId: child.id,
                                  nodeType: child.type as WorkflowNodeType,
                                  nodeLabel: `${child.data.label} (Item ${i+1})`,
                                  status: 'success',
                                  timestamp: new Date(startTime).toLocaleTimeString(),
                                  duration: 10,
                                  input: { item: item },
                                  output: { processed: true },
                                  loopIndex: i
                              });
                              executionStatus[child.id] = 'success';
                          });
                          
                          loopResults.push({ index: i, result: 'processed' });
                      }
                  }
                  outputData = { loop_results: loopResults, count: arrayData.length };
              }

          } else if (node.type === WorkflowNodeType.SCRIPT) {
              // Simple script mock
              outputData = { result: "Script Executed" };
          } else {
              // Standard Nodes Logic (from previous impl)
              outputData = { processed: true };
          }

          // Log the main node (Loop itself or others) with realistic input/output
          let logInput = {};
          let logOutput = {};
          
          // Set realistic input based on node type
          if (node.type === WorkflowNodeType.START) {
              logInput = incomingData.payload; // Start node receives the payload directly
              logOutput = { next_step: true };
          } else if (node.type === WorkflowNodeType.LOOP) {
              logInput = {
                  target_array: targetArrayPath,
                  array_data: arrayData
              };
              logOutput = outputData; // Directly use loop output
          } else if (node.type === WorkflowNodeType.SCRIPT) {
              logInput = {
                  script_config: config,
                  context: incomingData.payload
              };
              logOutput = outputData; // Directly use script output
          } else if (node.type === WorkflowNodeType.API_CALL) {
              // Helper function to replace variables in strings
              const replaceVariables = (str: string, variables: any) => {
                  if (typeof str !== 'string') return str;
                  return str.replace(/\{\{(.*?)\}\}/g, (match, variableName) => {
                      const trimmedName = variableName.trim();
                      // Check if variable exists in payload
                      if (variables.payload && trimmedName in variables.payload) {
                          return variables.payload[trimmedName];
                      }
                      // Check if variable exists in steps output
                      if (variables.steps && trimmedName in variables.steps) {
                          return variables.steps[trimmedName];
                      }
                      // Check if variable exists in nodes output
                      if (variables.nodes && trimmedName in variables.nodes) {
                          return variables.nodes[trimmedName];
                      }
                      // Check if variable is "payload"
                      if (trimmedName === 'payload') {
                          return variables.payload;
                      }
                      // Return original match if variable not found
                      return match;
                  });
              };

              // Build URL with query parameters
              let url = config.url || 'https://api.example.com';
              url = replaceVariables(url, incomingData);
              
              const enabledQueryParams = (config.queryParams || []).filter((param: any) => param.enabled);
              if (enabledQueryParams.length > 0) {
                  const queryString = new URLSearchParams(
                      enabledQueryParams.map((param: any) => [
                          replaceVariables(param.key, incomingData),
                          replaceVariables(param.value, incomingData)
                      ])
                  ).toString();
                  url += (url.includes('?') ? '&' : '?') + queryString;
              }

              // Process headers
              const enabledHeaders = (config.headers || []).filter((header: any) => header.enabled);
              const headersObj = enabledHeaders.reduce((acc: any, header: any) => {
                  acc[replaceVariables(header.key, incomingData)] = replaceVariables(header.value, incomingData);
                  return acc;
              }, {});

              // Process authentication
              const authConfig = config.auth || { type: 'none' };
              if (authConfig.type === 'basic') {
                  const username = replaceVariables(authConfig.username || '', incomingData);
                  const password = replaceVariables(authConfig.password || '', incomingData);
                  const credentials = btoa(`${username}:${password}`);
                  headersObj['Authorization'] = `Basic ${credentials}`;
              } else if (authConfig.type === 'bearer') {
                  const token = replaceVariables(authConfig.token || '', incomingData);
                  headersObj['Authorization'] = `Bearer ${token}`;
              } else if (authConfig.type === 'api_key') {
                  const apiKey = replaceVariables(authConfig.apiKey || '', incomingData);
                  const apiKeyName = replaceVariables(authConfig.apiKeyName || 'X-API-Key', incomingData);
                  if (authConfig.apiKeyLocation === 'header') {
                      headersObj[apiKeyName] = apiKey;
                  } else if (authConfig.apiKeyLocation === 'query') {
                      const apiKeyParam = `${apiKeyName}=${apiKey}`;
                      url += (url.includes('?') ? '&' : '?') + apiKeyParam;
                  }
              }

              // Process body based on body type
              let requestBody = incomingData.payload;
              if (config.bodyType === 'json') {
                  try {
                      const bodyStr = replaceVariables(config.body || '', incomingData);
                      requestBody = bodyStr ? JSON.parse(bodyStr) : requestBody;
                  } catch (e) {
                      // Invalid JSON, use as is
                  }
              } else if (config.bodyType === 'x-www-form-urlencoded') {
                  try {
                      const bodyStr = replaceVariables(config.body || '', incomingData);
                      const formData = new URLSearchParams(bodyStr);
                      requestBody = formData.toString();
                  } catch (e) {
                      // Invalid form data, use as is
                  }
              } else if (config.body) {
                  requestBody = replaceVariables(config.body, incomingData);
              }

              // Mock API call execution
              const mockResponse = {
                  status: 200,
                  data: requestBody,
                  headers: {
                      'Content-Type': 'application/json',
                      'X-Request-ID': Math.random().toString(36).substring(2, 15)
                  }
              };

              // Apply response handling
              let processedResponse = mockResponse.data;
              if (config.responseHandling?.extractPath) {
                  try {
                      // Simple dot notation extraction
                      const pathParts = config.responseHandling.extractPath.split('.');
                      processedResponse = pathParts.reduce((acc: any, part: string) => {
                          return acc ? acc[part] : acc;
                      }, mockResponse.data);
                  } catch (e) {
                      // Extraction failed, use full response
                  }
              }

              logInput = {
                  api_url: url,
                  method: config.method || 'GET',
                  headers: headersObj,
                  body: requestBody,
                  bodyType: config.bodyType || 'none',
                  timeout: config.timeout || 30000,
                  retryConfig: config.retry || { enabled: false }
              };
              logOutput = {
                  status: mockResponse.status,
                  data: processedResponse,
                  headers: mockResponse.headers,
                  response_time: duration,
                  originalUrl: config.url || 'https://api.example.com'
              };
          } else if (node.type === WorkflowNodeType.CONDITION) {
              // 条件节点处理
              const expression = config.expression || 'true';
              
              // 执行条件表达式
              let conditionResult = false;
              try {
                  // 使用Function构造器执行条件表达式，传入上下文
                  const evalContext = {
                      ...incomingData.payload,
                      ...incomingData.steps,
                      ...incomingData.nodes,
                      payload: incomingData.payload
                  };
                  
                  // 构建函数体，将上下文变量作为参数传入
                  const funcBody = `return ${expression};`;
                  const conditionFunc = new Function(...Object.keys(evalContext), funcBody);
                  conditionResult = conditionFunc(...Object.values(evalContext));
                  
                  // 更新isSuccess为条件结果
                  isSuccess = !!conditionResult;
              } catch (error) {
                  isSuccess = false;
                  errorMessage = `条件表达式执行错误: ${error instanceof Error ? error.message : String(error)}`;
                  console.error('条件表达式执行错误:', error);
              }
              
              // 增强条件节点的输入输出监控
              logInput = {
                  expression: expression,
                  condition_groups: config.conditionGroups || [],
                  data: incomingData.payload,
                  context_data: incomingData.nodes || {},
                  workflow_context: {
                      step_count: steps,
                      timestamp: new Date(startTime).toISOString()
                  }
              };
              
              logOutput = {
                  result: isSuccess,
                  next_path: isSuccess ? 'true' : 'false',
                  condition_expression: expression,
                  condition_result: conditionResult,
                  evaluation_context: {
                      payload_keys: Object.keys(incomingData.payload),
                      has_context_data: Object.keys(incomingData.nodes || {}).length > 0
                  },
                  metrics: {
                      processing_time: duration
                  }
              };
          } else if (node.type === WorkflowNodeType.APPROVAL) {
              // 增强审批节点的输入数据监控
              logInput = {
                  approvers: config.approver || 'manager',
                  approval_type: config.approvalType || 'single',
                  approval_strategy: config.approvalStrategy || 'all',
                  timeout: `${config.timeout || 24} ${config.timeoutUnit || 'hours'}`,
                  form_title: config.formTitle || '审批单',
                  field_config: config.fieldConfig || {},
                  button_config: config.buttonConfig || {},
                  request: incomingData.payload, // 完整的请求数据
                  context_data: incomingData.nodes || {}, // 上游节点的输出数据
                  workflow_context: {
                      step_count: steps,
                      timestamp: new Date(startTime).toISOString()
                  }
              };
              
              // 增强审批节点的输出数据监控
              logOutput = {
                  approved: isSuccess,
                  comment: isSuccess ? 'Approved' : 'Rejected',
                  approver: config.approver || 'manager',
                  approval_time: `${duration}ms`,
                  approval_duration: duration,
                  form_title: config.formTitle || '审批单',
                  original_request: incomingData.payload, // 保留原始请求数据
                  processed_data: {
                      ...incomingData.payload, // 处理后的数据，这里简单复制，实际会根据审批结果修改
                      approval_result: isSuccess ? 'approved' : 'rejected',
                      approval_time: new Date(startTime).toISOString(),
                      approver: config.approver || 'manager'
                  },
                  notifications: {
                      approval_notice_sent: config.sendApprovalNotice !== false,
                      timeout_notice_sent: config.sendTimeoutNotice !== false,
                      recipients: config.noticeRecipient || 'requester'
                  },
                  metrics: {
                      processing_time: duration,
                      step_number: steps
                  }
              };
          } else {
              // For other node types, use simplified input/output
              logInput = incomingData.payload;
              logOutput = outputData;
          }
          
          // Add error information if failed
          if (!isSuccess && errorMessage) {
              logOutput = {
                  ...logOutput,
                  error: errorMessage
              };
          }
          
          logs.push({
              stepId: `step-${Date.now()}-${steps}-${node.id}`,
              nodeId: node.id,
              nodeType: node.type as WorkflowNodeType,
              nodeLabel: node.data.label,
              status: isSuccess ? 'success' : 'failed',
              timestamp: new Date(startTime).toLocaleTimeString(),
              duration: duration,
              input: logInput, // Realistic input
              output: logOutput, // Realistic output
              errorMessage: errorMessage
          });

          // Store node output for later use
          nodeOutputs[node.id] = logOutput;

          executionStatus[node.id] = isSuccess ? 'success' : 'failed';

          // Continue traversal
          if (isSuccess) {
              const nextData = { 
                  ...incomingData, 
                  steps: { ...incomingData.steps, [node.id]: outputData },
                  nodes: { ...incomingData.nodes, [node.id]: logOutput } // Add node outputs to context
              };

              const outgoingEdges = edges.filter(e => e.source === nodeId);
              outgoingEdges.forEach(edge => {
                   // Avoid adding nodes that are inside the loop if we are currently "outside" processing
                   // But here edges are explicit.
                   queue.push({ nodeId: edge.target, incomingData: nextData });
              });
          }
      }

      set({ 
          simulationLogs: logs, 
          isDrawerOpen: true,
          nodeExecutionStatus: executionStatus,
          nodeOutputs: nodeOutputs // Update store with node outputs
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

}));

// Helper
function getNodeLabel(nodeType: WorkflowNodeType): string {
    switch (nodeType) {
        case WorkflowNodeType.LOOP: return '循环执行';
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
        default: return '新节点';
    }
}

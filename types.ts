
import { Node, Edge } from 'reactflow';

export enum WorkflowNodeType {
  START = 'start',
  END = 'end',
  APPROVAL = 'approval',
  CC = 'cc',
  CONDITION = 'condition',
  API_CALL = 'api_call',
  NOTIFICATION = 'notification',
  DELAY = 'delay',
  DATA_OP = 'data_op',
  SCRIPT = 'script',
  PARALLEL = 'parallel',
  LLM = 'llm',
  LOOP = 'loop', // Added Loop Node
}

// API Call Node Configuration Interfaces
export interface AuthConfig {
  type: 'none' | 'basic' | 'api_key' | 'bearer' | 'oauth2';
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyName?: string;
  apiKeyLocation?: 'header' | 'query';
  token?: string;
  oauth2Config?: {
    clientId?: string;
    clientSecret?: string;
    tokenUrl?: string;
    scope?: string;
  };
}

export interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface HeaderParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RetryConfig {
  enabled: boolean;
  maxRetries: number;
  delay: number; // ms
  retryOnStatusCodes: number[];
}

export interface ResponseHandling {
  followRedirects: boolean;
  parseResponse: boolean;
  extractPath?: string;
  statusCodeBranching: boolean;
}

export interface APICallConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE';
  url: string;
  queryParams: QueryParam[];
  headers: HeaderParam[];
  bodyType: 'none' | 'json' | 'form' | 'x-www-form-urlencoded' | 'raw' | 'binary';
  body: string;
  auth: AuthConfig;
  timeout: number; // ms
  retry: RetryConfig;
  responseHandling: ResponseHandling;
}

export interface NodeData {
  label: string;
  description?: string;
  config?: APICallConfig | Record<string, any>;
  icon?: string;
  status?: 'idle' | 'running' | 'completed' | 'error';
}

export type WorkflowNode = Node<NodeData>;
export type WorkflowEdge = Edge;

// Edge Menu State Interface
export interface EdgeMenuState {
  isOpen: boolean;
  edgeId: string | null;
  position: { x: number; y: number } | null;
  sourceId: string | null;
  targetId: string | null;
}

// Node Menu State (for appending after a node)
export interface NodeMenuState {
  isOpen: boolean;
  sourceNodeId: string | null;
  position: { x: number; y: number } | null;
}

// Simulation Log Interface
export interface SimulationLog {
  stepId: string;
  nodeId: string;
  nodeType: WorkflowNodeType;
  nodeLabel: string;
  status: 'success' | 'running' | 'failed' | 'skipped';
  timestamp: string;
  duration: number; // ms
  input: Record<string, any>;
  output: Record<string, any>;
  errorMessage?: string;
  loopIndex?: number; // Added for loop iteration tracking
}

// --- NEW: Workflow Category Definition ---
export interface WorkflowCategory {
    id: string;
    name: string;
    description: string;
    allowedNodeTypes: WorkflowNodeType[];
    isSystem?: boolean; // System types cannot be deleted
}

export interface WorkflowStoreState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  
  // Edge Menu State
  edgeMenu: EdgeMenuState;
  
  // Node Menu State
  nodeMenu: NodeMenuState;
  
  // Simulation / Drawer State
  isDrawerOpen: boolean;
  simulationLogs: SimulationLog[];
  nodeExecutionStatus: Record<string, 'success' | 'failed' | 'running' | 'idle'>; 
  
  // AI State
  isAIGenerating: boolean;

  // --- NEW: Node Output Tracking ---
  nodeOutputs: Record<string, any>; // Store output data for each node

  // --- NEW: Settings & Categories State ---
  isSettingsOpen: boolean;
  categories: WorkflowCategory[];
  activeCategoryId: string;
  
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  addNode: (node: WorkflowNode) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  setSelectedNode: (id: string | null) => void;
  deleteNode: (id: string) => void;
  
  // Drag Handling for Parenting
  onNodeDragStop: (event: any, node: WorkflowNode, allNodes: WorkflowNode[]) => void;

  // Edge Menu Actions
  openEdgeMenu: (edgeId: string, position: { x: number; y: number }, sourceId: string, targetId: string) => void;
  closeEdgeMenu: () => void;
  insertNodeBetween: (nodeType: WorkflowNodeType) => void;
  
  // Node Menu Actions
  openNodeAppendMenu: (sourceNodeId: string, position: { x: number; y: number }) => void;
  closeNodeMenu: () => void;
  appendNode: (nodeType: WorkflowNodeType) => void;
  
  // Validation
  validateWorkflow: () => string[];

  // Simulation Actions
  toggleDrawer: (isOpen?: boolean) => void;
  runSimulation: (customInput?: string) => void; 
  resetSimulation: () => void; 
  
  // --- NEW: Node Output Actions ---
  getNodeOutput: (nodeId: string) => any;
  updateNodeOutput: (nodeId: string, output: any) => void;
  
  // AI Actions
  generateWorkflowFromPrompt: (prompt: string) => Promise<void>;
  aiAutocompleteConfig: (field: string, context: string) => Promise<string>;

  // --- NEW: Settings Actions ---
  toggleSettings: (isOpen?: boolean) => void;
  setActiveCategory: (id: string) => void;
  addCategory: (category: WorkflowCategory) => void;
  updateCategory: (id: string, updates: Partial<WorkflowCategory>) => void;
  deleteCategory: (id: string) => void;
}

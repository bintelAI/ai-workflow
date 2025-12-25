import { Node, Edge } from 'reactflow'

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
  KNOWLEDGE_RETRIEVAL = 'knowledge_retrieval',
  DOCUMENT_EXTRACTOR = 'document_extractor',
  LOOP = 'loop',
  SQL = 'sql',
  CLOUD_PHONE = 'cloud_phone',
  STORAGE = 'storage',
}

// API Call Node Configuration Interfaces
export interface AuthConfig {
  type: 'none' | 'basic' | 'api_key' | 'bearer' | 'oauth2'
  username?: string
  password?: string
  apiKey?: string
  apiKeyName?: string
  apiKeyLocation?: 'header' | 'query'
  token?: string
  oauth2Config?: {
    clientId?: string
    clientSecret?: string
    tokenUrl?: string
    scope?: string
  }
}

export interface QueryParam {
  key: string
  value: string
  enabled: boolean
}

export interface HeaderParam {
  key: string
  value: string
  enabled: boolean
}

export interface RetryConfig {
  enabled: boolean
  maxRetries: number
  delay: number // ms
  retryOnStatusCodes: number[]
}

export interface ResponseHandling {
  followRedirects: boolean
  parseResponse: boolean
  extractPath?: string
  statusCodeBranching: boolean
}

export interface APICallConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE'
  url: string
  queryParams: QueryParam[]
  headers: HeaderParam[]
  bodyType: 'none' | 'json' | 'form' | 'x-www-form-urlencoded' | 'raw' | 'binary'
  body: string
  bodyParams: QueryParam[]
  auth: AuthConfig
  timeout: number // ms
  retry: RetryConfig
  responseHandling: ResponseHandling
}

export interface SQLConfig {
  sql: string
  databaseId: string
  returnSingleRecord: boolean
  unsafeMode: boolean
}

export interface CloudPhoneConfig {
  phoneId: string
  operationContent: string
  timeout?: number
}

export type StorageProvider = 'local' | 'aliyun' | 'tencent' | 'aws' | 'qiniu'

export interface StorageConfig {
  provider: StorageProvider
  fileExtensions: string[]
  aliyunConfig?: {
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    region: string
    endpoint?: string
  }
  tencentConfig?: {
    secretId: string
    secretKey: string
    bucket: string
    region: string
  }
  awsConfig?: {
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    region: string
  }
  qiniuConfig?: {
    accessKey: string
    secretKey: string
    bucket: string
    domain: string
  }
}

export interface NodeData {
  label: string
  description?: string
  config?: APICallConfig | SQLConfig | CloudPhoneConfig | StorageConfig | Record<string, any>
  icon?: string
  status?: 'idle' | 'running' | 'completed' | 'error'
}

export type WorkflowNode = Node<NodeData>
export type WorkflowEdge = Edge

// Edge Menu State Interface
export interface EdgeMenuState {
  isOpen: boolean
  edgeId: string | null
  position: { x: number; y: number } | null
  sourceId: string | null
  targetId: string | null
}

// Node Menu State (for appending after a node)
export interface NodeMenuState {
  isOpen: boolean
  sourceNodeId: string | null
  position: { x: number; y: number } | null // This is menu display position (screen)
  canvasPosition?: { x: number; y: number } | null // This is new node position (canvas)
  parentNodeId?: string | null
}

// Simulation Log Interface
export interface SimulationLog {
  stepId: string
  nodeId: string
  nodeType: WorkflowNodeType
  nodeLabel: string
  status: 'success' | 'running' | 'failed' | 'skipped'
  timestamp: string
  duration: number // ms
  input: Record<string, any>
  output: Record<string, any>
  errorMessage?: string
  loopIndex?: number // Added for loop iteration tracking
}

// Variable Configuration Interfaces
export type VariableType = 'text' | 'paragraph' | 'dropdown' | 'number' | 'checkbox' | 'file' | 'file_list'

export interface VariableOption {
  label: string
  value: string
}

export interface VariableConfig {
  name: string
  displayName: string
  type: VariableType
  required: boolean
  hidden: boolean
  defaultValue?: any
  maxLength?: number
  options?: VariableOption[]
  // File-specific configuration
  allowedFileTypes?: {
    document?: boolean
    image?: boolean
    audio?: boolean
    video?: boolean
    other?: boolean
    customExtensions?: string[]
  }
  uploadType?: 'local' | 'url' | 'both'
}

// --- NEW: Workflow Category Definition ---
export interface WorkflowCategory {
  id: string
  name: string
  description: string
  allowedNodeTypes: WorkflowNodeType[]
  isSystem?: boolean // System types cannot be deleted
}

export interface WorkflowStoreState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNodeId: string | null

  // Edge Menu State
  edgeMenu: EdgeMenuState

  // Node Menu State
  nodeMenu: NodeMenuState

  // Simulation / Drawer State
  isDrawerOpen: boolean
  simulationLogs: SimulationLog[]
  nodeExecutionStatus: Record<string, 'success' | 'failed' | 'running' | 'idle'>

  // AI State
  isAIGenerating: boolean

  // --- NEW: Node Output Tracking ---
  nodeOutputs: Record<string, any> // Store output data for each node

  // --- NEW: Settings & Categories State ---
  isSettingsOpen: boolean
  categories: WorkflowCategory[]
  activeCategoryId: string

  // --- NEW: Global Configuration ---
  isGlobalConfigOpen: boolean
  globalVariables: VariableConfig[]

  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (connection: any) => void
  addNode: (node: WorkflowNode) => void
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  setSelectedNode: (id: string | null) => void
  deleteNode: (id: string) => void

  // Drag Handling for Parenting
  onNodeDragStop: (event: any, node: WorkflowNode, allNodes: WorkflowNode[]) => void

  // Edge Menu Actions
  openEdgeMenu: (
    edgeId: string,
    position: { x: number; y: number },
    sourceId: string,
    targetId: string
  ) => void
  closeEdgeMenu: () => void
  insertNodeBetween: (nodeType: WorkflowNodeType) => void

  // Node Menu Actions
  openNodeAppendMenu: (
    sourceNodeId: string | null,
    position: { x: number; y: number },
    parentNodeId?: string | null,
    canvasPosition?: { x: number; y: number }
  ) => void
  closeNodeMenu: () => void
  appendNode: (nodeType: WorkflowNodeType) => void

  // Validation
  validateWorkflow: () => string[]

  // Simulation Actions
  toggleDrawer: (isOpen?: boolean) => void
  runSimulation: (customInput?: string) => Promise<void>
  resetSimulation: () => void

  // --- NEW: Node Output Actions ---
  getNodeOutput: (nodeId: string) => any
  updateNodeOutput: (nodeId: string, output: any) => void

  // AI Actions
  generateWorkflowFromPrompt: (prompt: string) => Promise<void>
  aiAutocompleteConfig: (field: string, context: string) => Promise<string>

  // --- NEW: Workflow Management ---
  setWorkflow: (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    activeCategoryId?: string,
    categories?: WorkflowCategory[],
    globalVariables?: VariableConfig[]
  ) => void

  // --- NEW: Settings Actions ---
  toggleSettings: (isOpen?: boolean) => void
  setActiveCategory: (id: string) => void
  addCategory: (category: WorkflowCategory) => void
  updateCategory: (id: string, updates: Partial<WorkflowCategory>) => void
  deleteCategory: (id: string) => void

  // --- NEW: Global Configuration Actions ---
  toggleGlobalConfig: (isOpen?: boolean) => void
  setGlobalVariables: (variables: VariableConfig[]) => void
}
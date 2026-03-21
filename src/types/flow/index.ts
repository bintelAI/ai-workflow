export type FlowFieldType = 'string' | 'number' | 'boolean' | 'image' | 'file' | 'select' | 'text' | 'array' | 'json' | 'stream' | 'any' | 'paragraph' | 'object' | 'object[]';

export interface FlowField {
  field: string;
  type?: FlowFieldType;
  value?: string;
  name?: string;
  nodeId?: string;
  nodeType?: string;
  label?: string;
  required?: boolean;
  [key: string]: any;
}

export interface FlowData {
  inputParams?: FlowField[];
  outputParams?: FlowField[];
  options?: Record<string, any>;
  status?: 'idle' | 'running' | 'completed' | 'error' | 'start' | 'end';
  reason?: 'success' | 'cancel' | 'error';
  duration?: number;
  count?: {
    tokenUsage: number;
  };
  result?: any;
  error?: string;
}

export interface FlowNode {
  enable?: boolean;
  id?: string;
  label?: string;
  description?: string;
  desc?: string;
  type?: string;
  icon?: string;
  name?: string;
  position?: {
    x: number;
    y: number;
  };
  data?: FlowData;
  [key: string]: any;
}

export interface FlowEdge {
  id: string;
  type?: string;
  target: string;
  source: string;
  targetHandle?: string | null;
  sourceHandle?: string | null;
  animated?: boolean;
  style?: Record<string, any>;
  [key: string]: any;
}

export interface FlowNodeResult {
  msgType: 'llmStream' | 'tool' | 'node' | 'flow';
  data: FlowNodeResultData | FlowLlmStreamData | FlowToolData | FlowData;
}

export interface FlowNodeResultData {
  status: 'done' | 'running' | 'start' | 'end';
  nodeId: string;
  nodeType: string;
  duration?: number;
  input?: any;
  output?: any;
  success?: boolean;
  result?: {
    success: boolean;
    error?: string;
    [key: string]: any;
  } | any;
  error?: string;
  nextNodeIds?: string[];
}

export interface FlowLlmStreamData {
  isEnd: boolean;
  content: string;
  isThinking: boolean;
  nodeId: string;
}

export interface FlowToolData {
  name: string;
  type: 'start' | 'end';
  nodeId: string;
}

export interface FlowExecutionSummary {
  status: 'start' | 'end';
  reason?: 'success' | 'cancel' | 'error';
  duration?: number;
  count?: {
    tokenUsage: number;
  };
  result?: any;
}

export interface FlowInfoEntity {
  id?: number;
  name?: string;
  label?: string;
  description?: string;
  status?: number;
  type?: number;
  version?: number;
  cover?: string;
  draft?: FlowDraft;
  data?: FlowDraft;
  release?: FlowDraft;
  releaseTime?: Date;
  createTime?: Date;
  updateTime?: Date;
}

export interface FlowDraft {
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport?: { x: number; y: number; zoom: number };
  activeNodeId?: string;
}

export interface FlowRunRequest {
  params?: Record<string, any>;
  label?: string;
  requestId?: string;
  sessionId?: string;
  nodeId?: string;
  flowId?: number;
  teamId?: string | number | null;
  stream?: boolean;
}

export interface FlowConfigResponse {
  model?: {
    options: FlowModelOption[];
    params: {
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  know?: {
    options: FlowKnowledgeOption[];
  };
  [key: string]: any;
}

export interface FlowModelOption {
  label: string;
  value: string;
  provider?: string;
  maxTokens?: number;
}

export interface FlowKnowledgeOption {
  id: number;
  name: string;
  description?: string;
}

export type ConditionOperator = 
  | 'include' 
  | 'exclude' 
  | 'equal' 
  | 'notEqual' 
  | 'greaterThan' 
  | 'lessThan' 
  | 'isNull' 
  | 'isNotNull' 
  | 'startWith' 
  | 'endWith' 
  | 'greaterThanOrEqual' 
  | 'lessThanOrEqual';

export interface ConditionItem {
  field: string;
  nodeId?: string;
  nodeType?: string;
  name?: string;
  condition: ConditionOperator;
  value: string;
  operator?: 'AND' | 'OR';
}

export interface JudgeOptions {
  IF: ConditionItem[];
  ELSE: FlowField[];
}

export interface LLMOptions {
  model: {
    options: FlowModelOption[];
    params: {
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  history: number;
  isOutput: boolean;
  toolConfig?: any[];
  mcpConfig?: any[];
}

export interface CodeOptions {
  code: string;
  type?: 'javascript' | 'python';
}

export interface ClassifyOptions {
  model: {
    configId?: number;
    supplier?: string;
    supplierName?: string;
    params: {
      model: string;
    };
  };
  supplier?: string;
  supplierName?: string;
  configId?: number;
  comm?: any;
  types: string[];
  descriptions: string[];
}

export interface KnowOptions {
  knowIds: number[];
  size: number;
  minScore: number;
}

export interface FlowOptions {
  label: string;
}

export interface ParseOptions {
  type: 'text' | 'json' | 'html';
  selector?: string;
  schema?: Record<string, any>;
  model?: {
    configId?: number;
    supplier?: string;
    supplierName?: string;
    params?: {
      model?: string;
    };
  };
  supplier?: string;
  supplierName?: string;
  configId?: number;
  comm?: any;
}

export const NODE_TYPE_MAP: Record<string, string> = {
  start: 'start',
  end: 'end',
  llm: 'llm',
  script: 'code',
  condition: 'judge',
  question_classifier: 'classify',
  knowledge_retrieval: 'know',
  variable: 'variable',
  json_parse: 'json',
  smart_parse: 'parse',
  flow_call: 'flow',
  api_call: 'api',
  loop: 'loop',
};

export const REVERSE_NODE_TYPE_MAP: Record<string, string> = {
  start: 'start',
  end: 'end',
  llm: 'llm',
  code: 'script',
  judge: 'condition',
  classify: 'question_classifier',
  know: 'knowledge_retrieval',
  variable: 'variable',
  json: 'json_parse',
  flow: 'flow_call',
  api: 'api_call',
  parse: 'smart_parse',
  loop: 'loop',
};

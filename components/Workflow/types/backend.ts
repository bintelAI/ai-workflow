export interface BackendInputParam {
  /** 来源节点ID (引用变量时使用) */
  nodeId?: string;
  /** 来源节点类型 */
  nodeType?: string;
  /** 来源变量名 (在上游节点中的输出名) */
  name?: string;
  
  /** 本节点字段名 (映射到 options 中的 key) */
  field?: string;
  /** 字段类型 (string, number, boolean, image, file, select, etc.) */
  type?: string;
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  default?: any;
  /** 固定值 (如果不引用变量) */
  value?: any;
  /** 显示标签 */
  label?: string;
}

export interface BackendOutputParam {
  /** 本节点ID */
  nodeId?: string;
  /** 本节点类型 */
  nodeType?: string;
  /** 输出变量名 (供下游引用) */
  name: string;
  /** 对应的内部字段名 (通常与 name 相同，或者从 result 对象中提取的 key) */
  field?: string;
  /** 字段类型 */
  type: string;
  /** 描述 */
  desc?: string;
}

export interface BackendNodeOptions {
  [key: string]: any;
}

export interface BackendNodeConfig {
  inputParams?: BackendInputParam[];
  outputParams?: BackendOutputParam[];
  options?: BackendNodeOptions;
}

export interface BackendNode {
  id: string;
  type: string;
  label: string;
  desc?: string;
  /** 后端核心数据结构 */
  data: BackendNodeConfig;
  position?: { x: number; y: number };
  /** 前端辅助字段，后端可能不存储或只透传 */
  [key: string]: any;
}

export interface BackendEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  [key: string]: any;
}

export interface BackendWorkflow {
  id?: string | number;
  nodes: BackendNode[];
  edges: BackendEdge[];
  /** 全局配置 */
  config?: any;
}

export interface BackendFlowResult {
  msgType: 'llmStream' | 'tool' | 'node' | 'flow';
  data: {
    status: 'done' | 'running' | 'start' | 'end';
    nodeId: string;
    nodeType: string;
    duration: number;
    result?: {
      success: boolean;
      error?: string;
      result?: any;
    };
    [key: string]: any;
  };
}

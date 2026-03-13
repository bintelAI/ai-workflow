import { Node, Edge } from 'reactflow';
import { 
  FlowField, 
  FlowData, 
  FlowNode, 
  FlowEdge, 
  FlowDraft,
  NODE_TYPE_MAP, 
  REVERSE_NODE_TYPE_MAP,
  ConditionOperator 
} from '@/src/types/flow';
import { WorkflowStoreState, WorkflowNodeType, VariableConfig } from '../types';

const NODE_CONFIG_MAP: Record<string, { color: string; icon: string; group: string; cardWidth: string }> = {
  start: { color: '#409eff', icon: 'start', group: '基础', cardWidth: '430px' },
  end: { color: '#f56c6c', icon: 'end', group: '逻辑', cardWidth: '430px' },
  llm: { color: '#409eff', icon: 'llm', group: 'AI', cardWidth: '430px' },
  code: { color: '#67c23a', icon: 'code', group: '逻辑', cardWidth: '430px' },
  judge: { color: '#e6a23c', icon: 'judge', group: '逻辑', cardWidth: '430px' },
  classify: { color: '#909399', icon: 'classify', group: 'AI', cardWidth: '430px' },
  know: { color: '#409eff', icon: 'know', group: 'AI', cardWidth: '430px' },
  variable: { color: '#909399', icon: 'variable', group: '逻辑', cardWidth: '430px' },
  parse: { color: '#909399', icon: 'parse', group: '逻辑', cardWidth: '430px' },
  flow: { color: '#409eff', icon: 'flow', group: '逻辑', cardWidth: '430px' },
};

const mapNodeType = (frontendType?: string): string => {
  if (!frontendType) return 'unknown';
  return NODE_TYPE_MAP[frontendType] || frontendType.toLowerCase();
};

const mapToBackendType = (backendType?: string): string => {
  if (!backendType) return 'unknown';
  return REVERSE_NODE_TYPE_MAP[backendType] || backendType;
};

export const exportToBackend = (workflow: WorkflowStoreState): FlowDraft => {
  const { nodes, edges } = workflow;
  const backendNodes = nodes.map((node, index) => convertNodeToBackend(node, nodes, index));
  const backendEdges = edges.map((edge, index) => convertEdgeToBackend(edge, index));

  return {
    nodes: backendNodes,
    edges: backendEdges,
    viewport: { x: 0, y: 0, zoom: 1 },
  };
};

const convertNodeToBackend = (node: Node, allNodes: Node[], index: number): FlowNode => {
  const backendType = mapNodeType(node.type);
  const data = convertNodeData(node, allNodes, backendType);
  const config = NODE_CONFIG_MAP[backendType] || { color: '#909399', icon: 'node', group: '其他', cardWidth: '430px' };

  return {
    id: node.id,
    type: backendType,
    initialized: false,
    position: node.position,
    data,
    label: node.data?.label || node.type || 'Node',
    description: node.data?.description || '',
    color: config.color,
    handle: backendType === 'start' ? { target: false } : backendType === 'end' ? { source: false } : {},
    name: `node-${backendType}`,
    icon: config.icon,
    cardWidth: config.cardWidth,
    _index: index + 1,
  };
};

const convertEdgeToBackend = (edge: Edge, index: number): FlowEdge => ({
  id: edge.id || `vueflow__edge-${edge.source}${edge.sourceHandle || ''}-${edge.target}${edge.targetHandle || ''}`,
  type: edge.type || 'button',
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.sourceHandle || null,
  targetHandle: edge.targetHandle || null,
  updatable: true,
  data: {},
  label: '',
  animated: edge.animated || false,
  style: edge.style || {},
  _stroke: '#4165d7',
});

const convertNodeData = (node: Node, allNodes: Node[], backendType: string): FlowData => {
  const config = node.data?.config || {};
  
  switch (node.type) {
    case WorkflowNodeType.START:
      return convertStartNodeData(config);
    case WorkflowNodeType.END:
      return convertEndNodeData(config, allNodes);
    case WorkflowNodeType.LLM:
      return convertLLMNodeData(config, allNodes);
    case WorkflowNodeType.SCRIPT:
      return convertCodeNodeData(config, allNodes);
    case WorkflowNodeType.CONDITION:
      return convertJudgeNodeData(config, allNodes);
    case WorkflowNodeType.QUESTION_CLASSIFIER:
      return convertClassifyNodeData(config, allNodes);
    case WorkflowNodeType.KNOWLEDGE_RETRIEVAL:
      return convertKnowNodeData(config, allNodes);
    case WorkflowNodeType.DATA_OP:
      return convertVariableNodeData(config, allNodes);
    case WorkflowNodeType.DOCUMENT_EXTRACTOR:
      return convertParseNodeData(config, allNodes);
    case WorkflowNodeType.LOOP:
      return convertFlowNodeData(config);
    default:
      return {
        inputParams: [],
        outputParams: [],
        options: config,
      };
  }
};

const convertStartNodeData = (config: any): FlowData => {
  const variables: VariableConfig[] = config?.variables || [];
  
  const inputParams: FlowField[] = variables.map(v => ({
    field: v.name,
    name: v.name,
    type: v.type,
    required: v.required,
    label: v.displayName || v.name,
    value: v.defaultValue,
  }));

  return {
    inputParams,
    outputParams: [],
    options: {
      devMode: config?.devMode,
      devInput: config?.devInput,
    },
  };
};

const convertEndNodeData = (config: any, allNodes: Node[]): FlowData => {
  const outputs: Array<{ key: string; value: string }> = config?.outputs || [];
  
  const inputParams: FlowField[] = outputs.map(out => {
    const refs = extractVariableRefs(out.value, allNodes);
    if (refs.length > 0) {
      return {
        ...refs[0],
        field: out.key,
      };
    }
    return {
      field: out.key,
      value: out.value,
      type: 'string',
    };
  });

  const outputParams: FlowField[] = outputs.map(out => ({
    name: out.key,
    field: out.key,
    type: 'any',
  }));

  return {
    inputParams,
    outputParams,
    options: {},
  };
};

const convertLLMNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { model, temperature, systemPrompt, userPrompt, history, isOutput } = config || {};
  
  const inputParams: FlowField[] = [];
  const sysVars = extractVariableRefs(systemPrompt, allNodes);
  const userVars = extractVariableRefs(userPrompt, allNodes);
  
  const varMap = new Map<string, FlowField>();
  [...sysVars, ...userVars].forEach(p => {
    if (p.name) varMap.set(p.name, p);
  });
  inputParams.push(...Array.from(varMap.values()));

  const messages = [
    { role: 'system', content: systemPrompt || '' },
    { role: 'user', content: userPrompt || '' },
  ];

  return {
    inputParams: [{ field: 'input', ...inputParams[0] }],
    outputParams: [
      { type: 'string', field: 'text' },
      { type: 'stream', field: 'stream' },
    ],
    options: {
      model: {
        options: [],
        params: {
          model: model || '',
          temperature: temperature ?? 0.7,
        },
      },
      messages,
      history: history || 0,
      isOutput: isOutput !== false,
      toolConfig: config?.toolConfig || [],
      mcpConfig: config?.mcpConfig || [],
    },
  };
};

const convertCodeNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { code, inputVariables, outputField, language } = config || {};
  
  const inputParams: FlowField[] = [];
  if (Array.isArray(inputVariables)) {
    inputVariables.forEach((item: { key: string; value: string }) => {
      const refs = extractVariableRefs(item.value, allNodes);
      if (refs.length > 0) {
        inputParams.push({
          ...refs[0],
          field: item.key,
        });
      } else {
        inputParams.push({
          field: item.key,
          value: item.value,
          type: 'string',
        });
      }
    });
  }

  let wrappedCode = code || '';
  if (language === 'javascript' && !wrappedCode.includes('class Cool')) {
    wrappedCode = `import { Base } from '@cool/code';

export class Cool extends Base {
  async main(params) {
    ${code}
  }
}`;
  }

  return {
    inputParams,
    outputParams: [
      { name: 'result', field: 'result', type: 'any' },
    ],
    options: {
      code: wrappedCode,
      type: language || 'javascript',
    },
  };
};

const convertJudgeNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { conditionGroups } = config || {};
  
  const IF: any[] = [];
  
  if (Array.isArray(conditionGroups)) {
    conditionGroups.forEach((group: any, groupIndex: number) => {
      const conditions = group?.conditions || [];
      conditions.forEach((cond: any, condIndex: number) => {
        const refs = extractVariableRefs(cond.variable, allNodes);
        IF.push({
          field: cond.variable?.split('.')?.pop() || '',
          nodeId: refs[0]?.nodeId || '',
          nodeType: refs[0]?.nodeType || '',
          name: refs[0]?.name || '',
          condition: mapConditionOperator(cond.operator),
          value: cond.value || '',
          operator: condIndex < conditions.length - 1 ? (cond.logic || 'AND') : undefined,
        });
      });
    });
  }

  return {
    inputParams: [],
    outputParams: [{ type: 'boolean', field: 'result' }],
    options: {
      IF,
      ELSE: [],
    },
  };
};

const mapConditionOperator = (operator: string): ConditionOperator => {
  const operatorMap: Record<string, ConditionOperator> = {
    'equals': 'equal',
    'not_equals': 'notEqual',
    'contains': 'include',
    'not_contains': 'exclude',
    'starts_with': 'startWith',
    'ends_with': 'endWith',
    'greater_than': 'greaterThan',
    'less_than': 'lessThan',
    'greater_than_or_equal': 'greaterThanOrEqual',
    'less_than_or_equal': 'lessThanOrEqual',
    'is_empty': 'isNull',
    'is_not_empty': 'isNotNull',
  };
  return operatorMap[operator] || 'equal';
};

const convertClassifyNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { categories, inputVariable, model } = config || {};
  
  const inputParams: FlowField[] = [];
  const refs = extractVariableRefs(inputVariable, allNodes);
  if (refs.length > 0) {
    inputParams.push({
      ...refs[0],
      field: 'input',
    });
  } else if (inputVariable) {
    inputParams.push({
      field: 'input',
      value: inputVariable,
      type: 'string',
    });
  }

  const types = (categories || []).map((c: any) => c.name);
  const descriptions = (categories || []).map((c: any) => c.description || '');

  return {
    inputParams,
    outputParams: [],
    options: {
      model: { params: { model: model || '' } },
      types,
      descriptions,
    },
  };
};

const convertKnowNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { query, dataset_ids, top_k, score_threshold } = config || {};
  
  const inputParams: FlowField[] = [];
  const refs = extractVariableRefs(query, allNodes);
  if (refs.length > 0) {
    inputParams.push({
      ...refs[0],
      field: 'text',
    });
  } else if (query) {
    inputParams.push({
      field: 'text',
      value: query,
      type: 'string',
    });
  }

  return {
    inputParams,
    outputParams: [
      { name: 'text', field: 'text', type: 'string' },
      { name: 'documents', field: 'documents', type: 'array' },
    ],
    options: {
      knowIds: dataset_ids || [],
      size: top_k || 3,
      minScore: score_threshold || 0.5,
    },
  };
};

const convertVariableNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { opType, targetField, value } = config || {};
  
  const inputParams: FlowField[] = [];
  const refs = extractVariableRefs(targetField, allNodes);
  if (refs.length > 0) {
    inputParams.push({
      ...refs[0],
      field: 'input',
    });
  } else if (targetField) {
    inputParams.push({
      field: 'input',
      value: targetField,
      type: 'string',
    });
  }

  return {
    inputParams,
    outputParams: [{ name: 'result', field: 'result', type: 'any' }],
    options: {
      opType: opType || 'transform',
      value,
    },
  };
};

const convertParseNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { inputVariable, parseType, selector } = config || {};
  
  const inputParams: FlowField[] = [];
  const refs = extractVariableRefs(inputVariable, allNodes);
  if (refs.length > 0) {
    inputParams.push({
      ...refs[0],
      field: 'input',
    });
  } else if (inputVariable) {
    inputParams.push({
      field: 'input',
      value: inputVariable,
      type: 'string',
    });
  }

  return {
    inputParams,
    outputParams: [{ name: 'result', field: 'result', type: 'any' }],
    options: {
      type: parseType || 'text',
      selector,
    },
  };
};

const convertFlowNodeData = (config: any): FlowData => {
  const { flowLabel, flowId } = config || {};
  
  return {
    inputParams: [],
    outputParams: [],
    options: {
      label: flowLabel || '',
      flowId,
    },
  };
};

const extractVariableRefs = (text: string, allNodes: Node[]): FlowField[] => {
  if (!text || typeof text !== 'string') return [];
  
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
  const matches = [...text.matchAll(regex)];
  const params: FlowField[] = [];

  matches.forEach(match => {
    const content = match[1];
    const parts = content.split('.');
    
    if (parts.length >= 2) {
      const nodeId = parts[0];
      const varName = parts.slice(1).join('.');
      
      const sourceNode = allNodes.find(n => n.id === nodeId);
      if (sourceNode) {
        params.push({
          nodeId,
          nodeType: mapNodeType(sourceNode.type),
          name: varName,
          field: varName,
          type: 'any',
        });
      }
    }
  });

  return params;
};

export const importFromBackend = (draft: FlowDraft): Partial<WorkflowStoreState> => {
  if (!draft) return { nodes: [], edges: [] };
  
  const { nodes: backendNodes, edges: backendEdges } = draft;
  
  const nodes = backendNodes.map(node => convertNodeFromBackend(node));
  const edges = backendEdges.map(edge => convertEdgeFromBackend(edge));

  return { nodes, edges };
};

const convertNodeFromBackend = (node: FlowNode): Node => {
  const frontendType = mapToBackendType(node.type);
  const config = convertDataToConfig(node.data, node.type);

  return {
    id: node.id || '',
    type: frontendType,
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.label || '',
      description: node.description,
      config,
      status: 'idle',
    },
  };
};

const convertEdgeFromBackend = (edge: FlowEdge): Edge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.sourceHandle,
  targetHandle: edge.targetHandle,
  type: edge.type,
  animated: edge.animated,
  style: edge.style,
});

const convertDataToConfig = (data: FlowData | undefined, nodeType: string): Record<string, any> => {
  if (!data) return {};
  
  switch (nodeType) {
    case 'start':
      return convertStartDataToConfig(data);
    case 'llm':
      return convertLLMDataToConfig(data);
    case 'code':
      return convertCodeDataToConfig(data);
    case 'judge':
      return convertJudgeDataToConfig(data);
    case 'classify':
      return convertClassifyDataToConfig(data);
    case 'know':
      return convertKnowDataToConfig(data);
    case 'variable':
      return convertVariableDataToConfig(data);
    case 'parse':
      return convertParseDataToConfig(data);
    case 'flow':
      return convertFlowDataToConfig(data);
    default:
      return data.options || {};
  }
};

const convertStartDataToConfig = (data: FlowData): Record<string, any> => {
  const variables: VariableConfig[] = (data.inputParams || []).map(p => ({
    name: p.field || '',
    displayName: p.label || p.field || '',
    type: (p.type || 'text') as any,
    required: p.required || false,
    hidden: false,
    defaultValue: p.value,
  }));

  return {
    variables,
    devMode: data.options?.devMode,
    devInput: data.options?.devInput,
  };
};

const convertLLMDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const messages = options.messages || [];
  
  return {
    model: options.model?.params?.model || '',
    temperature: options.model?.params?.temperature || 0.7,
    systemPrompt: messages.find((m: any) => m.role === 'system')?.content || '',
    userPrompt: messages.find((m: any) => m.role === 'user')?.content || '',
    history: options.history || 0,
    isOutput: options.isOutput !== false,
    toolConfig: options.toolConfig || [],
    mcpConfig: options.mcpConfig || [],
  };
};

const convertCodeDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  let code = options.code || '';
  
  const mainMatch = code.match(/async\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/);
  if (mainMatch) {
    code = mainMatch[1].trim();
  }

  const inputVariables = (data.inputParams || []).map(p => ({
    key: p.field,
    value: p.nodeId ? `{{${p.nodeId}.${p.name}}}` : p.value,
  }));

  return {
    code,
    language: options.type || 'javascript',
    inputVariables,
    outputField: 'result',
  };
};

const convertJudgeDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const IF = options.IF || [];
  
  const conditions: any[] = [];
  IF.forEach((item: any) => {
    conditions.push({
      variable: item.nodeId ? `{{${item.nodeId}.${item.name}}}` : item.value,
      operator: mapOperatorToConfig(item.condition),
      value: item.value,
      logic: item.operator || 'AND',
    });
  });

  return {
    conditionGroups: [{
      conditions,
      logic: 'AND',
    }],
  };
};

const mapOperatorToConfig = (condition: ConditionOperator): string => {
  const map: Record<ConditionOperator, string> = {
    'equal': 'equals',
    'notEqual': 'not_equals',
    'include': 'contains',
    'exclude': 'not_contains',
    'startWith': 'starts_with',
    'endWith': 'ends_with',
    'greaterThan': 'greater_than',
    'lessThan': 'less_than',
    'greaterThanOrEqual': 'greater_than_or_equal',
    'lessThanOrEqual': 'less_than_or_equal',
    'isNull': 'is_empty',
    'isNotNull': 'is_not_empty',
  };
  return map[condition] || 'equals';
};

const convertClassifyDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const types = options.types || [];
  const descriptions = options.descriptions || [];
  
  const categories = types.map((name: string, index: number) => ({
    id: `cat_${index}`,
    name,
    description: descriptions[index] || '',
  }));

  const inputParam = (data.inputParams || [])[0];
  const inputVariable = inputParam?.nodeId 
    ? `{{${inputParam.nodeId}.${inputParam.name}}}` 
    : inputParam?.value || '';

  return {
    model: options.model?.params?.model || '',
    categories,
    inputVariable,
  };
};

const convertKnowDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const inputParam = (data.inputParams || [])[0];
  const query = inputParam?.nodeId 
    ? `{{${inputParam.nodeId}.${inputParam.name}}}` 
    : inputParam?.value || '';

  return {
    query,
    dataset_ids: options.knowIds || [],
    top_k: options.size || 3,
    score_threshold: options.minScore || 0.5,
  };
};

const convertVariableDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const inputParam = (data.inputParams || [])[0];
  const targetField = inputParam?.nodeId 
    ? `{{${inputParam.nodeId}.${inputParam.name}}}` 
    : inputParam?.value || '';

  return {
    opType: options.opType || 'transform',
    targetField,
    value: options.value,
  };
};

const convertParseDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const inputParam = (data.inputParams || [])[0];
  const inputVariable = inputParam?.nodeId 
    ? `{{${inputParam.nodeId}.${inputParam.name}}}` 
    : inputParam?.value || '';

  return {
    inputVariable,
    parseType: options.type || 'text',
    selector: options.selector,
  };
};

const convertFlowDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  
  return {
    flowLabel: options.label || '',
    flowId: options.flowId,
  };
};

export const getAvailableVariables = (nodes: Node[], currentNodeId: string): FlowField[] => {
  const variables: FlowField[] = [];
  const currentIndex = nodes.findIndex(n => n.id === currentNodeId);
  
  for (let i = 0; i < currentIndex; i++) {
    const node = nodes[i];
    const nodeType = mapNodeType(node.type);
    
    if (nodeType === 'start') {
      const config = node.data?.config as any;
      const vars: VariableConfig[] = config?.variables || [];
      vars.forEach(v => {
        variables.push({
          nodeId: node.id,
          nodeType: 'start',
          name: v.name,
          field: v.name,
          label: v.displayName || v.name,
          type: v.type,
        });
      });
    } else {
      const data = node.data?.config as any;
      if (data?.outputField) {
        variables.push({
          nodeId: node.id,
          nodeType,
          name: data.outputField,
          field: data.outputField,
          label: `${node.data?.label || node.type}.${data.outputField}`,
        });
      }
    }
  }
  
  return variables;
};

export { mapNodeType, mapToBackendType };

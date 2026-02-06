import { Node } from 'reactflow';
import { WorkflowStoreState, WorkflowNodeType, VariableConfig } from '../types';
import { BackendWorkflow, BackendNode, BackendInputParam, BackendOutputParam, BackendNodeConfig } from '../types/backend';

/**
 * 将前端工作流数据转换为后端标准格式
 * @param workflow 前端 Store 状态
 * @returns 后端工作流配置
 */
export const exportToBackend = (workflow: WorkflowStoreState): BackendWorkflow => {
  const { nodes, edges, globalVariables } = workflow;

  const backendNodes: BackendNode[] = nodes.map(node => convertNodeToBackend(node, nodes));
  
  const backendEdges = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.type,
    animated: edge.animated,
  }));

  return {
    nodes: backendNodes,
    edges: backendEdges,
    config: {
      globalVariables,
    }
  };
};

/**
 * 节点类型映射
 */
const mapNodeType = (frontendType?: string): string => {
  const typeMap: Record<string, string> = {
    [WorkflowNodeType.START]: 'start',
    [WorkflowNodeType.END]: 'end',
    [WorkflowNodeType.LLM]: 'llm',
    [WorkflowNodeType.SCRIPT]: 'code',
    [WorkflowNodeType.CONDITION]: 'judge',
    [WorkflowNodeType.QUESTION_CLASSIFIER]: 'classify',
    [WorkflowNodeType.KNOWLEDGE_RETRIEVAL]: 'know',
    [WorkflowNodeType.DATA_OP]: 'variable',
    [WorkflowNodeType.DOCUMENT_EXTRACTOR]: 'parse',
    [WorkflowNodeType.LOOP]: 'flow', 
  };
  return frontendType ? (typeMap[frontendType] || frontendType.toLowerCase()) : 'unknown';
};

/**
 * 单个节点转换逻辑
 */
const convertNodeToBackend = (node: Node, allNodes: Node[]): BackendNode => {
  const backendType = mapNodeType(node.type);
  
  let data: BackendNodeConfig = {
    inputParams: [],
    outputParams: [],
    options: {},
  };

  switch (node.type) {
    case WorkflowNodeType.START:
      data = convertStartNode(node);
      break;
    case WorkflowNodeType.END:
      data = convertEndNode(node, allNodes);
      break;
    case WorkflowNodeType.LLM:
      data = convertLLMNode(node, allNodes);
      break;
    case WorkflowNodeType.SCRIPT:
      data = convertCodeNode(node, allNodes);
      break;
    case WorkflowNodeType.CONDITION:
      data = convertConditionNode(node, allNodes);
      break;
    case WorkflowNodeType.QUESTION_CLASSIFIER:
      data = convertClassifierNode(node, allNodes);
      break;
    case WorkflowNodeType.KNOWLEDGE_RETRIEVAL:
      data = convertKnowledgeNode(node, allNodes);
      break;
    case WorkflowNodeType.DATA_OP:
      data = convertDataOpNode(node, allNodes);
      break;
    default:
      data.options = node.data?.config || {};
      break;
  }

  return {
    id: node.id,
    type: backendType,
    label: node.data?.label || node.type || 'Node',
    position: node.position,
    data,
  };
};

// --- Converters ---

const convertStartNode = (node: Node): BackendNodeConfig => {
  const config = node.data?.config as any;
  const variables: VariableConfig[] = config?.variables || [];

  const inputParams: BackendInputParam[] = variables.map(v => ({
    name: v.name,
    field: v.name,
    type: v.type,
    required: v.required,
    default: v.defaultValue,
    label: v.displayName,
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

const convertEndNode = (node: Node, allNodes: Node[]): BackendNodeConfig => {
  const config = node.data?.config as any;
  const outputs: Array<{ key: string; value: string }> = config?.outputs || [];

  const inputParams: BackendInputParam[] = [];
  const outputParams: BackendOutputParam[] = [];

  const endInputParams: BackendInputParam[] = outputs.map(out => {
    const refs = extractVariableRefs(out.value, allNodes);
    if (refs.length > 0) {
      return {
        ...refs[0],
        field: out.key, 
      };
    } else {
      return {
        field: out.key,
        value: out.value,
        type: 'string',
      };
    }
  });
  
  outputs.forEach(out => {
      outputParams.push({
          name: out.key,
          field: out.key,
          type: 'any',
          desc: `Mapped from ${out.value}`,
      });
  });

  return {
    inputParams: endInputParams,
    outputParams,
    options: {},
  };
};

const convertLLMNode = (node: Node, allNodes: Node[]): BackendNodeConfig => {
  const config = node.data?.config as any;
  const { model, temperature, systemPrompt, userPrompt } = config || {};

  const inputParams: BackendInputParam[] = [];
  const sysVars = extractVariableRefs(systemPrompt, allNodes);
  const userVars = extractVariableRefs(userPrompt, allNodes);
  
  const varMap = new Map<string, BackendInputParam>();
  [...sysVars, ...userVars].forEach(p => {
    if (p.name) varMap.set(p.name, p);
  });
  inputParams.push(...Array.from(varMap.values()));

  const messages = [
    { role: 'system', content: systemPrompt || '' },
    { role: 'user', content: userPrompt || '' },
  ];

  const options = {
    model: {
      params: {
        model: model || 'gpt-4',
        temperature: temperature ?? 0.7,
      }
    },
    messages,
    isOutput: true,
  };

  const outputParams: BackendOutputParam[] = [
    { name: 'text', field: 'text', type: 'string' },
    { name: 'stream', field: 'stream', type: 'stream' },
  ];

  return {
    inputParams,
    outputParams,
    options,
  };
};

const convertCodeNode = (node: Node, allNodes: Node[]): BackendNodeConfig => {
  const config = node.data?.config as any;
  const { code, inputVariables, outputField, language } = config || {};

  const inputParams: BackendInputParam[] = [];
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
    wrappedCode = `
import { BaseCode } from '@cool/code';

export class Cool extends BaseCode {
  async main(inputs) {
    ${code}
  }
}
    `.trim();
  } 

  const outputParams: BackendOutputParam[] = [
    { name: 'result', field: 'result', type: 'json' }
  ];
  if (outputField && outputField !== 'result') {
    outputParams.push({ name: outputField, field: outputField, type: 'any' });
  }

  return {
    inputParams,
    outputParams,
    options: {
      code: wrappedCode,
      type: language || 'javascript',
    },
  };
};

const convertConditionNode = (node: Node, allNodes: Node[]): BackendNodeConfig => {
  const config = node.data?.config as any;
  const { expression, conditionGroups } = config || {};
  
  const options: any = {
    expression: expression || convertGroupsToExpression(conditionGroups),
  };

  return {
    inputParams: [],
    outputParams: [],
    options,
  };
};

const convertClassifierNode = (node: Node, allNodes: Node[]): BackendNodeConfig => {
  const config = node.data?.config as any;
  const { categories, inputVariable, model } = config || {};

  const inputParams: BackendInputParam[] = [];
  const refs = extractVariableRefs(inputVariable, allNodes);
  if (refs.length > 0) {
    inputParams.push({
      ...refs[0],
      field: 'input', 
    });
  }

  const types = (categories || []).map((c: any) => c.name);

  return {
    inputParams,
    outputParams: [],
    options: {
      model: { params: { model: model || 'gpt-4' } },
      types, 
      descriptions: (categories || []).map((c: any) => c.description),
    },
  };
};

const convertKnowledgeNode = (node: Node, allNodes: Node[]): BackendNodeConfig => {
  const config = node.data?.config as any;
  const { query, dataset_ids, top_k, score_threshold } = config || {};

  const inputParams: BackendInputParam[] = [];
  const refs = extractVariableRefs(query, allNodes);
  if (refs.length > 0) {
    inputParams.push({
      ...refs[0],
      field: 'text',
    });
  } else {
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

const convertDataOpNode = (node: Node, allNodes: Node[]): BackendNodeConfig => {
  const config = node.data?.config as any;
  const { opType, targetField } = config || {};
  
  const inputParams: BackendInputParam[] = [];
  
  const refs = extractVariableRefs(targetField, allNodes);
  if (refs.length > 0) {
    inputParams.push({
      ...refs[0],
      field: 'input', 
    });
  } else {
      inputParams.push({
          field: 'input',
          value: targetField,
          type: 'string',
      })
  }

  const outputParams: BackendOutputParam[] = [
    { name: 'result', field: 'result', type: 'any' }
  ];

  return {
    inputParams,
    outputParams,
    options: {
      opType: opType || 'transform',
    },
  };
};

// --- Helpers ---

const extractVariableRefs = (text: string, allNodes: Node[]): BackendInputParam[] => {
  if (!text || typeof text !== 'string') return [];
  
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
  const matches = [...text.matchAll(regex)];
  const params: BackendInputParam[] = [];

  matches.forEach(match => {
    const content = match[1]; 
    const parts = content.split('.');
    
    if (parts.length >= 2) {
      const nodeId = parts[0];
      const varName = parts.slice(1).join('.'); 
      
      const sourceNode = allNodes.find(n => n.id === nodeId);
      if (sourceNode) {
        params.push({
          nodeId: nodeId,
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

const convertGroupsToExpression = (groups: any[]): string => {
  if (!groups || groups.length === 0) return 'false';
  return '/* Complex condition builder logic */';
};

export const importFromBackend = (backendData: BackendWorkflow): Partial<WorkflowStoreState> => {
    return {
      nodes: [],
      edges: [],
    };
};

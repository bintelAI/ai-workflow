import { Node, Edge } from 'reactflow';
import { 
  FlowField, 
  FlowData, 
  FlowNode, 
  FlowEdge, 
  FlowDraft,
  FlowGraphV2,
  NODE_TYPE_MAP, 
  REVERSE_NODE_TYPE_MAP,
  ConditionOperator 
} from '@ai-flow/src/types/flow';
import type { WorkflowStoreState, VariableConfig, WorkflowNodeType } from '../types';
import { extractVariableTemplates, normalizeLegacyTemplate } from '../utils/workflowVariables';

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
  loop: { color: '#8b5cf6', icon: 'loop', group: '逻辑', cardWidth: '430px' },
};

const mapNodeType = (frontendType?: string): string => {
  if (!frontendType) return 'unknown';
  return NODE_TYPE_MAP[frontendType] || frontendType.toLowerCase();
};

const mapToBackendType = (backendType?: string): string => {
  if (!backendType) return 'unknown';
  return REVERSE_NODE_TYPE_MAP[backendType] || backendType;
};

export const exportToBackend = (workflow: WorkflowStoreState): FlowGraphV2 => {
  const { nodes, edges } = workflow;
  const normalizedEdges = ensureLoopEdges(nodes, edges)
  const backendNodes = nodes.map((node, index) => convertNodeToBackend(node, nodes, index));
  const backendEdges = normalizedEdges.map((edge, index) => convertEdgeToBackend(edge, index, nodes));

  return {
    schemaVersion: 2,
    nodes: backendNodes,
    edges: backendEdges,
    viewport: { x: 0, y: 0, zoom: 1 },
  };
};

const ensureLoopEdges = (nodes: Node[], edges: Edge[]): Edge[] => {
  const result = [...edges]
  const existingKeys = new Set(
    result.map(edge => `${edge.source}-${edge.sourceHandle || ''}-${edge.target}-${edge.targetHandle || ''}`)
  )

  nodes
    .filter(node => node.type === 'loop')
    .forEach(loopNode => {
      const bodyNodeIds = Array.isArray((loopNode.data as any)?.config?.bodyNodeIds)
        ? (loopNode.data as any).config.bodyNodeIds
        : nodes.filter(node => node.parentNode === loopNode.id).map(node => node.id)

      bodyNodeIds.forEach((bodyNodeId: string) => {
        const bodyNode = nodes.find(node => node.id === bodyNodeId)
        if (!bodyNode) return
        const key = `${loopNode.id}-loop-start-${bodyNodeId}-`
        if (!existingKeys.has(key)) {
          result.push({
            id: `e${loopNode.id}-start-${bodyNodeId}`,
            source: loopNode.id,
            target: bodyNodeId,
            sourceHandle: 'loop-start',
            targetHandle: undefined,
            type: 'custom',
            animated: true,
          } as Edge)
          existingKeys.add(key)
        }
      })
    })

  return result
}

const convertNodeToBackend = (node: Node, allNodes: Node[], index: number): FlowNode => {
  const backendType = mapNodeType(node.type);
  const data = convertNodeData(node, allNodes, backendType);
  const config = NODE_CONFIG_MAP[backendType] || { color: '#909399', icon: 'node', group: '其他', cardWidth: '430px' };

  const description = node.data?.description || '';

  return {
    id: node.id,
    type: backendType,
    initialized: false,
    position: node.position,
    parentNode: node.parentNode,
    style: node.style,
    data,
    label: node.data?.label || node.type || 'Node',
    description,
    desc: description,
    color: config.color,
    handle: backendType === 'start' ? { target: false } : backendType === 'end' ? { source: false } : {},
    name: `node-${backendType}`,
    icon: config.icon,
    cardWidth: config.cardWidth,
    _index: index + 1,
  };
};

const normalizeBackendEdgeHandles = (
  edge: Edge,
  sourceNode: Node | undefined,
  targetNode: Node | undefined
) => {
  let sourceHandle = edge.sourceHandle || null;
  let targetHandle = edge.targetHandle || null;

  const isLoopInternalEdge = sourceNode?.type === 'loop' && targetNode?.parentNode === sourceNode.id
  const isLoopOutgoingEdge = sourceNode?.type === 'loop' && targetNode?.parentNode !== sourceNode.id
  const isLoopIncomingEdge = targetNode?.type === 'loop'

  if (sourceNode?.type === 'question_classifier' && sourceHandle === 'source-else') {
    sourceHandle = null;
  }

  if (sourceNode?.type === 'parallel' && sourceHandle?.startsWith('branch-')) {
    sourceHandle = 'source';
  }

  if (isLoopInternalEdge) {
    sourceHandle = 'loop-start'
    targetHandle = null
  } else if (isLoopOutgoingEdge) {
    sourceHandle = 'loop-output'
  } else if (!sourceHandle) {
    sourceHandle = 'source';
  }

  if (isLoopIncomingEdge) {
    targetHandle = 'loop-input'
  } else if (!targetHandle) {
    targetHandle = 'target';
  }

  return {
    sourceHandle,
    targetHandle,
  };
};

const convertEdgeToBackend = (edge: Edge, index: number, allNodes: Node[]): FlowEdge => {
  const sourceNode = allNodes.find(node => node.id === edge.source);
  const targetNode = allNodes.find(node => node.id === edge.target);
  const normalizedHandles = normalizeBackendEdgeHandles(edge, sourceNode, targetNode);

  return {
    id: edge.id || `vueflow__edge-${edge.source}${normalizedHandles.sourceHandle || ''}-${edge.target}${normalizedHandles.targetHandle || ''}`,
    type: edge.type || 'button',
    source: edge.source,
    target: edge.target,
    sourceHandle: normalizedHandles.sourceHandle,
    targetHandle: normalizedHandles.targetHandle,
    updatable: true,
    data: {},
    label: '',
    animated: edge.animated || false,
    style: edge.style || {},
    _stroke: '#4165d7',
  };
};

const convertNodeData = (node: Node, allNodes: Node[], backendType: string): FlowData => {
  const config = node.data?.config || {};
  
  switch (node.type) {
    case 'start':
      return convertStartNodeData(config);
    case 'end':
      return convertEndNodeData(config, allNodes);
    case 'llm':
      return convertLLMNodeData(config, allNodes);
    case 'script':
      return convertCodeNodeData(config, allNodes);
    case 'condition':
      return convertJudgeNodeData(config, allNodes);
    case 'question_classifier':
      return convertClassifyNodeData(config, allNodes);
    case 'knowledge_retrieval':
      return convertKnowNodeData(config, allNodes);
    case 'variable':
      return convertVariableNodeData(config, allNodes);
    case 'smart_parse':
      return convertParseNodeData(config, allNodes);
    case 'json_parse':
      return convertJsonNodeData(config, allNodes);
    case 'flow_call':
      return convertFlowNodeData(config);
    case 'api_call':
      return convertApiCallNodeData(config, allNodes);
    case 'loop':
      return convertLoopNodeData(config, node, allNodes);
    case 'mul_query':
    case 'mul_update_row':
    case 'mul_delete_row':
      return convertMulTableOperationNodeData(config, allNodes, node.type);
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
  const approvalFields = getApprovalInputParams(config);
  
  const inputParams: FlowField[] = approvalFields.length > 0
    ? approvalFields
    : variables.map(v => ({
        field: v.name,
        name: v.name,
        type: normalizeVariableFieldType(v.type),
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
      approvalInputConfig: config?.approvalInputConfig,
    },
  };
};

const getApprovalInputParams = (config: any): FlowField[] => {
  const fields = Array.isArray(config?.approvalInputConfig?.fields)
    ? config.approvalInputConfig.fields
    : [];
  const sheetId = String(config?.approvalInputConfig?.sheetId || '').trim();

  const inputParams = fields
    .filter((field: any) => field?.includeInPayload !== false)
    .map((field: any) => {
      const name = String(field.variableName || field.fieldId || '').trim();
      if (!name) return null;
      return {
        field: name,
        name,
        type: normalizeMulFieldType(field.fieldType),
        required: Boolean(field.required),
        label: field.label || field.fieldName || name,
      } satisfies FlowField;
    })
    .filter(Boolean) as FlowField[];

  if (sheetId && !inputParams.some(item => item.name === 'sheetId' || item.field === 'sheetId')) {
    inputParams.unshift({
      field: 'sheetId',
      name: 'sheetId',
      type: 'string',
      required: true,
      label: '审批表 Sheet ID',
    });
  }

  if (sheetId && !inputParams.some(item => item.name === 'rowId' || item.field === 'rowId')) {
    inputParams.unshift({
      field: 'rowId',
      name: 'rowId',
      type: 'string',
      required: true,
      label: '审批行 Row ID',
    });
  }

  return inputParams;
};

const normalizeMulFieldType = (type?: string): FlowField['type'] => {
  switch (type) {
    case 'number':
    case 'rating':
      return 'number';
    case 'checkbox':
    case 'switch':
      return 'boolean';
    case 'multiSelect':
    case 'file':
    case 'image':
    case 'relation':
      return 'array';
    case 'select':
    case 'text':
    case 'paragraph':
    case 'date':
    case 'phone':
    case 'email':
    case 'url':
    case 'location':
    case 'autoNumber':
      return 'string';
    default:
      return (type || 'any') as FlowField['type'];
  }
};

const normalizeVariableFieldType = (type?: string): FlowField['type'] => {
  switch (type) {
    case 'paragraph':
    case 'dropdown':
      return 'string';
    case 'checkbox':
      return 'boolean';
    case 'file_list':
      return 'file';
    case 'text':
    case 'string':
    case 'number':
    case 'boolean':
    case 'image':
    case 'file':
    case 'select':
    case 'array':
    case 'json':
    case 'stream':
    case 'any':
    case 'object':
    case 'object[]':
      return type;
    default:
      return 'any';
  }
};

const convertEndNodeData = (config: any, allNodes: Node[]): FlowData => {
  const outputs: Array<{ key: string; value: string; template?: string; nodeId?: string; nodeType?: string; name?: string }> =
    config?.outputs || [];

  const inputParams: FlowField[] = outputs
    .filter(out => out?.key)
    .map(out => {
      const templateValue = out.template || out.value || '';
      const refs = extractVariableRefs(templateValue, allNodes);
      if (refs.length > 0) {
        const ref = refs[0];
        return {
          ...ref,
          field: out.key,
          name: ref.name || out.name || out.key,
        };
      }

      return {
        field: out.key,
        name: out.name || out.key,
        value: out.value,
        type: 'string',
      };
    });

  const outputParams: FlowField[] = outputs
    .filter(out => out?.key)
    .map(out => ({
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
  const {
    model,
    temperature,
    systemPrompt,
    userPrompt,
    history,
    isOutput,
    supplier,
    supplierName,
    configId,
    comm,
    options: modelOptions,
  } = config || {};

  const inputParams: FlowField[] = [];
  const sysVars = extractVariableRefs(systemPrompt, allNodes);
  const userVars = extractVariableRefs(userPrompt, allNodes);

  const varMap = new Map<string, FlowField>();
  [...sysVars, ...userVars].forEach(p => {
    if (p.name) varMap.set(p.name, p);
  });
  inputParams.push(...Array.from(varMap.values()));

  const normalizedMessages = [
    { role: 'system', content: normalizeLegacyTemplate(systemPrompt || '', allNodes) },
    { role: 'user', content: normalizeLegacyTemplate(userPrompt || '', allNodes) },
  ];

  const normalizedModelOptions = Array.isArray(modelOptions)
    ? modelOptions.map((option: any) => ({ ...option }))
    : [];

  const modelParams = normalizedModelOptions.reduce(
    (acc: Record<string, any>, option: any) => {
      if (option?.field && option.enable) {
        acc[option.field] = option.value;
      }
      return acc;
    },
    {
      model: model || '',
      temperature: temperature ?? 0.7,
    }
  );

  return {
    inputParams: inputParams.map((item, index) => ({
      ...item,
      field: item.field || item.name || `var_${index + 1}`,
    })),
    outputParams: [
      { type: 'string', field: 'text' },
      { type: 'stream', field: 'stream' },
    ],
    options: {
      supplier,
      supplierName,
      configId,
      comm,
      model: {
        configId,
        supplier,
        supplierName,
        options: normalizedModelOptions,
        params: modelParams,
      },
      messages: normalizedMessages,
      history: history || 0,
      isOutput: isOutput !== false,
      toolConfig: config?.toolConfig || [],
      mcpConfig: config?.mcpConfig || [],
    },
  };
};

const convertCodeNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { code, inputVariables, inputParams: configInputParams, outputParams: configOutputParams, outputField, language } = config || {};
  
  const inputParams: FlowField[] = [];
  if (Array.isArray(configInputParams) && configInputParams.length > 0) {
    configInputParams.forEach((item: any, index: number) => {
      inputParams.push(normalizeConfigInputParam(item, `arg${index + 1}`, allNodes));
    });
  } else if (Array.isArray(inputVariables)) {
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

  const wrappedCode = code || '';

  return {
    inputParams,
    outputParams: Array.isArray(configOutputParams) && configOutputParams.length > 0
      ? configOutputParams.map((item: any) => ({
          name: item?.name || item?.field || outputField || 'result',
          field: item?.field || item?.name || outputField || 'result',
          type: item?.type || 'any',
        }))
      : [{ name: outputField || 'result', field: outputField || 'result', type: 'any' }],
    options: {
      code: wrappedCode,
      type: language || 'javascript',
      language: language || 'javascript',
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
        const variableTemplate = cond.template || cond.refPath || cond.variable || '';
        const refs = extractVariableRefs(variableTemplate, allNodes);
        IF.push({
          field: cond.field || refs[0]?.field || cond.name || variableTemplate?.split('.')?.pop()?.replace(/[{}]/g, '') || '',
          nodeId: cond.nodeId || refs[0]?.nodeId || '',
          nodeType: cond.nodeType || refs[0]?.nodeType || '',
          name: cond.name || refs[0]?.name || cond.field || '',
          template: refs[0]?.value || variableTemplate,
          refPath: refs[0]?.value || variableTemplate,
          condition: mapConditionOperator(cond.operator),
          value: cond.value || '',
          operator: condIndex < conditions.length - 1 ? (cond.logic || 'AND') : undefined,
        });
      });
    });
  }

  if (IF.length === 0 && Array.isArray(config?.IF)) {
    config.IF.forEach((item: any) => {
      const variableTemplate = item.template || item.refPath || (item.nodeId && item.name ? `{{nodes.${item.nodeId}.${item.name}}}` : item.field);
      const refs = extractVariableRefs(variableTemplate, allNodes);
      IF.push({
        field: item.field || refs[0]?.field || item.name || variableTemplate?.split('.')?.pop()?.replace(/[{}]/g, '') || '',
        nodeId: item.nodeId || refs[0]?.nodeId || '',
        nodeType: item.nodeType || refs[0]?.nodeType || '',
        name: item.name || refs[0]?.name || item.field || '',
        template: item.template || refs[0]?.value || variableTemplate,
        refPath: item.refPath || refs[0]?.value || variableTemplate,
        condition: item.condition || 'equal',
        value: item.value || '',
        operator: item.operator,
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
  const {
    categories,
    types: configTypes,
    descriptions: configDescriptions,
    inputVariable,
    inputParams: configInputParams,
    model,
    supplier,
    supplierName,
    configId,
    comm,
  } = config || {};

  const inputParams: FlowField[] = [];
  if (Array.isArray(configInputParams) && configInputParams.length > 0) {
    inputParams.push(normalizeConfigInputParam(configInputParams[0], 'content', allNodes));
  } else {
    const refs = extractVariableRefs(inputVariable, allNodes);
    if (refs.length > 0) {
      inputParams.push({
        ...refs[0],
        field: 'content',
        name: refs[0].name || 'content',
      });
    } else if (inputVariable) {
      inputParams.push({
        field: 'content',
        name: 'content',
        value: inputVariable,
        type: 'string',
      });
    }
  }

  const types = Array.isArray(configTypes)
    ? configTypes
    : (categories || []).map((c: any) => c.name);
  const descriptions = Array.isArray(configDescriptions)
    ? configDescriptions
    : (categories || []).map((c: any) => c.description || '');

  return {
    inputParams,
    outputParams: [
      {
        name: 'index',
        field: 'index',
        type: 'number',
      },
    ],
    options: {
      model: model
        ? {
            configId,
            supplier,
            supplierName,
            params: { model },
          }
        : { params: { model: '' } },
      supplier,
      supplierName,
      configId,
      comm,
      types,
      descriptions,
    },
  };
};

const convertKnowNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { query, inputParams: configInputParams, knowIds, size, minScore, dataset_ids, top_k, score_threshold } = config || {};
  
  const inputParams: FlowField[] = [];
  if (Array.isArray(configInputParams) && configInputParams.length > 0) {
    inputParams.push(normalizeConfigInputParam(configInputParams[0], 'text', allNodes));
  } else {
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
  }

  return {
    inputParams,
    outputParams: [
      { name: 'text', field: 'text', type: 'string' },
      { name: 'documents', field: 'documents', type: 'array' },
    ],
    options: {
      knowIds: knowIds || dataset_ids || [],
      size: size ?? top_k ?? 3,
      minScore: minScore ?? score_threshold ?? 0.5,
    },
  };
};

const normalizeConfigInputParam = (item: any, fallbackField: string, allNodes: Node[]): FlowField => {
  const template = item?.template || item?.refPath || (item?.nodeId && item?.name ? `{{nodes.${item.nodeId}.${item.name}}}` : item?.value);
  const refs = extractVariableRefs(template, allNodes);
  if (refs.length > 0) {
    return {
      ...refs[0],
      field: item?.field || fallbackField,
      name: item?.name || refs[0].name || item?.field || fallbackField,
      type: item?.type || refs[0].type || 'any',
    };
  }

  return {
    field: item?.field || fallbackField,
    name: item?.name || item?.field || fallbackField,
    type: item?.type || 'string',
    nodeId: item?.nodeId,
    nodeType: item?.nodeType,
    value: item?.value || template || '',
  };
};

const convertVariableNodeData = (config: any, allNodes: Node[]): FlowData => {
  const {
    code,
    inputVariable,
    inputVariables,
    inputParams,
    outputParams,
    targetField,
    value,
    outputField,
    language,
  } = config || {};

  const inputParamsData: FlowField[] = [];
  const sources = Array.isArray(inputVariables) && inputVariables.length > 0
    ? inputVariables.map((item: any) => ({ key: item?.key || 'input', value: item?.value }))
    : Array.isArray(inputParams) && inputParams.length > 0
      ? inputParams.map((item: any, index: number) => ({
          key: item?.field || item?.name || `arg${index + 1}`,
          value: item?.template || (item?.nodeId && item?.name ? `{{nodes.${item.nodeId}.${item.name}}}` : item?.value),
        }))
      : [{ key: 'input', value: inputVariable || targetField || value }];

  sources.forEach(item => {
    if (!item?.value) return;
    const refs = extractVariableRefs(item.value, allNodes);
    if (refs.length > 0) {
      inputParamsData.push({
        ...refs[0],
        field: item.key,
      });
    } else {
      inputParamsData.push({
        field: item.key,
        value: item.value,
        type: 'string',
      });
    }
  });

  const normalizedOutputParams = Array.isArray(outputParams) && outputParams.length > 0
    ? outputParams.map((item: any) => ({
        name: item?.field || item?.name || 'result',
        field: item?.field || item?.name || 'result',
        type: item?.type || 'any',
      }))
    : [{ name: outputField || 'result', field: outputField || 'result', type: 'any' }];

  return {
    inputParams: inputParamsData,
    outputParams: normalizedOutputParams,
    options: {
      code: code || 'return params.input;',
      type: language || 'javascript',
    },
  };
};

const convertParseNodeData = (config: any, allNodes: Node[]): FlowData => {
  const {
    inputVariable,
    inputParams,
    parseType,
    selector,
    schema,
    model,
    outputParams,
    supplier,
    supplierName,
    configId,
    comm,
  } = config || {};

  const inputParamsData: FlowField[] = Array.isArray(inputParams) && inputParams.length > 0
    ? inputParams.map((item: any, index: number) => ({
        name: item?.name || item?.field || `text${index + 1}`,
        field: item?.field || item?.name || `text${index + 1}`,
        type: item?.type || 'string',
        nodeId: item?.nodeId,
        nodeType: item?.nodeType,
        value: item?.nodeId && item?.name ? undefined : item?.value,
      }))
    : [];

  if (inputParamsData.length === 0) {
    const refs = extractVariableRefs(inputVariable, allNodes);
    if (refs.length > 0) {
      inputParamsData.push({
        ...refs[0],
        field: 'text',
      });
    } else if (inputVariable) {
      inputParamsData.push({
        field: 'text',
        value: inputVariable,
        type: 'string',
      });
    }
  }

  const normalizedOutputParams = Array.isArray(outputParams) && outputParams.length > 0
    ? outputParams.map((item: any) => ({
        name: item?.field || item?.name || 'result',
        field: item?.field || item?.name || 'result',
        type: item?.type || 'any',
      }))
    : [{ name: 'result', field: 'result', type: 'any' }];

  return {
    inputParams: inputParamsData,
    outputParams: normalizedOutputParams,
    options: {
      type: parseType || 'text',
      selector,
      schema,
      supplier,
      supplierName,
      configId,
      comm,
      model: model
        ? {
            configId,
            supplier,
            supplierName,
            params: { model },
          }
        : undefined,
    },
  };
};

const convertJsonNodeData = (config: any, allNodes: Node[]): FlowData => {
  const { inputVariable, inputParams, mode, schema, outputField, outputParams } = config || {};
  const normalizedMode = mode === 'stringify' ? 'stringify' : 'parse';
  const outputType = normalizedMode === 'stringify' ? 'string' : 'json';

  const inputParamsData: FlowField[] = Array.isArray(inputParams) && inputParams.length > 0
    ? inputParams.map((item: any, index: number) => ({
        name: item?.name || item?.field || `text${index + 1}`,
        field: item?.field || item?.name || `text${index + 1}`,
        type: item?.type || 'string',
        nodeId: item?.nodeId,
        nodeType: item?.nodeType,
        value: item?.nodeId && item?.name ? undefined : item?.value,
      }))
    : [];

  if (inputParamsData.length === 0) {
    const refs = extractVariableRefs(inputVariable, allNodes);
    if (refs.length > 0) {
      inputParamsData.push({
        ...refs[0],
        field: 'text',
      });
    } else if (inputVariable) {
      inputParamsData.push({
        field: 'text',
        value: inputVariable,
        type: 'string',
      });
    }
  }

  const normalizedOutputParams = Array.isArray(outputParams) && outputParams.length > 0
    ? outputParams.map((item: any) => ({
        name: item?.field || item?.name || 'json',
        field: item?.field || item?.name || 'json',
        type: outputType,
      }))
    : [{ name: outputField || 'json', field: outputField || 'json', type: outputType }];

  return {
    inputParams: inputParamsData,
    outputParams: normalizedOutputParams,
    options: {
      mode: normalizedMode,
      schema: schema || {},
    },
  };
};

const convertFlowNodeData = (config: any): FlowData => {
  const { flowLabel, flowId, inputParams, outputParams } = config || {};

  return {
    inputParams: Array.isArray(inputParams) ? inputParams : [],
    outputParams: Array.isArray(outputParams) ? outputParams : [],
    options: {
      label: flowLabel || '',
      flowId,
    },
  };
};

const convertApiCallNodeData = (config: any, allNodes: Node[]): FlowData => {
  const normalizedUrl = normalizeLegacyTemplate(config?.url || '', allNodes)
  const outputParams: FlowField[] = [
    { field: 'status', type: 'number', name: 'status' },
    { field: 'headers', type: 'json', name: 'headers' },
    { field: 'data', type: 'any', name: 'data' },
    { field: 'rawData', type: 'any', name: 'rawData' },
    { field: 'success', type: 'boolean', name: 'success' },
    { field: 'branchStatus', type: 'string', name: 'branchStatus' },
  ]

  return {
    inputParams: [],
    outputParams,
    options: {
      method: config?.method || 'GET',
      url: normalizedUrl,
      queryParams: config?.queryParams || [],
      headers: config?.headers || [],
      bodyType: config?.bodyType || 'none',
      body: normalizeLegacyTemplate(config?.body || '', allNodes),
      bodyParams: config?.bodyParams || [],
      auth: config?.auth || { type: 'none' },
      timeout: config?.timeout || 30000,
      retry: config?.retry || {
        enabled: false,
        maxRetries: 3,
        delay: 1000,
        retryOnStatusCodes: [500, 502, 503, 504],
      },
      responseHandling: config?.responseHandling || {
        followRedirects: true,
        parseResponse: true,
        statusCodeBranching: false,
      },
    },
  }
}

const convertLoopNodeData = (config: any, node: Node, allNodes: Node[]): FlowData => {
  const bodyNodes = allNodes.filter(item => item.parentNode === node.id);
  const bodyNodeIds = bodyNodes.map(item => item.id);

  return {
    inputParams: [],
    outputParams: Array.isArray(config.outputParams)
      ? config.outputParams
      : [{ field: 'result', name: 'result', type: 'array' }],
    options: {
      targetArray: config.targetArrayTemplate || config.targetArray || '',
      targetArrayField: config.targetArrayField || '',
      targetArrayNodeId: config.targetArrayNodeId || '',
      targetArrayNodeType: config.targetArrayNodeType || '',
      outputMode: config.outputMode || 'all',
      resultNodeId: config.resultNodeId || '',
      resultNodeType: config.resultNodeType || '',
      resultField: config.resultField || '',
      resultTemplate: config.resultTemplate || '',
      executionMode: config.executionMode || 'serial',
      maxConcurrency: Number(config.maxConcurrency) > 0 ? Number(config.maxConcurrency) : 1,
      bodyNodeIds,
    },
  };
};

const MUL_TABLE_QUERY_OUTPUTS: FlowField[] = [
  { type: 'array', field: 'data.rows', name: 'data.rows' },
  { type: 'object', field: 'data.firstRow', name: 'data.firstRow' },
  { type: 'number', field: 'data.total', name: 'data.total' },
  { type: 'number', field: 'data.pageVisibleCount', name: 'data.pageVisibleCount' },
];

const MUL_TABLE_UPDATE_OUTPUTS: FlowField[] = [
  { type: 'object', field: 'data.row', name: 'data.row' },
  { type: 'string', field: 'data.rowId', name: 'data.rowId' },
  { type: 'boolean', field: 'data.updated', name: 'data.updated' },
];

const MUL_TABLE_DELETE_OUTPUTS: FlowField[] = [
  { type: 'string', field: 'data.rowId', name: 'data.rowId' },
  { type: 'boolean', field: 'data.deleted', name: 'data.deleted' },
];

const convertMulTableOperationNodeData = (config: any, allNodes: Node[], nodeType?: string): FlowData => {
  const rowIdTemplate = normalizeLegacyTemplate(
    config?.targetBinding?.rowIdTemplate || config?.rowIdTemplate || '',
    allNodes
  );
  const queryFilterTemplates =
    nodeType === 'mul_query'
      ? collectQueryFilterTemplates(config)
      : [];
  const bindingTemplates = Array.isArray(config?.targetBinding?.fieldBindings)
    ? config.targetBinding.fieldBindings
        .map((item: any) => item?.sourceTemplate)
        .filter(Boolean)
    : [];
  const inputParams = [
    ...extractVariableRefs(rowIdTemplate, allNodes),
    ...queryFilterTemplates.flatMap((template: string) =>
      extractVariableRefs(normalizeLegacyTemplate(template, allNodes), allNodes)
    ),
    ...bindingTemplates.flatMap((template: string) =>
      extractVariableRefs(normalizeLegacyTemplate(template, allNodes), allNodes)
    ),
  ];
  const outputParams =
    nodeType === 'mul_query'
      ? MUL_TABLE_QUERY_OUTPUTS
      : nodeType === 'mul_update_row'
        ? MUL_TABLE_UPDATE_OUTPUTS
        : MUL_TABLE_DELETE_OUTPUTS;

  return {
    inputParams: inputParams.map((item, index) => ({
      ...item,
      field: item.field || item.name || `var_${index + 1}`,
    })),
    outputParams,
    options: {
      ...config,
      rowIdTemplate,
    },
  };
};

const collectQueryFilterTemplates = (config: any): string[] => {
  const values: string[] = [];
  const visit = (value: any) => {
    if (typeof value === 'string') {
      values.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };

  if (Array.isArray(config?.queryBinding?.filters)) {
    config.queryBinding.filters.forEach((filter: any) => visit(filter?.value));
  }

  if (Array.isArray(config?.queryPlan?.filters)) {
    config.queryPlan.filters.forEach((filter: any) => {
      visit(filter?.valueTemplate);
      visit(filter?.value);
    });
  }

  if (Array.isArray(config?.queryPlan?.params)) {
    config.queryPlan.params.forEach((param: any) => {
      visit(param?.defaultValue);
      visit(param?.valueTemplate);
    });
  }

  if (typeof config?.filtersJson === 'string') {
    try {
      const filters = JSON.parse(config.filtersJson);
      if (Array.isArray(filters)) {
        filters.forEach((filter: any) => visit(filter?.value));
      }
    } catch {
      visit(config.filtersJson);
    }
  }

  return values.filter(value => value.includes('{{'));
};

const extractVariableRefs = (text: string, allNodes: Node[]): FlowField[] => {
  if (!text || typeof text !== 'string') return [];

  const refs = extractVariableTemplates(text, allNodes);
  const params: FlowField[] = [];

  refs.forEach(ref => {
    if (ref.kind === 'node' && ref.nodeId && ref.name) {
      const sourceNode = allNodes.find(n => n.id === ref.nodeId);
      params.push({
        nodeId: ref.nodeId,
        nodeType: mapNodeType(sourceNode?.type || ref.nodeType),
        name: ref.name,
        field: ref.name,
        type: 'any',
      });
      return;
    }

    if (ref.kind === 'payload') {
      const startNode = allNodes.find(n => n.type === 'start');
      if (startNode && ref.name) {
        params.push({
          nodeId: startNode.id,
          nodeType: mapNodeType(startNode.type),
          name: ref.name,
          field: ref.name,
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
  const dedupEdgeMap = new Map<string, FlowEdge>()
  backendEdges.forEach(edge => {
    const key = `${edge.source}-${edge.sourceHandle || ''}-${edge.target}-${edge.targetHandle || ''}`
    if (!dedupEdgeMap.has(key)) {
      dedupEdgeMap.set(key, edge)
    }
  })
  const edges = Array.from(dedupEdgeMap.values()).map(edge => convertEdgeFromBackend(edge, nodes));

  return { nodes, edges, flowSchemaVersion: draft.schemaVersion === 2 ? 2 : null };
};

const convertNodeFromBackend = (node: FlowNode): Node => {
  const frontendType = mapToBackendType(node.type);
  const config = convertDataToConfig(node.data, node.type);

  return {
    id: node.id || '',
    type: frontendType,
    position: node.position || { x: 0, y: 0 },
    parentNode: node.parentNode,
    extent: node.parentNode ? 'parent' : undefined,
    style: node.style,
    data: {
      label: node.label || '',
      description: node.description || node.desc,
      config,
      status: 'idle',
    },
  };
};

const convertEdgeFromBackend = (edge: FlowEdge, nodes: Node[]): Edge => {
  const sourceNode = nodes.find(node => node.id === edge.source)
  const targetNode = nodes.find(node => node.id === edge.target)

  let sourceHandle = edge.sourceHandle || undefined
  let targetHandle = edge.targetHandle || undefined

  if (sourceNode?.type === 'loop' && sourceHandle === 'source') {
    sourceHandle = targetNode?.parentNode === sourceNode.id ? 'loop-start' : 'loop-output'
  }

  if (targetNode?.type === 'loop' && targetHandle === 'target') {
    targetHandle = 'loop-input'
  }

  if (sourceNode?.type === 'loop' && targetNode?.parentNode === sourceNode.id && !sourceHandle) {
    sourceHandle = 'loop-start'
  }

  if (sourceNode?.type === 'loop' && targetNode?.parentNode !== sourceNode.id && !sourceHandle) {
    sourceHandle = 'loop-output'
  }

  if (targetNode?.type === 'loop' && !targetHandle) {
    targetHandle = 'loop-input'
  }

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle,
    targetHandle,
    type: edge.type,
    animated: edge.animated,
    style: edge.style,
  }
}

const convertDataToConfig = (data: FlowData | undefined, nodeType: string): Record<string, any> => {
  if (!data) return {};
  
  switch (nodeType) {
    case 'start':
      return convertStartDataToConfig(data);
    case 'end':
      return convertEndDataToConfig(data);
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
    case 'json':
      return convertJsonDataToConfig(data);
    case 'flow':
      return convertFlowDataToConfig(data);
    case 'loop':
      return convertLoopDataToConfig(data);
    case 'mul_query':
    case 'mul_update_row':
    case 'mul_delete_row':
      return data.options || {};
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
    approvalInputConfig: data.options?.approvalInputConfig,
  };
};

const convertEndDataToConfig = (data: FlowData): Record<string, any> => {
  const inputParams = Array.isArray(data.inputParams) ? data.inputParams : [];

  const outputs = inputParams.map((item: any) => ({
    key: item?.field || item?.name || '',
    value: item?.nodeId && item?.name ? `{{nodes.${item.nodeId}.${item.name}}}` : item?.value || '',
    template: item?.nodeId && item?.name ? `{{nodes.${item.nodeId}.${item.name}}}` : '',
    refPath: item?.nodeId && item?.name ? `nodes.${item.nodeId}.${item.name}` : '',
    nodeId: item?.nodeId || '',
    nodeType: item?.nodeType || '',
    name: item?.name || '',
  }));

  return {
    outputs,
  };
};

const convertLLMDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const messages = options.messages || [];
  const modelOptions = Array.isArray(options.model?.options) ? options.model.options : [];

  return {
    model: options.model?.params?.model || '',
    temperature: options.model?.params?.temperature || 0.7,
    systemPrompt: messages.find((m: any) => m.role === 'system')?.content || '',
    userPrompt: messages.find((m: any) => m.role === 'user')?.content || '',
    history: options.history || 0,
    isOutput: options.isOutput !== false,
    toolConfig: options.toolConfig || [],
    mcpConfig: options.mcpConfig || [],
    supplier: options.model?.supplier || options.supplier,
    supplierName: options.model?.supplierName || options.supplierName,
    configId: options.model?.configId || options.configId,
    comm: options.comm,
    options: modelOptions.map((option: any) => ({ ...option })),
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
    value: p.nodeId ? `{{nodes.${p.nodeId}.${p.name}}}` : p.value,
  }));

  return {
    code,
    language: options.type || 'javascript',
    inputVariables,
    inputParams: data.inputParams || [],
    outputParams: data.outputParams || [{ field: 'result', type: 'any' }],
    outputField: 'result',
  };
};

const convertJudgeDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const IF = options.IF || [];
  
  const conditions: any[] = [];
  IF.forEach((item: any) => {
    const variableTemplate = item.template || item.refPath || (item.nodeId ? `{{nodes.${item.nodeId}.${item.name}}}` : item.value);
    conditions.push({
      variable: variableTemplate,
      template: item.template || variableTemplate,
      refPath: item.refPath || variableTemplate,
      field: item.field,
      nodeId: item.nodeId,
      nodeType: item.nodeType,
      name: item.name,
      operator: mapOperatorToConfig(item.condition),
      value: item.value,
      logic: item.operator || 'AND',
    });
  });

  return {
    IF,
    conditionGroups: [{
      conditions,
      logic: 'AND',
      logicalOperator: 'AND',
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
    ? `{{nodes.${inputParam.nodeId}.${inputParam.name}}}`
    : inputParam?.value || '';

  return {
    model: options.model?.params?.model || '',
    supplier: options.model?.supplier || options.supplier,
    supplierName: options.model?.supplierName || options.supplierName,
    configId: options.model?.configId || options.configId,
    comm: options.comm,
    categories,
    types,
    descriptions,
    inputVariable,
    inputParams: data.inputParams || [{ field: 'content', type: 'string' }],
  };
};

const convertKnowDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const inputParam = (data.inputParams || [])[0];
  const query = inputParam?.nodeId 
    ? `{{nodes.${inputParam.nodeId}.${inputParam.name}}}`
    : inputParam?.value || '';

  return {
    query,
    inputParams: data.inputParams || [{ field: 'text', type: 'string' }],
    knowIds: options.knowIds || [],
    size: options.size || 3,
    minScore: options.minScore || 0.5,
    dataset_ids: options.knowIds || [],
    top_k: options.size || 3,
    score_threshold: options.minScore || 0.5,
  };
};

const convertVariableDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const inputVariables = (data.inputParams || []).map(p => ({
    key: p.field || 'input',
    value: p.nodeId ? `{{nodes.${p.nodeId}.${p.name}}}` : p.value,
  }));

  return {
    code: options.code || '',
    language: options.type || 'javascript',
    inputVariables,
    inputVariable: inputVariables[0]?.value || '',
    inputParams: data.inputParams || [],
    outputParams: data.outputParams || [{ field: 'result', type: 'any' }],
    outputField: (data.outputParams || [])[0]?.field || 'result',
  };
};

const convertParseDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const inputParam = (data.inputParams || [])[0];
  const inputVariable = inputParam?.nodeId 
    ? `{{nodes.${inputParam.nodeId}.${inputParam.name}}}`
    : inputParam?.value || '';

  return {
    inputVariable,
    inputParams: data.inputParams || [{ field: 'text', type: 'string' }],
    outputParams: data.outputParams || [{ field: 'result', type: 'any' }],
    parseType: options.type || 'text',
    selector: options.selector,
    schema: options.schema,
    model: options.model?.params?.model || '',
    supplier: options.model?.supplier || options.supplier,
    supplierName: options.model?.supplierName || options.supplierName,
    configId: options.model?.configId || options.configId,
    comm: options.comm,
  };
};

const convertJsonDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};
  const mode = options.mode === 'stringify' ? 'stringify' : 'parse';
  const outputType = mode === 'stringify' ? 'string' : 'json';
  const inputParam = (data.inputParams || [])[0];
  const inputVariable = inputParam?.nodeId
    ? `{{nodes.${inputParam.nodeId}.${inputParam.name}}}`
    : inputParam?.value || '';

  return {
    inputVariable,
    inputParams: data.inputParams || [{ field: 'text', type: 'string' }],
    outputParams: Array.isArray(data.outputParams) && data.outputParams.length > 0
      ? data.outputParams.map(item => ({ ...item, type: outputType }))
      : [{ field: 'json', type: outputType }],
    mode,
    schema: options.schema || {},
    outputField: (data.outputParams || [])[0]?.field || 'json',
  };
};

const convertFlowDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};

  return {
    flowLabel: options.label || '',
    flowId: options.flowId,
    inputParams: data.inputParams || [],
    outputParams: data.outputParams || [],
  };
};

const convertLoopDataToConfig = (data: FlowData): Record<string, any> => {
  const options = data.options || {};

  return {
    targetArray: options.targetArray || '',
    targetArrayField: options.targetArrayField || '',
    targetArrayNodeId: options.targetArrayNodeId || '',
    targetArrayNodeType: options.targetArrayNodeType || '',
    targetArrayTemplate: options.targetArray || '',
    executionMode: options.executionMode || 'serial',
    maxConcurrency: Number(options.maxConcurrency) > 0 ? Number(options.maxConcurrency) : 1,
    outputMode: options.outputMode || 'all',
    resultNodeId: options.resultNodeId || '',
    resultNodeType: options.resultNodeType || '',
    resultField: options.resultField || '',
    resultTemplate: options.resultTemplate || '',
    outputParams: data.outputParams || [{ field: 'result', type: 'array' }],
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
          type: normalizeVariableFieldType(v.type),
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

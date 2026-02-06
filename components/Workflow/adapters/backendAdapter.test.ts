import { describe, it, expect } from 'vitest';
import { exportToBackend } from './backendAdapter';
import { WorkflowNodeType, WorkflowStoreState } from '../types';
import { Node, Edge } from 'reactflow';

// Mock helper to create a basic node
const createNode = (id: string, type: WorkflowNodeType, config: any = {}): Node => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {
    label: type,
    config,
  },
});

describe('backendAdapter', () => {
  it('should convert Start node variables to inputParams', () => {
    const nodes = [
      createNode('start-1', WorkflowNodeType.START, {
        variables: [
          { name: 'topic', type: 'text', required: true, displayName: 'Topic' },
          { name: 'count', type: 'number', defaultValue: 5, displayName: 'Count' },
        ],
      }),
    ];
    const workflow: WorkflowStoreState = { nodes, edges: [], globalVariables: [] } as any;

    const result = exportToBackend(workflow);
    const startNode = result.nodes.find(n => n.type === 'start');

    expect(startNode).toBeDefined();
    expect(startNode?.data.inputParams).toHaveLength(2);
    expect(startNode?.data.inputParams?.[0]).toMatchObject({
      name: 'topic',
      type: 'text',
      required: true,
      label: 'Topic',
    });
    expect(startNode?.data.inputParams?.[1]).toMatchObject({
      name: 'count',
      type: 'number',
      default: 5,
    });
  });

  it('should convert LLM node prompt variables to inputParams', () => {
    const nodes = [
      createNode('start-1', WorkflowNodeType.START), // Source node
      createNode('llm-1', WorkflowNodeType.LLM, {
        model: 'gpt-4',
        systemPrompt: 'You are a helper.',
        userPrompt: 'Tell me about {{start-1.topic}} in {{start-1.language}}.',
      }),
    ];
    const workflow: WorkflowStoreState = { nodes, edges: [], globalVariables: [] } as any;

    const result = exportToBackend(workflow);
    const llmNode = result.nodes.find(n => n.type === 'llm');

    expect(llmNode).toBeDefined();
    // Should detect 2 variables: start-1.topic and start-1.language
    expect(llmNode?.data.inputParams).toHaveLength(2);
    expect(llmNode?.data.inputParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ nodeId: 'start-1', name: 'topic' }),
        expect.objectContaining({ nodeId: 'start-1', name: 'language' }),
      ])
    );
    expect(llmNode?.data.options?.messages).toEqual([
      { role: 'system', content: 'You are a helper.' },
      { role: 'user', content: 'Tell me about {{start-1.topic}} in {{start-1.language}}.' },
    ]);
  });

  it('should convert Script node and wrap code', () => {
    const nodes = [
      createNode('script-1', WorkflowNodeType.SCRIPT, {
        language: 'javascript',
        code: 'const a = 1; return { result: a };',
        inputVariables: [
            { key: 'arg1', value: '{{start-1.topic}}' }
        ]
      }),
      createNode('start-1', WorkflowNodeType.START)
    ];
    const workflow: WorkflowStoreState = { nodes, edges: [], globalVariables: [] } as any;

    const result = exportToBackend(workflow);
    const codeNode = result.nodes.find(n => n.type === 'code');

    expect(codeNode).toBeDefined();
    expect(codeNode?.data.options?.code).toContain('class Cool extends BaseCode');
    expect(codeNode?.data.options?.code).toContain('const a = 1; return { result: a };');
    expect(codeNode?.data.inputParams).toHaveLength(1);
    expect(codeNode?.data.inputParams?.[0]).toMatchObject({
        field: 'arg1',
        nodeId: 'start-1',
        name: 'topic'
    });
  });

  it('should convert Condition node expression', () => {
    const nodes = [
      createNode('cond-1', WorkflowNodeType.CONDITION, {
        expression: 'payload.value > 10',
      }),
    ];
    const workflow: WorkflowStoreState = { nodes, edges: [], globalVariables: [] } as any;

    const result = exportToBackend(workflow);
    const judgeNode = result.nodes.find(n => n.type === 'judge');

    expect(judgeNode).toBeDefined();
    expect(judgeNode?.data.options?.expression).toBe('payload.value > 10');
  });

  it('should convert Classifier node categories', () => {
    const nodes = [
      createNode('class-1', WorkflowNodeType.QUESTION_CLASSIFIER, {
        categories: [
          { id: 'c1', name: 'Tech', description: 'Technology related' },
          { id: 'c2', name: 'News', description: 'Daily news' },
        ],
        inputVariable: '{{start-1.text}}'
      }),
      createNode('start-1', WorkflowNodeType.START)
    ];
    const workflow: WorkflowStoreState = { nodes, edges: [], globalVariables: [] } as any;

    const result = exportToBackend(workflow);
    const classifyNode = result.nodes.find(n => n.type === 'classify');

    expect(classifyNode).toBeDefined();
    expect(classifyNode?.data.options?.types).toEqual(['Tech', 'News']);
    expect(classifyNode?.data.inputParams).toHaveLength(1);
    expect(classifyNode?.data.inputParams?.[0]).toMatchObject({
        field: 'input',
        nodeId: 'start-1',
        name: 'text'
    });
  });
  
  it('should convert Knowledge node', () => {
      const nodes = [
          createNode('know-1', WorkflowNodeType.KNOWLEDGE_RETRIEVAL, {
              query: '{{start-1.question}}',
              dataset_ids: ['ds1', 'ds2'],
              top_k: 5
          }),
          createNode('start-1', WorkflowNodeType.START)
      ];
      const workflow: WorkflowStoreState = { nodes, edges: [], globalVariables: [] } as any;
      
      const result = exportToBackend(workflow);
      const knowNode = result.nodes.find(n => n.type === 'know');
      
      expect(knowNode).toBeDefined();
      expect(knowNode?.data.options?.knowIds).toEqual(['ds1', 'ds2']);
      expect(knowNode?.data.options?.size).toBe(5);
      expect(knowNode?.data.inputParams?.[0]).toMatchObject({
          field: 'text',
          nodeId: 'start-1',
          name: 'question'
      });
  });
  
  it('should convert DataOp node', () => {
      const nodes = [
          createNode('op-1', WorkflowNodeType.DATA_OP, {
              opType: 'transform',
              targetField: '{{start-1.data}}'
          }),
          createNode('start-1', WorkflowNodeType.START)
      ];
      const workflow: WorkflowStoreState = { nodes, edges: [], globalVariables: [] } as any;
      
      const result = exportToBackend(workflow);
      const varNode = result.nodes.find(n => n.type === 'variable'); // DataOp maps to variable
      
      expect(varNode).toBeDefined();
      expect(varNode?.data.options?.opType).toBe('transform');
      expect(varNode?.data.inputParams?.[0]).toMatchObject({
          field: 'input',
          nodeId: 'start-1',
          name: 'data'
      });
  });

  it('should convert End node outputs', () => {
    const nodes = [
      createNode('end-1', WorkflowNodeType.END, {
        outputs: [
          { key: 'final_answer', value: '{{llm-1.text}}' },
          { key: 'static_val', value: 'done' }
        ],
      }),
      createNode('llm-1', WorkflowNodeType.LLM),
    ];
    const workflow: WorkflowStoreState = { nodes, edges: [], globalVariables: [] } as any;

    const result = exportToBackend(workflow);
    const endNode = result.nodes.find(n => n.type === 'end');

    expect(endNode).toBeDefined();
    // inputParams collects the data
    expect(endNode?.data.inputParams).toHaveLength(2);
    expect(endNode?.data.inputParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'final_answer', nodeId: 'llm-1', name: 'text' }),
        expect.objectContaining({ field: 'static_val', value: 'done' }),
      ])
    );
    // outputParams defines the interface
    expect(endNode?.data.outputParams).toHaveLength(2);
    expect(endNode?.data.outputParams?.[0].name).toBe('final_answer');
  });
});

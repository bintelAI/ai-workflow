import { describe, it, expect } from 'vitest';
import { 
  NODE_TYPE_MAP, 
  REVERSE_NODE_TYPE_MAP,
  FlowField,
  FlowData,
  FlowNode,
  FlowEdge,
  FlowDraft
} from '@/src/types/flow';

describe('Flow Types', () => {
  describe('NODE_TYPE_MAP', () => {
    it('should map frontend types to backend types', () => {
      expect(NODE_TYPE_MAP['start']).toBe('start');
      expect(NODE_TYPE_MAP['end']).toBe('end');
      expect(NODE_TYPE_MAP['llm']).toBe('llm');
      expect(NODE_TYPE_MAP['script']).toBe('code');
      expect(NODE_TYPE_MAP['condition']).toBe('judge');
      expect(NODE_TYPE_MAP['question_classifier']).toBe('classify');
      expect(NODE_TYPE_MAP['knowledge_retrieval']).toBe('know');
      expect(NODE_TYPE_MAP['data_op']).toBe('variable');
      expect(NODE_TYPE_MAP['document_extractor']).toBe('parse');
      expect(NODE_TYPE_MAP['loop']).toBe('flow');
    });
  });

  describe('REVERSE_NODE_TYPE_MAP', () => {
    it('should map backend types to frontend types', () => {
      expect(REVERSE_NODE_TYPE_MAP['start']).toBe('start');
      expect(REVERSE_NODE_TYPE_MAP['end']).toBe('end');
      expect(REVERSE_NODE_TYPE_MAP['llm']).toBe('llm');
      expect(REVERSE_NODE_TYPE_MAP['code']).toBe('script');
      expect(REVERSE_NODE_TYPE_MAP['judge']).toBe('condition');
      expect(REVERSE_NODE_TYPE_MAP['classify']).toBe('question_classifier');
      expect(REVERSE_NODE_TYPE_MAP['know']).toBe('knowledge_retrieval');
      expect(REVERSE_NODE_TYPE_MAP['variable']).toBe('data_op');
      expect(REVERSE_NODE_TYPE_MAP['parse']).toBe('document_extractor');
      expect(REVERSE_NODE_TYPE_MAP['flow']).toBe('loop');
    });
  });

  describe('FlowField type', () => {
    it('should have correct structure', () => {
      const field: FlowField = {
        field: 'input',
        type: 'string',
        value: 'hello',
        name: 'input',
        nodeId: 'node_1',
        nodeType: 'start',
        label: '输入',
        required: true
      };
      
      expect(field.field).toBe('input');
      expect(field.type).toBe('string');
      expect(field.value).toBe('hello');
    });
  });

  describe('FlowData type', () => {
    it('should have correct structure', () => {
      const data: FlowData = {
        inputParams: [{ field: 'input', type: 'string' }],
        outputParams: [{ field: 'output', type: 'string' }],
        options: { model: 'gpt-4' }
      };
      
      expect(data.inputParams).toHaveLength(1);
      expect(data.outputParams).toHaveLength(1);
      expect(data.options?.model).toBe('gpt-4');
    });
  });

  describe('FlowNode type', () => {
    it('should have correct structure', () => {
      const node: FlowNode = {
        id: 'node_1',
        type: 'llm',
        label: 'LLM Node',
        description: 'A language model node',
        position: { x: 100, y: 200 },
        data: {
          inputParams: [{ field: 'prompt', type: 'string' }],
          outputParams: [{ field: 'text', type: 'string' }]
        }
      };
      
      expect(node.id).toBe('node_1');
      expect(node.type).toBe('llm');
      expect(node.position).toEqual({ x: 100, y: 200 });
    });
  });

  describe('FlowEdge type', () => {
    it('should have correct structure', () => {
      const edge: FlowEdge = {
        id: 'edge_1',
        source: 'node_1',
        target: 'node_2',
        sourceHandle: 'output',
        targetHandle: 'input',
        animated: true
      };
      
      expect(edge.id).toBe('edge_1');
      expect(edge.source).toBe('node_1');
      expect(edge.target).toBe('node_2');
    });
  });

  describe('FlowDraft type', () => {
    it('should have correct structure', () => {
      const draft: FlowDraft = {
        nodes: [
          { id: 'node_1', type: 'start' },
          { id: 'node_2', type: 'end' }
        ],
        edges: [
          { id: 'edge_1', source: 'node_1', target: 'node_2' }
        ],
        viewport: { x: 0, y: 0, zoom: 1 }
      };
      
      expect(draft.nodes).toHaveLength(2);
      expect(draft.edges).toHaveLength(1);
      expect(draft.viewport?.zoom).toBe(1);
    });
  });
});

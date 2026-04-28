import { describe, it, expect, vi } from 'vitest';
import { exportToBackend, importFromBackend } from '../adapters/backendAdapter';
import type { FlowDraft } from '@/src/types/flow';
import type { WorkflowNodeType } from '../types';

vi.mock('@/api/flowChat', () => ({
  flowChatApi: {
    completions: vi.fn(),
  },
}))

describe('backendAdapter', () => {
  describe('exportToBackend', () => {
    it('should convert start node correctly', () => {
      const workflow = {
        nodes: [
          {
            id: 'node_1',
            type: 'start' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '开始',
              config: {
                variables: [
                  { name: 'input', displayName: '输入', type: 'text', required: true, defaultValue: 'hello' }
                ]
              }
            }
          }
        ],
        edges: []
      };

      const result = exportToBackend(workflow as any);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('start');
      expect(result.nodes[0].data?.inputParams).toBeDefined();
      expect(result.nodes[0].data?.inputParams).toHaveLength(1);
      expect(result.nodes[0].data?.inputParams?.[0]?.field).toBe('input');
    });

    it('should keep approval table input config on start node', () => {
      const approvalInputConfig = {
        sourceType: 'mul_table',
        projectId: 'project_current',
        sheetId: 'sheet_1',
        sheetName: '费用表',
        fields: [
          {
            fieldId: 'amount',
            fieldName: '金额',
            fieldType: 'number',
            variableName: 'amount',
            label: '金额',
            required: true,
            permission: 'readonly',
            includeInPayload: true,
          },
        ],
      };
      const workflow = {
        nodes: [
          {
            id: 'node_1',
            type: 'start' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '开始',
              config: {
                approvalInputConfig,
              },
            },
          },
        ],
        edges: [],
      };

      const exported = exportToBackend(workflow as any);
      expect(exported.nodes[0].data?.options?.approvalInputConfig).toEqual(approvalInputConfig);

      const imported = importFromBackend(exported);
      expect(imported.nodes?.[0]?.data?.config?.approvalInputConfig).toEqual(approvalInputConfig);
    });

    it('should convert LLM node correctly', () => {
      const workflow = {
        nodes: [
          {
            id: 'node_1',
            type: 'llm' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: 'LLM',
              config: {
                model: 'gpt-4',
                temperature: 0.7,
                systemPrompt: 'You are a helpful assistant',
                userPrompt: 'Hello {{nodes.node_0.input}}'
              }
            }
          }
        ],
        edges: []
      };

      const result = exportToBackend(workflow as any);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('llm');
      expect(result.nodes[0].data?.options?.model?.params?.model).toBe('gpt-4');
      expect(result.nodes[0].data?.options?.model?.params?.temperature).toBe(0.7);
    });

    it('should convert condition node correctly', () => {
      const workflow = {
        nodes: [
          {
            id: 'node_1',
            type: 'condition' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '条件判断',
              config: {
                conditionGroups: [
                  {
                    conditions: [
                      { variable: '{{nodes.node_0.status}}', operator: 'equals', value: 'active', logic: 'AND' }
                    ]
                  }
                ]
              }
            }
          }
        ],
        edges: []
      };

      const result = exportToBackend(workflow as any);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('judge');
      expect(result.nodes[0].data?.options?.IF).toBeDefined();
    });

    it('should convert loop node with aggregation metadata correctly', () => {
      const workflow = {
        nodes: [
          {
            id: 'loop_1',
            type: 'loop' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '循环',
              config: {
                targetArray: '{{payload.list}}',
                targetArrayField: 'list',
                targetArrayNodeId: 'start_1',
                targetArrayNodeType: 'start',
                targetArrayTemplate: '{{payload.list}}',
                executionMode: 'parallel',
                maxConcurrency: 3,
                outputMode: 'field',
                resultNodeId: 'var_1',
                resultNodeType: 'variable',
                resultField: 'score',
                resultTemplate: '{{nodes.var_1.score}}',
                outputParams: [
                  {
                    field: 'result',
                    name: 'result',
                    type: 'array',
                    label: '评分列表',
                    itemType: 'number',
                    itemLabel: '评分',
                  },
                ],
              }
            }
          },
          {
            id: 'var_1',
            type: 'variable' as WorkflowNodeType,
            parentNode: 'loop_1',
            position: { x: 120, y: 160 },
            data: {
              label: '变量处理',
              config: {
                outputParams: [{ field: 'score', type: 'number', label: '评分' }],
              }
            }
          }
        ],
        edges: []
      };

      const result = exportToBackend(workflow as any);
      const loopNode = result.nodes.find(n => n.id === 'loop_1');

      expect(loopNode?.type).toBe('loop');
      expect(loopNode?.data?.options?.executionMode).toBe('parallel');
      expect(loopNode?.data?.options?.maxConcurrency).toBe(3);
      expect(loopNode?.data?.options?.resultNodeId).toBe('var_1');
      expect(loopNode?.data?.options?.resultField).toBe('score');
      expect(loopNode?.data?.outputParams?.[0]).toEqual(
        expect.objectContaining({
          field: 'result',
          type: 'array',
          itemType: 'number',
          itemLabel: '评分',
        })
      );
    });

    it('should convert edges correctly', () => {
      const workflow = {
        nodes: [],
        edges: [
          {
            id: 'edge_1',
            source: 'node_1',
            target: 'node_2',
            sourceHandle: 'output',
            targetHandle: 'input'
          }
        ]
      };

      const result = exportToBackend(workflow as any);

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('node_1');
      expect(result.edges[0].target).toBe('node_2');
    });
  });

  describe('importFromBackend', () => {
    it('should import start node correctly', () => {
      const draft: FlowDraft = {
        nodes: [
          {
            id: 'node_1',
            type: 'start',
            label: '开始',
            position: { x: 100, y: 100 },
            data: {
              inputParams: [
                { field: 'input', type: 'string', label: '输入', required: true, value: 'hello' }
              ]
            }
          }
        ],
        edges: []
      };

      const result = importFromBackend(draft);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes?.[0]?.type).toBe('start');
      expect(result.nodes?.[0]?.data?.config?.variables).toBeDefined();
    });

    it('should import LLM node correctly', () => {
      const draft: FlowDraft = {
        nodes: [
          {
            id: 'node_1',
            type: 'llm',
            label: 'LLM',
            position: { x: 100, y: 100 },
            data: {
              inputParams: [{ field: 'input', nodeId: 'node_0', name: 'text' }],
              outputParams: [{ field: 'text', type: 'string' }],
              options: {
                model: { params: { model: 'gpt-4', temperature: 0.7 } },
                messages: [
                  { role: 'system', content: 'You are helpful' },
                  { role: 'user', content: 'Hello' }
                ]
              }
            }
          }
        ],
        edges: []
      };

      const result = importFromBackend(draft);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes?.[0]?.type).toBe('llm');
      expect(result.nodes?.[0]?.data?.config?.model).toBe('gpt-4');
    });

    it('should import loop node aggregation metadata correctly', () => {
      const draft: FlowDraft = {
        nodes: [
          {
            id: 'loop_1',
            type: 'loop',
            label: '循环',
            position: { x: 100, y: 100 },
            data: {
              outputParams: [
                {
                  field: 'result',
                  name: 'result',
                  type: 'array',
                  label: '评分列表',
                  itemType: 'number',
                  itemLabel: '评分',
                },
              ],
              options: {
                targetArray: '{{payload.list}}',
                targetArrayField: 'list',
                targetArrayNodeId: 'start_1',
                targetArrayNodeType: 'start',
                executionMode: 'parallel',
                maxConcurrency: 5,
                outputMode: 'field',
                resultNodeId: 'var_1',
                resultNodeType: 'variable',
                resultField: 'score',
                resultTemplate: '{{nodes.var_1.score}}',
              }
            }
          }
        ],
        edges: []
      }

      const result = importFromBackend(draft)
      const loopNode = result.nodes?.[0]

      expect(loopNode?.type).toBe('loop')
      expect(loopNode?.data?.config?.executionMode).toBe('parallel')
      expect(loopNode?.data?.config?.maxConcurrency).toBe(5)
      expect(loopNode?.data?.config?.resultNodeId).toBe('var_1')
      expect(loopNode?.data?.config?.resultField).toBe('score')
      expect(loopNode?.data?.config?.outputParams?.[0]).toEqual(
        expect.objectContaining({
          field: 'result',
          type: 'array',
          itemType: 'number',
          itemLabel: '评分',
        })
      )
    })
  });

  describe('template compatibility', () => {
    it('should normalize nodes template during export', () => {
      const workflow = {
        nodes: [
          {
            id: 'node_0',
            type: 'start' as WorkflowNodeType,
            position: { x: 0, y: 0 },
            data: {
              label: '开始',
              config: {
                variables: [
                  { name: 'input', displayName: '输入', type: 'text' }
                ]
              }
            }
          },
          {
            id: 'node_1',
            type: 'llm' as WorkflowNodeType,
            position: { x: 200, y: 0 },
            data: {
              label: 'LLM',
              config: {
                model: 'gpt-4',
                userPrompt: 'Hello {{nodes.node_0.input}}'
              }
            }
          }
        ],
        edges: []
      };

      const exported = exportToBackend(workflow as any);
      const llmNode = exported.nodes.find(n => n.type === 'llm');

      expect(llmNode?.data.inputParams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ nodeId: 'node_0', name: 'input' })
        ])
      );
    });
  });
});

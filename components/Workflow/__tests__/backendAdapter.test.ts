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
      expect(exported.nodes[0].data?.inputParams).toEqual([
        expect.objectContaining({
          field: 'rowId',
          name: 'rowId',
          label: '审批行 Row ID',
          type: 'string',
          required: true,
        }),
        expect.objectContaining({
          field: 'sheetId',
          name: 'sheetId',
          label: '审批表 Sheet ID',
          type: 'string',
          required: true,
        }),
        expect.objectContaining({
          field: 'amount',
          name: 'amount',
          label: '金额',
          type: 'number',
          required: true,
        }),
      ]);

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

    it('should export approval AI review node with fixed decision outputs', () => {
      const workflow = {
        nodes: [
          {
            id: 'start_1',
            type: 'start' as WorkflowNodeType,
            position: { x: 0, y: 0 },
            data: {
              label: '开始',
              config: {},
            },
          },
          {
            id: 'ai_review_1',
            type: 'approval_ai_review' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: 'AI 审批评估',
              config: {
                model: 'gpt-4',
                temperature: 0.1,
                systemPrompt: '你是审批评估助手。',
                userPrompt: '评估金额 {{nodes.start_1.amount}}',
                approveRules: '金额低于 500 自动通过',
                rejectRules: '票据缺失自动驳回',
                manualRules: '不确定时人工审批',
              },
            },
          },
        ],
        edges: [],
      };

      const result = exportToBackend(workflow as any);
      const reviewNode = result.nodes.find(node => node.id === 'ai_review_1');

      expect(reviewNode?.type).toBe('approval_ai_review');
      expect(reviewNode?.data?.inputParams).toEqual([
        expect.objectContaining({
          nodeId: 'start_1',
          nodeType: 'start',
          name: 'amount',
        }),
      ]);
      expect(reviewNode?.data?.outputParams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'approvalDecision', type: 'string' }),
          expect.objectContaining({ field: 'reason', type: 'string' }),
        ])
      );
      expect(reviewNode?.data?.options?.messages?.[1]?.content).toContain('只允许返回合法 JSON');
      expect(reviewNode?.data?.options?.messages?.[1]?.content).toContain('approvalDecision 只能是');
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

    it('should export JSON parse node stringify mode', () => {
      const workflow = {
        nodes: [
          {
            id: 'json_1',
            type: 'json_parse' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: 'JSON解析',
              config: {
                mode: 'stringify',
                inputParams: [
                  {
                    field: 'text',
                    name: 'payload',
                    type: 'json',
                    nodeId: 'start_1',
                    nodeType: 'start',
                  },
                ],
                outputParams: [{ field: 'json', type: 'string' }],
              },
            },
          },
        ],
        edges: [],
      };

      const exported = exportToBackend(workflow as any);

      expect(exported.nodes[0].type).toBe('json');
      expect(exported.nodes[0].data?.options?.mode).toBe('stringify');
      expect(exported.nodes[0].data?.outputParams?.[0]).toEqual(
        expect.objectContaining({ field: 'json', type: 'string' })
      );
    });

    it('should export condition config saved by ConditionConfig IF list', () => {
      const workflow = {
        nodes: [
          {
            id: 'condition_1',
            type: 'condition' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '条件判断',
              config: {
                IF: [
                  {
                    field: 'amount',
                    nodeId: 'start_1',
                    nodeType: 'start',
                    name: 'amount',
                    template: '{{nodes.start_1.amount}}',
                    refPath: '{{nodes.start_1.amount}}',
                    condition: 'greaterThan',
                    value: '100',
                  },
                ],
              },
            },
          },
        ],
        edges: [],
      };

      const exported = exportToBackend(workflow as any);
      const judgeNode = exported.nodes.find(node => node.id === 'condition_1');

      expect(judgeNode?.type).toBe('judge');
      expect(judgeNode?.data?.options?.IF).toEqual([
        expect.objectContaining({
          field: 'amount',
          nodeId: 'start_1',
          nodeType: 'start',
          name: 'amount',
          template: '{{nodes.start_1.amount}}',
          refPath: '{{nodes.start_1.amount}}',
          condition: 'greaterThan',
          value: '100',
        }),
      ]);
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

    it('should export question classifier config saved by QuestionClassifierConfig', () => {
      const workflow = {
        nodes: [
          {
            id: 'classifier_1',
            type: 'question_classifier' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '问题分类',
              config: {
                inputParams: [
                  {
                    field: 'content',
                    name: 'amount',
                    nodeId: 'start_1',
                    nodeType: 'start',
                    template: '{{nodes.start_1.amount}}',
                  },
                ],
                types: ['通过', '拒绝'],
                descriptions: ['金额合规', '金额异常'],
                model: 'gpt-4',
              },
            },
          },
        ],
        edges: [],
      };

      const exported = exportToBackend(workflow as any);
      const classifierNode = exported.nodes.find(node => node.id === 'classifier_1');

      expect(classifierNode?.type).toBe('classify');
      expect(classifierNode?.data?.inputParams?.[0]).toEqual(
        expect.objectContaining({
          field: 'content',
          nodeId: 'start_1',
          name: 'amount',
        })
      );
      expect(classifierNode?.data?.options?.types).toEqual(['通过', '拒绝']);
      expect(classifierNode?.data?.options?.descriptions).toEqual(['金额合规', '金额异常']);
    });

    it('should export knowledge retrieval config saved by KnowledgeRetrievalConfig', () => {
      const workflow = {
        nodes: [
          {
            id: 'know_1',
            type: 'knowledge_retrieval' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '知识库检索',
              config: {
                inputParams: [
                  {
                    field: 'text',
                    name: 'question',
                    nodeId: 'start_1',
                    nodeType: 'start',
                    template: '{{nodes.start_1.question}}',
                  },
                ],
                knowIds: [11, 22],
                size: 20,
                minScore: 0.75,
              },
            },
          },
        ],
        edges: [],
      };

      const exported = exportToBackend(workflow as any);
      const knowNode = exported.nodes.find(node => node.id === 'know_1');

      expect(knowNode?.type).toBe('know');
      expect(knowNode?.data?.inputParams?.[0]).toEqual(
        expect.objectContaining({
          field: 'text',
          nodeId: 'start_1',
          name: 'question',
        })
      );
      expect(knowNode?.data?.options).toEqual(
        expect.objectContaining({
          knowIds: [11, 22],
          size: 20,
          minScore: 0.75,
        })
      );
    });

    it('should export script input and output params saved by ScriptConfig', () => {
      const workflow = {
        nodes: [
          {
            id: 'script_1',
            type: 'script' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '脚本',
              config: {
                code: 'return { total: params.amount }',
                language: 'javascript',
                inputParams: [
                  {
                    field: 'amount',
                    name: 'amount',
                    nodeId: 'start_1',
                    nodeType: 'start',
                    template: '{{nodes.start_1.amount}}',
                  },
                ],
                outputParams: [{ field: 'total', name: 'total', type: 'number' }],
              },
            },
          },
        ],
        edges: [],
      };

      const exported = exportToBackend(workflow as any);
      const scriptNode = exported.nodes.find(node => node.id === 'script_1');

      expect(scriptNode?.type).toBe('code');
      expect(scriptNode?.data?.inputParams?.[0]).toEqual(
        expect.objectContaining({
          field: 'amount',
          nodeId: 'start_1',
          name: 'amount',
        })
      );
      expect(scriptNode?.data?.outputParams).toEqual([
        expect.objectContaining({ field: 'total', name: 'total', type: 'number' }),
      ]);
    });

    it('should export project table operation nodes with stable backend types and outputs', () => {
      const workflow = {
        nodes: [
          {
            id: 'query_1',
            type: 'mul_query' as WorkflowNodeType,
            position: { x: 100, y: 100 },
            data: {
              label: '查询项目表',
              config: {
                targetProjectId: 'project_b',
                sheetId: 'sheet_order',
                filtersJson: '[{"columnId":"status","operator":"eq","value":"open"}]',
                returnFields: 'name,amount',
                returnMode: 'list',
                maxRows: 20,
              },
            },
          },
          {
            id: 'update_1',
            type: 'mul_update_row' as WorkflowNodeType,
            position: { x: 300, y: 100 },
            data: {
              label: '修改项目表行',
              config: {
                targetProjectId: 'project_b',
                sheetId: 'sheet_order',
                rowIdTemplate: '{{nodes.query_1.data.firstRow.rowId}}',
                fieldMappingsJson: '{"status":"done"}',
              },
            },
          },
          {
            id: 'delete_1',
            type: 'mul_delete_row' as WorkflowNodeType,
            position: { x: 500, y: 100 },
            data: {
              label: '删除项目表行',
              config: {
                targetProjectId: 'project_b',
                sheetId: 'sheet_order',
                rowIdTemplate: '{{nodes.query_1.data.firstRow.rowId}}',
              },
            },
          },
        ],
        edges: [],
      };

      const exported = exportToBackend(workflow as any);
      const queryNode = exported.nodes.find(node => node.id === 'query_1');
      const updateNode = exported.nodes.find(node => node.id === 'update_1');
      const deleteNode = exported.nodes.find(node => node.id === 'delete_1');

      expect(queryNode?.type).toBe('mul_query');
      expect(updateNode?.type).toBe('mul_update_row');
      expect(deleteNode?.type).toBe('mul_delete_row');
      expect(queryNode?.data?.outputParams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'data.rows', type: 'array' }),
          expect.objectContaining({ field: 'data.firstRow', type: 'object' }),
          expect.objectContaining({ field: 'data.total', type: 'number' }),
        ])
      );
      expect(updateNode?.data?.inputParams).toEqual([
        expect.objectContaining({ nodeId: 'query_1', name: 'data.firstRow.rowId' }),
      ]);
      expect(deleteNode?.data?.inputParams).toEqual([
        expect.objectContaining({ nodeId: 'query_1', name: 'data.firstRow.rowId' }),
      ]);
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

    it('should import judge IF into condition config used by ConditionConfig', () => {
      const draft: FlowDraft = {
        nodes: [
          {
            id: 'condition_1',
            type: 'judge',
            label: '条件判断',
            position: { x: 100, y: 100 },
            data: {
              inputParams: [],
              outputParams: [{ field: 'result', type: 'boolean' }],
              options: {
                IF: [
                  {
                    field: 'amount',
                    nodeId: 'start_1',
                    nodeType: 'start',
                    name: 'amount',
                    template: '{{nodes.start_1.amount}}',
                    refPath: '{{nodes.start_1.amount}}',
                    condition: 'greaterThan',
                    value: '100',
                  },
                ],
                ELSE: [],
              },
            },
          },
        ],
        edges: [],
      };

      const imported = importFromBackend(draft);
      const conditionNode = imported.nodes?.find(node => node.id === 'condition_1');

      expect(conditionNode?.type).toBe('condition');
      expect(conditionNode?.data?.config?.IF).toEqual([
        expect.objectContaining({
          field: 'amount',
          nodeId: 'start_1',
          nodeType: 'start',
          name: 'amount',
          template: '{{nodes.start_1.amount}}',
          refPath: '{{nodes.start_1.amount}}',
          condition: 'greaterThan',
          value: '100',
        }),
      ]);
      expect(conditionNode?.data?.config?.conditionGroups?.[0]?.conditions?.[0]).toEqual(
        expect.objectContaining({
          variable: '{{nodes.start_1.amount}}',
          operator: 'greater_than',
          value: '100',
        })
      );
    });

    it('should import classifier config into fields used by QuestionClassifierConfig', () => {
      const draft: FlowDraft = {
        nodes: [
          {
            id: 'classifier_1',
            type: 'classify',
            label: '问题分类',
            position: { x: 100, y: 100 },
            data: {
              inputParams: [{ field: 'content', nodeId: 'start_1', nodeType: 'start', name: 'amount' }],
              outputParams: [{ field: 'index', type: 'number' }],
              options: {
                model: { params: { model: 'gpt-4' } },
                types: ['通过', '拒绝'],
                descriptions: ['金额合规', '金额异常'],
              },
            },
          },
        ],
        edges: [],
      };

      const imported = importFromBackend(draft);
      const classifierNode = imported.nodes?.find(node => node.id === 'classifier_1');

      expect(classifierNode?.type).toBe('question_classifier');
      expect(classifierNode?.data?.config?.types).toEqual(['通过', '拒绝']);
      expect(classifierNode?.data?.config?.descriptions).toEqual(['金额合规', '金额异常']);
      expect(classifierNode?.data?.config?.inputParams?.[0]).toEqual(
        expect.objectContaining({ field: 'content', nodeId: 'start_1', name: 'amount' })
      );
    });

    it('should import knowledge config into fields used by KnowledgeRetrievalConfig', () => {
      const draft: FlowDraft = {
        nodes: [
          {
            id: 'know_1',
            type: 'know',
            label: '知识库检索',
            position: { x: 100, y: 100 },
            data: {
              inputParams: [{ field: 'text', nodeId: 'start_1', nodeType: 'start', name: 'question' }],
              outputParams: [{ field: 'documents', type: 'array' }],
              options: {
                knowIds: [11, 22],
                size: 20,
                minScore: 0.75,
              },
            },
          },
        ],
        edges: [],
      };

      const imported = importFromBackend(draft);
      const knowNode = imported.nodes?.find(node => node.id === 'know_1');

      expect(knowNode?.type).toBe('knowledge_retrieval');
      expect(knowNode?.data?.config?.knowIds).toEqual([11, 22]);
      expect(knowNode?.data?.config?.size).toBe(20);
      expect(knowNode?.data?.config?.minScore).toBe(0.75);
      expect(knowNode?.data?.config?.inputParams?.[0]).toEqual(
        expect.objectContaining({ field: 'text', nodeId: 'start_1', name: 'question' })
      );
    });

    it('should import script params into fields used by ScriptConfig', () => {
      const draft: FlowDraft = {
        nodes: [
          {
            id: 'script_1',
            type: 'code',
            label: '脚本',
            position: { x: 100, y: 100 },
            data: {
              inputParams: [{ field: 'amount', nodeId: 'start_1', nodeType: 'start', name: 'amount' }],
              outputParams: [{ field: 'total', name: 'total', type: 'number' }],
              options: {
                code: 'return { total: params.amount }',
                type: 'javascript',
              },
            },
          },
        ],
        edges: [],
      };

      const imported = importFromBackend(draft);
      const scriptNode = imported.nodes?.find(node => node.id === 'script_1');

      expect(scriptNode?.type).toBe('script');
      expect(scriptNode?.data?.config?.inputParams?.[0]).toEqual(
        expect.objectContaining({ field: 'amount', nodeId: 'start_1', name: 'amount' })
      );
      expect(scriptNode?.data?.config?.outputParams).toEqual([
        expect.objectContaining({ field: 'total', name: 'total', type: 'number' }),
      ]);
    });

    it('should import project table operation node options without losing config', () => {
      const draft: FlowDraft = {
        nodes: [
          {
            id: 'query_1',
            type: 'mul_query',
            label: '查询项目表',
            position: { x: 100, y: 100 },
            data: {
              outputParams: [{ field: 'data.rows', type: 'array' }],
              options: {
                targetProjectId: 'project_b',
                sheetId: 'sheet_order',
                maxRows: 20,
                returnMode: 'list',
              },
            },
          },
        ],
        edges: [],
      };

      const imported = importFromBackend(draft);
      const queryNode = imported.nodes?.find(node => node.id === 'query_1');

      expect(queryNode?.type).toBe('mul_query');
      expect(queryNode?.data?.config).toEqual(
        expect.objectContaining({
          targetProjectId: 'project_b',
          sheetId: 'sheet_order',
          maxRows: 20,
          returnMode: 'list',
        })
      );
    });
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

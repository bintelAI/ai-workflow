import { describe, expect, it } from 'vitest'

import { buildVariableCatalog } from '../utils/workflowVariables'

describe('workflowVariables', () => {
  it('exposes approval initiator user id as a system variable', () => {
    const groups = buildVariableCatalog({
      nodes: [],
      edges: [],
      currentNodeId: null,
    } as any)

    const systemVariables = groups.find(group => group.id === 'system')?.variables || []

    expect(systemVariables).toContainEqual(
      expect.objectContaining({
        scope: 'system',
        path: 'system.initiator_id',
        template: '{{system.initiator_id}}',
        label: '发起者用户 ID',
        type: 'number',
      })
    )
  })

  it('does not expose deprecated approval AI review outputs as upstream node variables', () => {
    const groups = buildVariableCatalog({
      nodes: [
        {
          id: 'start_1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { label: '开始', config: { devInput: '{"amount":1000}' } },
        },
        {
          id: 'ai_review_1',
          type: 'approval_ai_review',
          position: { x: 120, y: 0 },
          data: { label: 'AI 审批评估', config: {} },
        },
        {
          id: 'approval_1',
          type: 'approval',
          position: { x: 240, y: 0 },
          data: { label: '主管审批', config: {} },
        },
      ],
      edges: [
        { id: 'e1', source: 'start_1', target: 'ai_review_1' },
        { id: 'e2', source: 'ai_review_1', target: 'approval_1' },
      ],
      currentNodeId: 'approval_1',
    } as any)

    const reviewVariables = groups.find(group => group.id === 'ai_review_1')?.variables || []

    expect(reviewVariables).toEqual([])
  })

  it('exposes approval table input fields as payload variables', () => {
    const groups = buildVariableCatalog({
      nodes: [
        {
          id: 'start_1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            label: '开始',
            config: {
              approvalInputConfig: {
                sourceType: 'mul_table',
                projectId: 'project_current',
                sheetId: 'sheet_1',
                sheetName: '费用表',
                fields: [
                  {
                    fieldId: 'amount_field',
                    fieldName: '金额',
                    fieldType: 'number',
                    variableName: 'amount',
                    label: '金额',
                    required: true,
                    permission: 'readonly',
                    includeInPayload: true,
                  },
                  {
                    fieldId: 'internal_note',
                    fieldName: '内部备注',
                    fieldType: 'text',
                    variableName: 'internal_note',
                    label: '内部备注',
                    required: false,
                    permission: 'hidden',
                    includeInPayload: false,
                  },
                ],
              },
            },
          },
        },
        {
          id: 'llm_1',
          type: 'llm',
          position: { x: 120, y: 0 },
          data: { label: 'AI 分析', config: {} },
        },
      ],
      edges: [{ id: 'e1', source: 'start_1', target: 'llm_1' }],
      currentNodeId: 'llm_1',
    } as any)

    const startVariables = groups.find(group => group.id === 'start_1')?.variables || []

    expect(startVariables).toEqual([
      expect.objectContaining({
        scope: 'payload',
        path: 'payload.amount',
        template: '{{payload.amount}}',
        name: 'amount',
        label: '金额 (amount)',
        type: 'number',
      }),
    ])

    const globalVariables = groups.find(group => group.id === 'global')?.variables || []
    expect(globalVariables).toContainEqual(
      expect.objectContaining({
        scope: 'global',
        path: 'payload.sheetId',
        template: '{{payload.sheetId}}',
        name: 'sheetId',
        label: '审批表 Sheet ID',
        value: 'sheet_1',
      })
    )
    expect(globalVariables).toContainEqual(
      expect.objectContaining({
        scope: 'global',
        path: 'payload.rowId',
        template: '{{payload.rowId}}',
        name: 'rowId',
        label: '审批行 Row ID',
      })
    )
  })

  it('exposes project table query outputs as nested data variables', () => {
    const groups = buildVariableCatalog({
      nodes: [
        {
          id: 'start_1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { label: '开始', config: { devInput: '{}' } },
        },
        {
          id: 'query_1',
          type: 'mul_query',
          position: { x: 120, y: 0 },
          data: { label: '查询项目表', config: {} },
        },
        {
          id: 'llm_1',
          type: 'llm',
          position: { x: 240, y: 0 },
          data: { label: 'AI 分析', config: {} },
        },
      ],
      edges: [
        { id: 'e1', source: 'start_1', target: 'query_1' },
        { id: 'e2', source: 'query_1', target: 'llm_1' },
      ],
      currentNodeId: 'llm_1',
    } as any)

    const queryVariables = groups.find(group => group.id === 'query_1')?.variables || []

    expect(queryVariables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scope: 'node',
          path: 'nodes.query_1.data.rows',
          template: '{{nodes.query_1.data.rows}}',
          name: 'data.rows',
          type: 'array',
        }),
        expect.objectContaining({
          scope: 'node',
          path: 'nodes.query_1.data.firstRow',
          template: '{{nodes.query_1.data.firstRow}}',
          name: 'data.firstRow',
          type: 'object',
        }),
        expect.objectContaining({
          scope: 'node',
          path: 'nodes.query_1.data.total',
          template: '{{nodes.query_1.data.total}}',
          name: 'data.total',
          type: 'number',
        }),
      ])
    )
  })
})

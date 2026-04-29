import { describe, expect, it } from 'vitest'

import { buildVariableCatalog } from '../utils/workflowVariables'

describe('workflowVariables', () => {
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
  })
})

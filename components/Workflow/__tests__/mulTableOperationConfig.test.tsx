import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MulTableOperationConfig from '../configs/MulTableOperationConfig'
import { WorkflowNodeType } from '../types'

vi.mock('@ai-flow-src/api/mul', () => ({
  mulApi: {
    getTeamProjects: vi.fn().mockResolvedValue([
      { id: 'project_1', name: '目标项目' },
    ]),
    getProjectSheets: vi.fn().mockResolvedValue([
      { sheetId: 'sheet_1', name: '目标表', type: 'sheet' },
    ]),
    getSheetColumns: vi.fn().mockResolvedValue([
      { fieldId: 'name', label: '姓名', type: 'text' },
      { fieldId: 'status', label: '状态', type: 'select' },
    ]),
  },
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: () => ({
    selectedNodeId: 'mul_1',
    nodes: [
      {
        id: 'start_1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: '流程开始', config: { devInput: '{"projectId":"p1","sheetId":"s1","rowId":"r1"}' } },
      },
      {
        id: 'mul_1',
        type: 'mul_update_row',
        position: { x: 100, y: 0 },
        data: { label: '修改项目表行', config: {} },
      },
    ],
    edges: [{ id: 'e1', source: 'start_1', target: 'mul_1' }],
    globalVariables: [],
  }),
}))

describe('MulTableOperationConfig', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.clearAllMocks()
  })

  it('provides variable insertion controls for project table operation fields', async () => {
    await act(async () => {
      root.render(
        <MulTableOperationConfig
          nodeType={WorkflowNodeType.MUL_UPDATE_ROW}
          config={{
            targetProjectId: '',
            sheetId: '',
            rowIdTemplate: '',
            fieldMappingsJson: '{}',
          }}
          onConfigChange={vi.fn()}
        />
      )
    })

    expect(container.querySelectorAll('button[title="插入变量"]').length).toBeGreaterThanOrEqual(3)
  })

  it('renders structured binding summary for update row node', async () => {
    await act(async () => {
      root.render(
        <MulTableOperationConfig
          nodeType={WorkflowNodeType.MUL_UPDATE_ROW}
          config={{
            targetProjectId: 'project_1',
            sheetId: 'sheet_1',
            rowIdTemplate: '{{payload.rowId}}',
            fieldMappingsJson: '{"name":"{{payload.name}}"}',
            targetBinding: {
              projectId: 'project_1',
              projectName: '目标项目',
              sheetId: 'sheet_1',
              sheetName: '目标表',
              rowIdTemplate: '{{payload.rowId}}',
              fieldBindings: [
                {
                  targetFieldId: 'name',
                  targetFieldLabel: '姓名',
                  sourceTemplate: '{{payload.name}}',
                },
              ],
            },
          }}
          onConfigChange={vi.fn()}
          teamId="team_1"
          projectId="project_current"
        />
      )
    })

    expect(container.textContent).toContain('绑定字段')
    expect(container.textContent).toContain('姓名')
    expect(container.textContent).toContain('{{payload.name}}')
    expect(container.textContent).toContain('行 ID')
  })
})

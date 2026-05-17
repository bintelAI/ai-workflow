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

vi.mock('../configs/MulQueryBindingModal', async () => {
  const React = await import('react')
  return {
    default: ({ open, onSave }: any) =>
      open
        ? React.createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                onSave({
                  projectId: 'project_1',
                  projectName: '目标项目',
                  sheetId: 'sheet_1',
                  sheetName: '目标表',
                  filterMatchType: 'and',
                  filters: [
                    {
                      id: 'filter_1',
                      columnId: 'name',
                      columnLabel: '姓名',
                      columnType: 'text',
                      operator: 'contains',
                      value: '{{payload.status}}',
                    },
                  ],
                }),
            },
            '保存查询绑定测试'
          )
        : null,
  }
})

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

  it('renders update row binding before target project id', async () => {
    await act(async () => {
      root.render(
        <MulTableOperationConfig
          nodeType={WorkflowNodeType.MUL_UPDATE_ROW}
          config={{
            targetProjectId: 'project_1',
            sheetId: 'sheet_1',
            rowIdTemplate: '',
            fieldMappingsJson: '{}',
          }}
          onConfigChange={vi.fn()}
        />
      )
    })

    const content = container.textContent || ''
    const titleIndex = content.indexOf('修改项目表行')
    const bindingIndex = content.indexOf('绑定字段')
    const targetProjectIndex = content.indexOf('目标项目 ID')

    expect(titleIndex).toBeGreaterThanOrEqual(0)
    expect(bindingIndex).toBeGreaterThan(titleIndex)
    expect(targetProjectIndex).toBeGreaterThan(bindingIndex)
  })

  it('renders structured query binding summary and keeps advanced filters json', async () => {
    await act(async () => {
      root.render(
        <MulTableOperationConfig
          nodeType={WorkflowNodeType.MUL_QUERY}
          config={{
            targetProjectId: 'project_1',
            sheetId: 'sheet_1',
            filtersJson: '[{"columnId":"status","operator":"equals","value":"{{payload.status}}"}]',
            filterMatchType: 'and',
            queryBinding: {
              projectId: 'project_1',
              projectName: '目标项目',
              sheetId: 'sheet_1',
              sheetName: '目标表',
              filterMatchType: 'and',
              filters: [
                {
                  id: 'filter_1',
                  columnId: 'status',
                  columnLabel: '状态',
                  operator: 'equals',
                  value: '{{payload.status}}',
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

    expect(container.textContent).toContain('查询绑定')
    expect(container.textContent).toContain('打开绑定')
    expect(container.textContent).toContain('目标项目')
    expect(container.textContent).toContain('目标表')
    expect(container.textContent).toContain('筛选 1 条')
    expect(container.textContent).toContain('高级配置')
    expect(container.textContent).toContain('过滤条件 JSON')
  })

  it('saves query binding as target and filters config patch', async () => {
    const onConfigPatch = vi.fn()

    await act(async () => {
      root.render(
        <MulTableOperationConfig
          nodeType={WorkflowNodeType.MUL_QUERY}
          config={{
            targetProjectId: '',
            sheetId: '',
            filtersJson: '[]',
            filterMatchType: 'and',
            returnMode: 'list',
            maxRows: 20,
          }}
          onConfigChange={vi.fn()}
          onConfigPatch={onConfigPatch}
          teamId="team_1"
          projectId="project_current"
        />
      )
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('打开绑定'))?.click()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('保存查询绑定测试'))?.click()
    })

    expect(onConfigPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        targetProjectId: 'project_1',
        sheetId: 'sheet_1',
        filterMatchType: 'and',
        queryBinding: expect.objectContaining({
          projectId: 'project_1',
          sheetId: 'sheet_1',
          filters: [
            expect.objectContaining({
              columnId: 'name',
              value: '{{payload.status}}',
            }),
          ],
        }),
      })
    )
    expect(JSON.parse(onConfigPatch.mock.calls[0][0].filtersJson)).toEqual([
      expect.objectContaining({ columnId: 'name', value: '{{payload.status}}' }),
    ])
  })
})

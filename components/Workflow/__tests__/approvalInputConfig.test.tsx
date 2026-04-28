import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { ApprovalConfig } from '../configs/ApprovalConfig'
import StartConfig from '../configs/StartConfig'
import { filterApprovalMulSheets } from '../configs/ApprovalTableInputModal'

const { useWorkflowStoreMock, mulApiMock } = vi.hoisted(() => ({
  useWorkflowStoreMock: vi.fn(),
  mulApiMock: {
    getProjectSheets: vi.fn(),
    getSheetColumns: vi.fn(),
  },
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: useWorkflowStoreMock,
}))

vi.mock('@ai-flow-src/api/mul', () => ({
  mulApi: mulApiMock,
}))

vi.mock('@ai-flow-src/api/org', () => ({
  orgApi: {
    getTeamDepartments: vi.fn(),
    getProjectMembers: vi.fn(),
    getProjectRoles: vi.fn(),
  },
}))

vi.mock('@ai-flow/utils/runtime', () => ({
  getRuntimeTeamId: vi.fn(() => 'team_1'),
  getRuntimeProjectId: vi.fn(() => 'project_current'),
}))

describe('Approval input config', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.clearAllMocks()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    Object.defineProperty(window, 'getComputedStyle', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        getPropertyValue: () => '',
      })),
    })
    useWorkflowStoreMock.mockReturnValue({ nodes: [] })
    mulApiMock.getProjectSheets.mockResolvedValue([
      { sheetId: 'sheet_1', name: '费用表' },
      { sheetId: 'doc_1', name: '制度文档', type: 'document' },
      { sheetId: 'report_1', name: '费用报表', type: 'report' },
    ])
    mulApiMock.getSheetColumns.mockResolvedValue([
      { fieldId: 'amount', label: '金额', type: 'number', required: true },
    ])
  })

  it('loads sheets only from current approval project when adding table input', async () => {
    await act(async () => {
      root.render(
        <StartConfig
          config={{}}
          onConfigChange={vi.fn()}
          pluginType="approval"
          teamId="team_1"
          projectId="project_current"
        />
      )
    })

    const addButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === '添加表数据'
    ) as HTMLButtonElement

    await act(async () => {
      addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })
    expect(mulApiMock.getProjectSheets).toHaveBeenCalledWith('project_current')
    expect(document.body.textContent).toContain('审批工作流只能选择当前所属项目的数据表')
    expect(document.body.textContent).toContain('project_current')
  })

  it('filters approval table inputs to mul sheet resources only', () => {
    expect(
      filterApprovalMulSheets([
        { sheetId: 'sheet_1', name: '费用表', type: 'sheet' },
        { sheetId: 'legacy_sheet', name: '历史表' },
        { sheetId: 'doc_1', name: '制度文档', type: 'document' },
        { sheetId: 'report_1', name: '费用报表', type: 'report' },
      ] as any)
    ).toEqual([
      { sheetId: 'sheet_1', name: '费用表', type: 'sheet' },
      { sheetId: 'legacy_sheet', name: '历史表' },
    ])
  })

  it('uses start node approval input fields for approval field permissions', async () => {
    useWorkflowStoreMock.mockReturnValue({
      nodes: [
        {
          id: 'start_1',
          type: 'start',
          data: {
            config: {
              approvalInputConfig: {
                sourceType: 'mul_table',
                projectId: 'project_current',
                sheetId: 'sheet_1',
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
              },
            },
          },
        },
      ],
    })

    await act(async () => {
      root.render(<ApprovalConfig config={{}} onConfigChange={vi.fn()} />)
    })

    const fieldsTab = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === '字段配置'
    ) as HTMLButtonElement

    await act(async () => {
      fieldsTab.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(container.textContent).toContain('金额')
    expect(container.textContent).not.toContain('订单ID')
    expect(
      container.querySelector<HTMLInputElement>('input[name="field-amount"][value="readonly"]')
        ?.checked
    ).toBe(true)
  })
})

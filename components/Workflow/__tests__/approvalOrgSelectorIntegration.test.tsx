import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { ApprovalConfig } from '../configs/ApprovalConfig'
import { CCConfig } from '../configs/CCConfig'

const orgApiMock = {
  getTeamDepartments: vi.fn(),
  getProjectMembers: vi.fn(),
}

const runtimeMock = {
  getRuntimeTeamId: vi.fn(() => 'team_1'),
  getRuntimeProjectId: vi.fn(() => 'project_1'),
}

const selectorSpy = vi.fn()

vi.mock('@/src/api/org', () => ({
  orgApi: orgApiMock,
}))

vi.mock('@ai-flow/utils/runtime', () => runtimeMock)

vi.mock('../configs/common/OrgTargetSelector', () => ({
  default: (props: any) => {
    selectorSpy(props)
    return null
  },
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: vi.fn(() => ({
    nodes: [
      {
        id: 'start_1',
        type: 'start',
        data: {
          config: {
            devInput: JSON.stringify({ requester: { id: 'u1', name: '发起人' } }),
          },
        },
      },
    ],
  })),
}))

const departments = [
  {
    id: 'dept_1',
    name: '研发部',
    children: [],
  },
]

const members = [
  {
    id: 'user_1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 1,
    avatar: '',
    departmentId: 'dept_1',
  },
]

describe('Approval / CC org selector integration', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.innerHTML = ''
    document.body.appendChild(container)
    root = createRoot(container)
    selectorSpy.mockClear()
    orgApiMock.getTeamDepartments.mockReset()
    orgApiMock.getProjectMembers.mockReset()
    runtimeMock.getRuntimeTeamId.mockReturnValue('team_1')
    runtimeMock.getRuntimeProjectId.mockReturnValue('project_1')
    orgApiMock.getTeamDepartments.mockResolvedValue(departments)
    orgApiMock.getProjectMembers.mockResolvedValue(members)
  })

  it('loads team departments and project members for approval selector and syncs both user/department names', async () => {
    const onConfigChange = vi.fn()

    await act(async () => {
      root.render(<ApprovalConfig config={{}} onConfigChange={onConfigChange} />)
    })

    const openButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === '选择'
    ) as HTMLButtonElement

    await act(async () => {
      openButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(orgApiMock.getTeamDepartments).toHaveBeenCalledWith('team_1')
    expect(orgApiMock.getProjectMembers).toHaveBeenCalledWith('team_1', 'project_1')

    const lastSelectorProps = selectorSpy.mock.calls.at(-1)?.[0]
    expect(lastSelectorProps.departments).toEqual(departments)
    expect(lastSelectorProps.members).toEqual(members)

    await act(async () => {
      lastSelectorProps.onConfirm({
        users: [{ id: 'user_1', name: '张三', departmentId: 'dept_1' }],
        departments: [{ id: 'dept_1', name: '研发部' }],
      })
    })

    expect(onConfigChange).toHaveBeenCalledWith('participantRules', [
      {
        sourceType: 'user',
        sourceValue: 'user_1',
        sourceName: '张三',
        sourceLabel: '张三',
      },
      {
        sourceType: 'department',
        sourceValue: 'dept_1',
        sourceName: '研发部',
        sourceLabel: '研发部',
      },
    ])
    expect(onConfigChange).toHaveBeenCalledWith('approver', '张三, 研发部')
  })

  it('loads team departments and project members for cc selector and syncs structured recipients', async () => {
    const onConfigChange = vi.fn()

    await act(async () => {
      root.render(<CCConfig config={{}} onConfigChange={onConfigChange} />)
    })

    const openButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === '选择'
    ) as HTMLButtonElement

    await act(async () => {
      openButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(orgApiMock.getTeamDepartments).toHaveBeenCalledWith('team_1')
    expect(orgApiMock.getProjectMembers).toHaveBeenCalledWith('team_1', 'project_1')

    const lastSelectorProps = selectorSpy.mock.calls.at(-1)?.[0]
    expect(lastSelectorProps.departments).toEqual(departments)
    expect(lastSelectorProps.members).toEqual(members)

    await act(async () => {
      lastSelectorProps.onConfirm({
        users: [{ id: 'user_1', name: '张三', departmentId: 'dept_1' }],
        departments: [{ id: 'dept_1', name: '研发部' }],
      })
    })

    expect(onConfigChange).toHaveBeenCalledWith('recipientUsers', [
      { id: 'user_1', name: '张三', departmentId: 'dept_1' },
    ])
    expect(onConfigChange).toHaveBeenCalledWith('recipientDepartments', [
      { id: 'dept_1', name: '研发部' },
    ])
    expect(onConfigChange).toHaveBeenCalledWith('recipients', '张三, 研发部')
    expect(onConfigChange).toHaveBeenCalledWith('recipient', '张三, 研发部')
  })
})

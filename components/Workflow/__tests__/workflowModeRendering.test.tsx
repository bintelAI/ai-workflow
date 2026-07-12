import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { WorkflowApp } from '../WorkflowApp'
import { useWorkflowStore } from '../store/useWorkflowStore'
import { WorkflowNodeType } from '../types'

vi.mock('reactflow', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../index', () => ({
  WorkflowCanvas: () => <div data-testid="workflow-canvas" />,
  Sidebar: () => <div data-testid="workflow-sidebar" />,
  ConfigPanel: () => <div data-testid="workflow-config-panel" />,
  DataDrawer: () => <div data-testid="workflow-data-drawer" />,
  AICommandCenter: () => <div data-testid="workflow-ai-command" />,
  SettingsModal: () => <div data-testid="workflow-settings-modal" />,
}))

vi.mock('../GlobalConfigModal', () => ({
  default: () => <div data-testid="workflow-global-config-modal" />,
}))

vi.mock('../ValidationReportModal', () => ({
  default: () => null,
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: vi.fn(),
}))

vi.mock('@ai-flow/src/api/flow/infoHistory', () => ({
  flowInfoHistoryApi: {
    historyList: vi.fn().mockResolvedValue({ code: 1000, data: { list: [] } }),
    rollback: vi.fn().mockResolvedValue({ code: 1000 }),
    compare: vi.fn().mockResolvedValue({ code: 1000, data: {} }),
  },
}))

const createStoreMock = (overrides: Record<string, any> = {}) => ({
  validateWorkflow: vi.fn(),
  toggleDrawer: vi.fn(),
  runSimulation: vi.fn(),
  toggleSettings: vi.fn(),
  toggleGlobalConfig: vi.fn(),
  categories: [
    { id: 'general', name: '全功能模式' },
    { id: 'ai_agent', name: 'AI Agent 编排' },
    { id: 'business_approval', name: '行政审批流 (BPM)' },
    { id: 'automation', name: '自动化工作流' },
  ],
  activeCategoryId: 'general',
  nodes: [],
  edges: [],
  setWorkflow: vi.fn(),
  updateCategory: vi.fn(),
  setActiveCategory: vi.fn(),
  saveFlow: vi.fn().mockResolvedValue(undefined),
  releaseFlow: vi.fn().mockResolvedValue(undefined),
  runFlow: vi.fn().mockResolvedValue(undefined),
  stopExecution: vi.fn(),
  isExecuting: false,
  isFlowSaving: false,
  flowInfo: {
    id: 11,
    name: '测试流程',
    label: 'test_flow',
  },
  teamId: 'team_1',
  setTeamId: vi.fn(),
  ...overrides,
})

const expectProjectTableNodesEnabled = (
  updateCategory: ReturnType<typeof vi.fn>,
  categoryId: string
) => {
  expect(updateCategory).toHaveBeenCalledWith(
    categoryId,
    expect.objectContaining({
      allowedNodeTypes: expect.arrayContaining([
        WorkflowNodeType.MUL_QUERY,
        WorkflowNodeType.MUL_UPDATE_ROW,
        WorkflowNodeType.MUL_DELETE_ROW,
      ]),
    })
  )
}

describe('WorkflowApp mode rendering', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    const storage = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, String(value))
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key)
        }),
        clear: vi.fn(() => {
          storage.clear()
        }),
      },
    })
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
    vi.clearAllMocks()
    container = document.createElement('div')
    document.body.innerHTML = ''
    document.body.appendChild(container)
    root = createRoot(container)

    vi.mocked(useWorkflowStore).mockReturnValue(createStoreMock() as any)
  })

  it('renders AI mode with AI command center and AI-oriented title', async () => {
    const updateCategory = vi.fn()
    const setActiveCategory = vi.fn()
    vi.mocked(useWorkflowStore).mockReturnValue(createStoreMock({
      updateCategory,
      setActiveCategory,
    }) as any)

    await act(async () => {
      root.render(<WorkflowApp embedded mode="dev" pluginType="ai" />)
    })

    expect(container.textContent).toContain('AI 工作流')
    expect(container.textContent).toContain('AI 模式')
    expect(container.querySelector('[data-testid="workflow-ai-command"]')).toBeTruthy()
    expect(setActiveCategory).toHaveBeenCalledWith('ai_agent')
    expectProjectTableNodesEnabled(updateCategory, 'ai_agent')
  })

  it('renders approval mode without AI command center and with approval title', async () => {
    const updateCategory = vi.fn()
    const setActiveCategory = vi.fn()
    vi.mocked(useWorkflowStore).mockReturnValue(createStoreMock({
      validateWorkflow: vi.fn(),
      toggleDrawer: vi.fn(),
      runSimulation: vi.fn(),
      toggleSettings: vi.fn(),
      toggleGlobalConfig: vi.fn(),
      categories: [
        { id: 'business_approval', name: '行政审批流 (BPM)', allowedNodeTypes: [] },
      ],
      activeCategoryId: 'general',
      nodes: [],
      edges: [],
      setWorkflow: vi.fn(),
      updateCategory,
      setActiveCategory,
      saveFlow: vi.fn().mockResolvedValue(undefined),
      releaseFlow: vi.fn().mockResolvedValue(undefined),
      runFlow: vi.fn().mockResolvedValue(undefined),
      stopExecution: vi.fn(),
      isExecuting: false,
      isFlowSaving: false,
      flowInfo: { id: 11, name: '测试流程', label: 'test_flow' },
      teamId: 'team_1',
      setTeamId: vi.fn(),
    }) as any)

    await act(async () => {
      root.render(<WorkflowApp embedded mode="dev" pluginType="approval" />)
    })

    expect(container.textContent).toContain('审批工作流')
    expect(container.textContent).toContain('审批配置')
    expect(container.textContent).toContain('查看审批数据')
    expect(container.querySelector('[data-testid="workflow-ai-command"]')).toBeFalsy()
    expect(setActiveCategory).toHaveBeenCalledWith('business_approval')
    expectProjectTableNodesEnabled(updateCategory, 'business_approval')
  })

  it('renders automation mode with automation title and without AI command center', async () => {
    const updateCategory = vi.fn()
    const setActiveCategory = vi.fn()
    vi.mocked(useWorkflowStore).mockReturnValue(createStoreMock({
      updateCategory,
      setActiveCategory,
    }) as any)

    await act(async () => {
      root.render(<WorkflowApp embedded mode="dev" pluginType="automation" />)
    })

    expect(container.textContent).toContain('自动化工作流')
    expect(container.textContent).toContain('Automation')
    expect(container.querySelector('[data-testid="workflow-ai-command"]')).toBeFalsy()
    expect(setActiveCategory).toHaveBeenCalledWith('automation')
    expectProjectTableNodesEnabled(updateCategory, 'automation')
  })

  it('keeps project table nodes when host provides an allowed node whitelist', async () => {
    const updateCategory = vi.fn()
    vi.mocked(useWorkflowStore).mockReturnValue(createStoreMock({
      updateCategory,
    }) as any)

    await act(async () => {
      root.render(
        <WorkflowApp
          embedded
          mode="dev"
          pluginType="approval"
          allowedNodeTypes={[WorkflowNodeType.START, WorkflowNodeType.END, WorkflowNodeType.SQL]}
        />
      )
    })

    const categoryPatch = updateCategory.mock.calls.find(([categoryId]) => categoryId === 'business_approval')?.[1]
    expect(categoryPatch.allowedNodeTypes).not.toContain(WorkflowNodeType.SQL)
    expect(updateCategory).toHaveBeenCalledWith(
      'business_approval',
      expect.objectContaining({
        allowedNodeTypes: expect.arrayContaining([
          WorkflowNodeType.START,
          WorkflowNodeType.END,
          WorkflowNodeType.MUL_QUERY,
          WorkflowNodeType.MUL_UPDATE_ROW,
          WorkflowNodeType.MUL_DELETE_ROW,
        ]),
      })
    )
  })

  it('renders all mode with project table nodes enabled', async () => {
    const updateCategory = vi.fn()
    const setActiveCategory = vi.fn()
    vi.mocked(useWorkflowStore).mockReturnValue(createStoreMock({
      updateCategory,
      setActiveCategory,
    }) as any)

    await act(async () => {
      root.render(<WorkflowApp embedded mode="dev" pluginType="all" />)
    })

    expect(container.textContent).toContain('维表智联工作流')
    expect(setActiveCategory).toHaveBeenCalledWith('general')
    expectProjectTableNodesEnabled(updateCategory, 'general')
  })
})

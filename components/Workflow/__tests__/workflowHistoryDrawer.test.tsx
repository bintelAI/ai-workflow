import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { WorkflowApp } from '../WorkflowApp'
import { useWorkflowStore } from '../store/useWorkflowStore'

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
    historyList: vi.fn().mockResolvedValue({
      code: 1000,
      data: {
        list: [
          {
            id: 101,
            version: '1.0.0',
            remark: '版本 1.0.0 发布',
            operatorName: 'tester',
            createTime: '2026-04-16T10:00:00.000Z',
            releaseTime: '2026-04-16T10:00:00.000Z',
          },
        ],
      },
    }),
    rollback: vi.fn().mockResolvedValue({ code: 1000 }),
    compare: vi.fn().mockResolvedValue({
      code: 1000,
      data: {
        version1: { version: '1.0.0', data: {} },
        version2: { version: '2.0.0', data: {} },
      },
    }),
  },
}))

describe('WorkflowApp history drawer', () => {
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

    vi.mocked(useWorkflowStore).mockReturnValue({
      validateWorkflow: vi.fn(),
      toggleDrawer: vi.fn(),
      runSimulation: vi.fn(),
      toggleSettings: vi.fn(),
      toggleGlobalConfig: vi.fn(),
      categories: [{ id: 'general', name: '通用流程' }],
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
      flowSchemaVersion: 2,
      flowInfo: {
        id: 3,
        name: '测试流程',
        version: '2.0.0',
        status: 1,
        releaseTime: '2026-04-16T12:00:00.000Z',
      },
      teamId: 'T100',
      setTeamId: vi.fn(),
    } as any)
  })

  it('renders history button and opens history drawer', async () => {
    await act(async () => {
      root.render(<WorkflowApp embedded mode="dev" />)
    })

    const historyButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('历史')
    )

    expect(historyButton).toBeTruthy()

    await act(async () => {
      historyButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(document.body.textContent).toContain('工作流历史')
    expect(document.body.textContent).toContain('当前版本')
    expect(document.body.textContent).toContain('版本 1.0.0 发布')
  })
})

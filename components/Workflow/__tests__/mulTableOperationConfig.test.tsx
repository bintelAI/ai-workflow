import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MulTableOperationConfig from '../configs/MulTableOperationConfig'
import { WorkflowNodeType } from '../types'

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

    expect(container.querySelectorAll('button[title="插入变量"]').length).toBeGreaterThanOrEqual(4)
  })
})

import React, { useState } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LLMConfig from '../configs/LLMConfig'

const getModels = vi.fn()
const getByNode = vi.fn()

vi.mock('@ai-flow/src/api/flow', () => ({
  flowConfigApi: {
    getModels: (...args: any[]) => getModels(...args),
    getByNode: (...args: any[]) => getByNode(...args),
  },
}))

vi.mock('../store/useWorkflowStore', () => ({
  useWorkflowStore: (selector?: (state: any) => any) => {
    const state = {
      teamId: 'team_1',
      selectedNodeId: 'llm_1',
      nodes: [
        {
          id: 'start_1',
          type: 'start',
          data: { config: { variables: [] } },
        },
        {
          id: 'llm_1',
          type: 'llm',
          data: { config: {} },
        },
      ],
      edges: [{ id: 'e1', source: 'start_1', target: 'llm_1' }],
      globalVariables: [],
    }
    return selector ? selector(state) : state
  },
}))

describe('LLMConfig', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.clearAllMocks()
    getModels.mockResolvedValue({
      data: [
        {
          id: 0,
          name: 'new-api 模型网关',
          type: 'new-api',
          options: {
            options: [
              {
                field: 'model',
                select: ['gpt-4', 'deepseek-chat'],
              },
            ],
            comm: {
              provider: 'new-api',
            },
          },
        },
      ],
    })
    getByNode.mockResolvedValue({ data: [] })
  })

  it('does not repeatedly sync empty option metadata for new-api models', async () => {
    const updates: Array<[string, any]> = []

    const Wrapper = () => {
      const [config, setConfig] = useState<any>({
        model: 'gpt-4',
        temperature: 0.7,
      })

      const handleConfigChange = (key: string, value: any) => {
        updates.push([key, value])
        setConfig((current: any) => ({
          ...current,
          [key]: value,
        }))
      }

      return (
        <LLMConfig
          config={config}
          onConfigChange={handleConfigChange}
        />
      )
    }

    await act(async () => {
      root.render(<Wrapper />)
    })

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    const optionUpdates = updates.filter(([key]) => key === 'options')

    expect(optionUpdates).toHaveLength(0)
    expect(updates.filter(([key]) => key === 'configId')).toHaveLength(1)
    expect(updates.filter(([key]) => key === 'supplier')).toHaveLength(1)
    expect(updates.filter(([key]) => key === 'supplierName')).toHaveLength(1)
    expect(updates.filter(([key]) => key === 'comm')).toHaveLength(1)
  })
})

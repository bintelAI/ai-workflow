import { beforeEach, describe, expect, it } from 'vitest'
import { resolveAiFlowRuntime, setAiFlowRuntime } from '@ai-flow/utils/runtime'

describe('ai-flow runtime query alias', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, String(value)),
      },
    })
    window.history.replaceState({}, '', '/')
    setAiFlowRuntime({
      id: undefined,
      teamId: undefined,
      projectId: undefined,
      token: undefined,
      baseURL: undefined,
      type: undefined,
    })
  })

  it('resolves workflowId from query string as runtime id', () => {
    window.history.replaceState({}, '', '/?workflowId=123&teamId=T100')

    const runtime = resolveAiFlowRuntime()

    expect(runtime.id).toBe('123')
    expect(runtime.teamId).toBe('T100')
  })
})

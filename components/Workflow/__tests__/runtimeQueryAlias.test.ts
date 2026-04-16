import { beforeEach, describe, expect, it } from 'vitest'
import { resolveAiFlowRuntime, setAiFlowRuntime } from '@ai-flow/utils/runtime'

describe('ai-flow runtime query alias', () => {
  beforeEach(() => {
    window.localStorage.clear()
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

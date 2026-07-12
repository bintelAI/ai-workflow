import { beforeEach, describe, expect, it, vi } from 'vitest'

const { completionsMock } = vi.hoisted(() => ({
  completionsMock: vi.fn(),
}))

vi.mock('@/src/api/flow/chat', () => ({
  flowChatApi: {
    completions: completionsMock,
  },
}))

vi.mock('@ai-flow/utils/runtime', () => ({
  getRuntimeTeamId: vi.fn(() => 'team-1'),
}))

import { createAIActions } from '../store/modules/aiActions'

describe('AI workflow actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    completionsMock.mockResolvedValue({ data: { choices: [] } })
  })

  it('calls the current flow chat API with payload first and team id second', async () => {
    const actions = createAIActions(vi.fn(), vi.fn())

    await actions.generateWorkflowFromPrompt('生成一个费用审批流')

    expect(completionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: '生成一个费用审批流' }),
        ]),
      }),
      'team-1'
    )
  })
})

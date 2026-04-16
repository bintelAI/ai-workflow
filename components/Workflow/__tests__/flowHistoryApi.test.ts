import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flowInfoHistoryApi } from '@/src/api/flow/infoHistory'

vi.mock('@ai-flow/utils/runtime', () => ({
  getRuntimeTeamId: vi.fn(() => 'team-1'),
  getRuntimeBaseURL: vi.fn(() => '/api'),
  getRuntimeProjectId: vi.fn(() => 'project-1'),
  getRuntimeToken: vi.fn(() => 'token'),
}))

vi.mock('@/src/api/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import request from '@/src/api/request'

describe('flowInfoHistoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses app historyList endpoint instead of admin endpoint', async () => {
    ;(request.get as any).mockResolvedValue({ data: { list: [] } })

    await flowInfoHistoryApi.historyList('team-1', 3)

    expect(request.get).toHaveBeenCalledWith('/app/flow/team-1/infoHistory/historyList', {
      params: { flowId: 3 },
    })
  })
})

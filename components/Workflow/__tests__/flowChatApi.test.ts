import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/src/api/request', () => ({
  default: {
    post: vi.fn(),
  },
}));

import request from '@/src/api/request';
import { flowChatApi } from '@/src/api/flow/chat';

describe('flowChatApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (request.post as any).mockResolvedValue({ data: { choices: [] } });
  });

  it('使用团队 chat/completions 接口', async () => {
    await flowChatApi.completions({
      messages: [{ role: 'user', content: '生成工作流' }],
      model: 'team-default',
      response_format: { type: 'json_object' },
    }, 'team-1');

    expect(request.post).toHaveBeenCalledWith(
      '/app/flow/team-1/v1/chat/completions',
      expect.objectContaining({
        model: 'team-default',
        messages: [{ role: 'user', content: '生成工作流' }],
        response_format: { type: 'json_object' },
      })
    );
  });
});

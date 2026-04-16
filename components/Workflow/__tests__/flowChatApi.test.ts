import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/request', () => ({
  default: vi.fn(),
}));

import request from '@/utils/request';
import { flowChatApi } from '@/api/flowChat';

describe('flowChatApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (request as any).mockResolvedValue({ data: { choices: [] } });
  });

  it('使用团队 chat/completions 接口', async () => {
    await flowChatApi.completions('team-1', {
      messages: [{ role: 'user', content: '生成工作流' }],
      model: 'team-default',
      response_format: { type: 'json_object' },
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/app/flow/team-1/v1/chat/completions',
        method: 'POST',
        model: 'team-default',
        messages: [{ role: 'user', content: '生成工作流' }],
        response_format: { type: 'json_object' },
      })
    );
  });
});

import { describe, expect, it, vi } from 'vitest';
import request from '../request';
import { flowConfigApi } from './config';

vi.mock('../request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('flowConfigApi', () => {
  beforeEach(() => {
    vi.mocked(request.get).mockReset();
  });

  it('loads llm model options from new-api visible models', async () => {
    vi.mocked(request.get).mockResolvedValue({
      data: [
        { id: 'qwen-plus' },
        { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      ],
    } as any);

    const result = await flowConfigApi.getModels('team_1');

    expect(request.get).toHaveBeenCalledWith('/app/new-api/team_1/models', {
      params: {
        capability: 'chat',
        modelScope: 'platform_default',
      },
    });
    expect(result.data).toEqual([
      {
        id: 0,
        name: 'new-api 模型网关',
        type: 'new-api',
        options: {
          options: [
            {
              field: 'model',
              select: ['qwen-plus', 'deepseek-chat'],
            },
          ],
          comm: {
            provider: 'new-api',
          },
        },
      },
    ]);
  });
});

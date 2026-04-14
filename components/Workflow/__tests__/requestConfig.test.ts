import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosCreate = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: axiosCreate,
  },
}));

vi.mock('@ai-flow/components/common/AntdStaticFunction', () => ({
  message: {
    error: vi.fn(),
  },
}));

vi.mock('@ai-flow/utils/runtime', () => ({
  getRuntimeBaseURL: vi.fn(() => '/api'),
  getRuntimeProjectId: vi.fn(() => 'project-1'),
  getRuntimeToken: vi.fn(() => 'token'),
}));

const createAxiosInstanceMock = () => ({
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
});

describe('ai-flow request 默认配置', () => {
  beforeEach(() => {
    vi.resetModules();
    axiosCreate.mockReset();
    axiosCreate.mockReturnValue(createAxiosInstanceMock());
  });

  it('不应为工作流请求实例设置默认超时时间', async () => {
    await import('@/src/api/request');

    expect(axiosCreate).toHaveBeenCalledTimes(1);
    expect(axiosCreate.mock.calls[0][0]?.timeout).toBeUndefined();
  });
});

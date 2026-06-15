import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flowInfoApi } from '@/src/api/flow/info';
import { flowRunApi, runFlowWithSSE } from '@/src/api/flow/run';
import { flowConfigApi } from '@/src/api/flow/config';

vi.mock('@ai-flow/utils/runtime', () => ({
  getRuntimeTeamId: vi.fn(() => 'team-1'),
  getRuntimeBaseURL: vi.fn(() => '/api'),
  getRuntimeProjectId: vi.fn(() => 'project-1'),
  getRuntimeToken: vi.fn(() => 'token'),
}));

vi.mock('@/src/api/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

import request from '@/src/api/request';

describe('Flow API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('flowInfoApi', () => {
    it('should call page API with correct params (mocked disabled)', async () => {
      const mockResponse = {
        data: {
          list: [],
          pagination: { page: 1, size: 20, total: 0 }
        }
      };

      (request.post as any).mockResolvedValue(mockResponse);
      const result = await flowInfoApi.page('team-1', { page: 1, size: 20 });
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/team-1/info/page', { page: 1, size: 20 });
      expect(result).toEqual(mockResponse);
    });

    it('should call info API with correct id', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test Flow' }
      };
      (request.get as any).mockResolvedValue(mockResponse);

      const result = await flowInfoApi.info('team-1', 1);
      
      expect(request.get).toHaveBeenCalledWith('/app/flow/team-1/info/info', { params: { id: 1 } });
      expect(result).toEqual(mockResponse);
    });

    it('should call add API with correct data', async () => {
      const mockData = { name: 'New Flow', label: 'new_flow' };
      const mockResponse = { data: { id: 1, ...mockData } };
      (request.post as any).mockResolvedValue(mockResponse);

      const result = await flowInfoApi.add('team-1', mockData);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/team-1/info/add', mockData);
      expect(result).toEqual(mockResponse);
    });

    it('should call update API with correct data', async () => {
      const mockData = { id: 1, name: 'Updated Flow' };
      const mockResponse = { data: mockData };
      (request.post as any).mockResolvedValue(mockResponse);

      const result = await flowInfoApi.update('team-1', mockData);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/team-1/info/update', mockData);
      expect(result).toEqual(mockResponse);
    });

    it('should call delete API with correct id', async () => {
      (request.post as any).mockResolvedValue({});

      await flowInfoApi.delete('team-1', 1);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/team-1/info/delete', { id: 1 });
    });

    it('should call release API with correct flowId', async () => {
      (request.post as any).mockResolvedValue({});

      await flowInfoApi.release('team-1', 1);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/team-1/info/release', { flowId: 1 });
    });
  });

  describe('flowRunApi', () => {
    it('should call debug API with correct params', async () => {
      const mockParams = { label: 'test_flow', params: { input: 'hello' } };
      (request.post as any).mockResolvedValue({});

      await flowRunApi.debug(mockParams);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/team-1/run/debug', mockParams);
    });

    it('should call invoke API with correct params', async () => {
      const mockParams = { label: 'test_flow', params: { input: 'hello' } };
      (request.post as any).mockResolvedValue({ data: { result: 'success' } });

      await flowRunApi.invoke(mockParams);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/team-1/run/invoke', mockParams);
    });

    it('should normalize object node errors from SSE to message string', async () => {
      const encoder = new TextEncoder();
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode([
            'data:{"msgType":"node","data":{"status":"done","nodeId":"script_1","nodeType":"code","result":{"success":false,"error":{"nodeId":"script_1","message":"Code execution error"}}}}',
            '',
          ].join('\n')));
          controller.close();
        },
      });
      const fetchMock = vi.fn().mockResolvedValue(new Response(body, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }));
      vi.stubGlobal('fetch', fetchMock);
      const onNodeError = vi.fn();

      runFlowWithSSE(
        { label: 'test_flow', teamId: 'team-1' },
        { onNodeError }
      );

      await vi.waitFor(() => {
        expect(onNodeError).toHaveBeenCalledWith('script_1', 'code', 'Code execution error');
      });
    });
  });

  describe('flowConfigApi', () => {
    it('should call all API', async () => {
      const mockResponse = { data: { model: { options: [] } } };
      (request.get as any).mockResolvedValue(mockResponse);

      const result = await flowConfigApi.all(1 as any);

      expect(request.get).toHaveBeenCalledWith('/app/flow/1/config/all');
      expect(result).toEqual(mockResponse);
    });

    it('should call getByNode API with correct node type', async () => {
      const mockResponse = { data: { options: [] } };
      (request.get as any).mockResolvedValue(mockResponse);

      const result = await flowConfigApi.getByNode(undefined as any, 'llm');

      expect(request.get).toHaveBeenCalledWith('/app/flow/undefined/config/getByNode', { params: { node: 'llm', type: undefined } });
      expect(result).toEqual(mockResponse);
    });

    it('should load llm models from new-api visible models', async () => {
      (request.get as any).mockResolvedValue({
        data: [
          { id: 'qwen-plus' },
          { name: 'deepseek-chat' },
        ],
      });

      const result = await flowConfigApi.getModels('team_1');

      expect(request.get).toHaveBeenCalledWith('/app/new-api/team_1/models', {
        params: {
          capability: 'chat',
          modelScope: 'platform_default',
        },
      });
      expect(result.data[0].options.options[0].select).toEqual(['qwen-plus', 'deepseek-chat']);
    });

    it('should call config API with correct params', async () => {
      const mockResponse = { data: { options: [] } };
      (request.post as any).mockResolvedValue(mockResponse);

      const result = await flowConfigApi.config(1 as any, 'llm', 'chat');

      expect(request.post).toHaveBeenCalledWith('/app/flow/1/config/config', { node: 'llm', type: 'chat' });
      expect(result).toEqual(mockResponse);
    });
  });
});

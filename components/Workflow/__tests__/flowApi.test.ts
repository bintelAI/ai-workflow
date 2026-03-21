import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flowInfoApi } from '@/src/api/flow/info';
import { flowRunApi } from '@/src/api/flow/run';
import { flowConfigApi } from '@/src/api/flow/config';

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
  });

  describe('flowInfoApi', () => {
    it('should call page API with correct params', async () => {
      const mockResponse = {
        data: {
          list: [],
          pagination: { page: 1, size: 20, total: 0 }
        }
      };
      (request.post as any).mockResolvedValue(mockResponse);

      const result = await flowInfoApi.page({ page: 1, size: 20 });
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/info/page', { page: 1, size: 20 });
      expect(result).toEqual(mockResponse);
    });

    it('should call info API with correct id', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test Flow' }
      };
      (request.get as any).mockResolvedValue(mockResponse);

      const result = await flowInfoApi.info(1);
      
      expect(request.get).toHaveBeenCalledWith('/app/flow/info/info', { params: { id: 1 } });
      expect(result).toEqual(mockResponse);
    });

    it('should call add API with correct data', async () => {
      const mockData = { name: 'New Flow', label: 'new_flow' };
      const mockResponse = { data: { id: 1, ...mockData } };
      (request.post as any).mockResolvedValue(mockResponse);

      const result = await flowInfoApi.add(mockData);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/info/add', mockData);
      expect(result).toEqual(mockResponse);
    });

    it('should call update API with correct data', async () => {
      const mockData = { id: 1, name: 'Updated Flow' };
      const mockResponse = { data: mockData };
      (request.post as any).mockResolvedValue(mockResponse);

      const result = await flowInfoApi.update(mockData);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/info/update', mockData);
      expect(result).toEqual(mockResponse);
    });

    it('should call delete API with correct id', async () => {
      (request.post as any).mockResolvedValue({});

      await flowInfoApi.delete(1);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/info/delete', { id: 1 });
    });

    it('should call release API with correct flowId', async () => {
      (request.post as any).mockResolvedValue({});

      await flowInfoApi.release(1);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/info/release', { flowId: 1 });
    });
  });

  describe('flowRunApi', () => {
    it('should call debug API with correct params', async () => {
      const mockParams = { label: 'test_flow', params: { input: 'hello' } };
      (request.post as any).mockResolvedValue({});

      await flowRunApi.debug(mockParams);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/run/debug', mockParams);
    });

    it('should call invoke API with correct params', async () => {
      const mockParams = { label: 'test_flow', params: { input: 'hello' } };
      (request.post as any).mockResolvedValue({ data: { result: 'success' } });

      await flowRunApi.invoke(mockParams);
      
      expect(request.post).toHaveBeenCalledWith('/app/flow/run/invoke', mockParams);
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

    it('should call config API with correct params', async () => {
      const mockResponse = { data: { options: [] } };
      (request.post as any).mockResolvedValue(mockResponse);

      const result = await flowConfigApi.config(1 as any, 'llm', 'chat');

      expect(request.post).toHaveBeenCalledWith('/app/flow/1/config/config', { node: 'llm', type: 'chat' });
      expect(result).toEqual(mockResponse);
    });
  });
});

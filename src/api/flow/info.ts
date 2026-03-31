import request from '../request';
import type { FlowInfoEntity, FlowDraft } from '../../types/flow';

export interface FlowPageParams {
  page: number;
  size: number;
  name?: string;
  status?: number;
  type?: number;
  flowId?: number;
  isRelease?: boolean;
  teamId?: string;
}

export interface FlowPageResponse {
  list: FlowInfoEntity[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}

export const flowInfoApi = {
  page: (params: FlowPageParams) => {
    // return request.post<any, { data: FlowPageResponse }>('/app/flow/info/page', params);
    // 接口在工作流中未实际使用，直接返回空数据以禁用此请求
    return Promise.resolve({ data: { list: [], pagination: { page: params.page || 1, size: params.size || 20, total: 0 } } });
  },

  info: (id: number, teamId?: string) => {
    return request.get<any, { data: FlowInfoEntity }>('/app/flow/info/info', { params: { id, teamId } });
  },

  add: (data: Partial<FlowInfoEntity> & { teamId?: string }) => {
    return request.post<any, { data: FlowInfoEntity }>('/app/flow/info/add', data);
  },

  update: (data: Partial<FlowInfoEntity> & { teamId?: string }) => {
    return request.post<any, { data: FlowInfoEntity }>('/app/flow/info/update', data);
  },

  delete: (id: number, teamId?: string) => {
    return request.post<any, { data: void }>('/app/flow/info/delete', { id, teamId });
  },

  release: (flowId: number, teamId?: string) => {
    return request.post<any, { data: FlowInfoEntity }>('/app/flow/info/release', { flowId, teamId });
  },

  save: (id: number, draft: FlowDraft, teamId?: string) => {
    return request.post<any, { data: FlowInfoEntity }>('/app/flow/info/update', {
      id,
      draft,
      teamId,
    });
  },
};

export default flowInfoApi;

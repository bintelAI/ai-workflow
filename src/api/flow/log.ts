import request from '../request';

export interface FlowLogEntity {
  id?: number;
  flowId?: number;
  flowName?: string;
  flowLabel?: string;
  type?: number;
  inputParams?: any;
  result?: any;
  createTime?: string;
}

export interface FlowLogPageParams {
  page: number;
  size: number;
  flowId?: number;
  type?: number;
  createTime?: [string, string];
  teamId?: number;
}

export interface FlowLogPageResponse {
  list: FlowLogEntity[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}

export const flowLogApi = {
  page: (params: FlowLogPageParams) => {
    return request.post<any, { data: FlowLogPageResponse }>('/app/flow/log/page', params);
  },

  info: (id: number, teamId?: number) => {
    return request.get<any, { data: FlowLogEntity }>('/app/flow/log/info', { params: { id, teamId } });
  },

  delete: (id: number, teamId?: number) => {
    return request.post<any, { data: void }>('/app/flow/log/delete', { id, teamId });
  },
};

export default flowLogApi;

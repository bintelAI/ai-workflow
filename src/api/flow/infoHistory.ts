import request from '../request';

export interface FlowInfoHistoryEntity {
  id?: number;
  teamId?: number;
  flowId?: number;
  name?: string;
  label?: string;
  description?: string;
  status?: number;
  version?: string;
  draft?: any;
  data?: any;
  releaseTime?: Date;
  remark?: string;
  operatorId?: number;
  operatorName?: string;
  createTime?: string;
  updateTime?: string;
}

export interface FlowInfoHistoryPageParams {
  page?: number;
  size?: number;
  flowId?: number;
}

export interface FlowInfoHistoryPageResponse {
  list: FlowInfoHistoryEntity[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}

export interface FlowCompareResult {
  history1: FlowInfoHistoryEntity;
  history2: FlowInfoHistoryEntity;
  diff: {
    nodes: any[];
    edges: any[];
  };
}

export const flowInfoHistoryApi = {
  info: (teamId: number, id: number) => {
    return request.get<any, { data: FlowInfoHistoryEntity }>(`/admin/flow/${teamId}/infoHistory/info`, { params: { id } });
  },

  page: (teamId: number, params: FlowInfoHistoryPageParams) => {
    return request.post<any, { data: FlowInfoHistoryPageResponse }>(`/admin/flow/${teamId}/infoHistory/page`, params);
  },

  historyList: (teamId: number, flowId: number) => {
    return request.get<any, { data: FlowInfoHistoryEntity[] }>(`/admin/flow/${teamId}/infoHistory/historyList`, { params: { flowId } });
  },

  rollback: (teamId: number, flowId: number, historyId: number) => {
    return request.post<any, { data: void }>(`/admin/flow/${teamId}/infoHistory/rollback`, { flowId, historyId });
  },

  compare: (teamId: number, historyId1: number, historyId2: number) => {
    return request.post<any, { data: FlowCompareResult }>(`/admin/flow/${teamId}/infoHistory/compare`, { historyId1, historyId2 });
  },
};

export default flowInfoHistoryApi;

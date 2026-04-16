import request from '../request';

export interface FlowInfoHistoryEntity {
  id?: number;
  teamId?: string;
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
  version1: FlowInfoHistoryEntity;
  version2: FlowInfoHistoryEntity;
}

export const flowInfoHistoryApi = {
  info: (teamId: string, id: number) => {
    return request.get<any, { data: FlowInfoHistoryEntity }>(`/app/flow/${teamId}/infoHistory/info`, { params: { id } });
  },

  page: (teamId: string, params: FlowInfoHistoryPageParams) => {
    return request.post<any, { data: FlowInfoHistoryPageResponse }>(`/app/flow/${teamId}/infoHistory/page`, params);
  },

  historyList: (teamId: string, flowId: number) => {
    return request.get<any, { data: FlowInfoHistoryEntity[] | { list: FlowInfoHistoryEntity[] } }>(`/app/flow/${teamId}/infoHistory/historyList`, { params: { flowId } });
  },

  rollback: (teamId: string, flowId: number, historyId: number) => {
    return request.post<any, { data: void }>(`/app/flow/${teamId}/infoHistory/rollback`, { flowId, historyId });
  },

  compare: (teamId: string, historyId1: number, historyId2: number) => {
    return request.post<any, { data: FlowCompareResult }>(`/app/flow/${teamId}/infoHistory/compare`, { historyId1, historyId2 });
  },
};

export default flowInfoHistoryApi;

import request from '../request';
import type { FlowNode } from '../../types/flow';

export interface FlowResultEntity {
  id?: number;
  requestId?: string;
  node?: FlowNode;
  nodeType?: string;
  input?: any;
  output?: any;
  duration?: number;
  createTime?: string;
}

export interface FlowResultListParams {
  requestId?: string;
  nodeType?: string;
  teamId?: number;
}

export const flowResultApi = {
  list: (params: FlowResultListParams) => {
    return request.post<any, { data: FlowResultEntity[] }>('/app/flow/result/list', params);
  },
};

export default flowResultApi;

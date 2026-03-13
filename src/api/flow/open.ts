import request from '../request';

export interface FlowOpenInvokeParams {
  params?: Record<string, any>;
  label: string;
  requestId?: string;
  sessionId?: string;
  stream?: boolean;
}

export interface FlowHistoryMsgParams {
  label: string;
  objectId: string;
}

export const flowOpenApi = {
  invoke: (data: FlowOpenInvokeParams) => {
    return request.post<any, { data: any }>('/open/flow/run/invoke', data);
  },

  historyMsg: (label: string, objectId: string) => {
    return request.post<any, { data: any }>('/open/flow/run/historyMsg', { label, objectId });
  },
};

export default flowOpenApi;

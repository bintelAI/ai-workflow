import request from '../request';
import type { FlowConfigResponse } from '../../types/flow';

export const flowConfigApi = {
  all: (teamId: number) => {
    return request.get<any, { data: FlowConfigResponse }>(`/app/flow/${teamId}/config/all`);
  },

  config: (teamId: number, node: string, type?: string) => {
    return request.post<any, { data: FlowConfigResponse }>(`/app/flow/${teamId}/config/config`, { node, type });
  },

  getByNode: (teamId: number, node: string, type?: string) => {
    return request.get<any, { data: FlowConfigResponse }>(`/app/flow/${teamId}/config/getByNode`, { params: { node, type } });
  },

  getModels: (teamId: number) => {
    return flowConfigApi.getByNode(teamId, 'llm');
  },

  getKnowledges: (teamId: number) => {
    return flowConfigApi.getByNode(teamId, 'know');
  },

  getFlows: (teamId: number) => {
    return request.get<any, { data: any[] }>(`/app/flow/${teamId}/info/list`);
  },
};

export default flowConfigApi;

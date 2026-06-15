import request from '../request';
import type { FlowConfigResponse } from '../../types/flow';

export interface NewApiModelItem {
  id?: string;
  name?: string;
  model?: string;
  capability?: string[] | string;
  [key: string]: any;
}

const getModelName = (item: NewApiModelItem) => {
  return String(item.id || item.name || item.model || '').trim();
};

const toFlowModelResponse = (models: NewApiModelItem[] = []) => {
  const select = Array.from(new Set(
    (Array.isArray(models) ? models : [])
      .map(getModelName)
      .filter(Boolean)
  ));

  return {
    data: [
      {
        id: 0,
        name: 'new-api 模型网关',
        type: 'new-api',
        options: {
          options: [
            {
              field: 'model',
              select,
            },
          ],
          comm: {
            provider: 'new-api',
          },
        },
      },
    ],
  };
};

export const flowConfigApi = {
  all: (teamId: number | string) => {
    return request.get<any, { data: FlowConfigResponse }>(`/app/flow/${teamId}/config/all`);
  },

  config: (teamId: number | string, node: string, type?: string) => {
    return request.post<any, { data: FlowConfigResponse }>(`/app/flow/${teamId}/config/config`, { node, type });
  },

  getByNode: (teamId: number | string, node: string, type?: string) => {
    return request.get<any, { data: FlowConfigResponse }>(`/app/flow/${teamId}/config/getByNode`, { params: { node, type } });
  },

  getModels: async (teamId: number | string) => {
    const res = await request.get<any, { data: NewApiModelItem[] }>(`/app/new-api/${teamId}/models`, {
      params: {
        capability: 'chat',
        modelScope: 'platform_default',
      },
    });
    return toFlowModelResponse(res.data);
  },

  getKnowledges: (teamId: number | string) => {
    return flowConfigApi.getByNode(teamId, 'know');
  },

  getFlows: (teamId: number | string) => {
    return request.get<any, { data: any[] }>(`/app/flow/${teamId}/info/list`);
  },
};

export default flowConfigApi;

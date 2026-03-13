import request from '../request';

export interface PluginEntity {
  id?: number;
  name?: string;
  keyName?: string;
  hook?: string;
  description?: string;
  status?: number;
  version?: string;
  author?: string;
  logo?: string;
  cover?: string;
  readme?: string;
  config?: any;
  createTime?: string;
  updateTime?: string;
}

export interface PluginPageParams {
  page?: number;
  size?: number;
  keyWord?: string;
  status?: number;
}

export interface PluginPageResponse {
  list: PluginEntity[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}

export const flowPluginApi = {
  list: (teamId: number) => {
    return request.get<any, { data: PluginEntity[] }>(`/app/plugin/${teamId}/info/list`);
  },

  page: (teamId: number, params: PluginPageParams) => {
    return request.post<any, { data: PluginPageResponse }>(`/app/plugin/${teamId}/info/page`, params);
  },

  info: (teamId: number, id: number) => {
    return request.get<any, { data: PluginEntity }>(`/app/plugin/${teamId}/info/info`, { params: { id } });
  },

  add: (teamId: number, data: Partial<PluginEntity>) => {
    return request.post<any, { data: PluginEntity }>(`/app/plugin/${teamId}/info/add`, data);
  },

  update: (teamId: number, data: Partial<PluginEntity>) => {
    return request.post<any, { data: PluginEntity }>(`/app/plugin/${teamId}/info/update`, data);
  },

  delete: (teamId: number, ids: number[]) => {
    return request.post<any, { data: void }>(`/app/plugin/${teamId}/info/delete`, { ids });
  },

  publish: (teamId: number, id: number) => {
    return request.post<any, { data: { success: boolean } }>(`/app/plugin/${teamId}/info/publish`, { id });
  },
};

export default flowPluginApi;

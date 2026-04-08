import request from '../request';
import type { FlowInfoEntity, FlowDraft } from '../../types/flow';

export interface FlowPageParams {
  page: number;
  size: number;
  keyWord?: string;
  flowId?: number;
  isRelease?: boolean;
  visibility?: 'private' | 'team_public' | 'all';
  bindScope?: 'unbound' | 'global' | 'project' | 'all';
  onlyMine?: boolean;
  onlyTeamPublic?: boolean;
}

export interface FlowPageResponse {
  list: FlowInfoEntity[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
  summary?: {
    myCount: number;
    teamPublicCount: number;
    unboundCount: number;
    globalCount: number;
    projectBoundCount: number;
  };
}

export const flowInfoApi = {
  page: (teamId: string, params: FlowPageParams) => {
    return request.post<any, { data: FlowPageResponse }>(`/app/flow/${teamId}/info/page`, params);
  },

  info: (teamId: string, id: number) => {
    return request.get<any, { data: FlowInfoEntity }>(`/app/flow/${teamId}/info/info`, { params: { id } });
  },

  add: (teamId: string, data: Partial<FlowInfoEntity>) => {
    return request.post<any, { data: FlowInfoEntity }>(`/app/flow/${teamId}/info/add`, data);
  },

  update: (teamId: string, data: Partial<FlowInfoEntity>) => {
    return request.post<any, { data: FlowInfoEntity }>(`/app/flow/${teamId}/info/update`, data);
  },

  delete: (teamId: string, id: number) => {
    return request.post<any, { data: void }>(`/app/flow/${teamId}/info/delete`, { id });
  },

  release: (teamId: string, flowId: number) => {
    return request.post<any, { data: FlowInfoEntity }>(`/app/flow/${teamId}/info/release`, { flowId });
  },

  save: (teamId: string, id: number, draft: FlowDraft) => {
    return request.post<any, { data: FlowInfoEntity }>(`/app/flow/${teamId}/info/update`, {
      id,
      draft,
    });
  },

  setVisibility: (teamId: string, flowId: number, visibility: 'private' | 'team_public') => {
    return request.post<any, { data: FlowInfoEntity }>(`/app/flow/${teamId}/info/setVisibility`, {
      flowId,
      visibility,
    });
  },

  setBindScope: (
    teamId: string,
    flowId: number,
    bindScope: 'unbound' | 'global' | 'project',
    bindProjectIds?: string[]
  ) => {
    return request.post<any, { data: FlowInfoEntity }>(`/app/flow/${teamId}/info/setBindScope`, {
      flowId,
      bindScope,
      bindProjectIds,
    });
  },

  availableForProject: (teamId: string, projectId: string) => {
    return request.get<any, { data: FlowInfoEntity[] }>(
      `/app/flow/${teamId}/info/availableForProject`,
      { params: { projectId } }
    );
  },
};

export default flowInfoApi;

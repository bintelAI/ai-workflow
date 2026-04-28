import request from './request';

export interface WorkflowMulSheet {
  sheetId: string;
  name: string;
  type?: string;
  [key: string]: any;
}

export interface WorkflowMulColumn {
  fieldId: string;
  label: string;
  type: string;
  required?: boolean;
  [key: string]: any;
}

const unwrapData = <T>(payload: any, fallback: T): T => {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  if (Array.isArray(data)) return data as T;
  if (Array.isArray(data?.list)) return data.list as T;
  if (Array.isArray(data?.data)) return data.data as T;
  return (data ?? fallback) as T;
};

export const mulApi = {
  async getProjectSheets(projectId: string): Promise<WorkflowMulSheet[]> {
    if (!projectId) return [];
    const res = await request.get(`/app/mul/project/${projectId}/sheet/list`);
    const data = unwrapData<any[]>(res, []);
    return Array.isArray(data) ? data : [];
  },

  async getSheetColumns(
    teamId: string,
    projectId: string,
    sheetId: string
  ): Promise<WorkflowMulColumn[]> {
    if (!teamId || !projectId || !sheetId) return [];
    const res = await request.get(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/column/list`
    );
    const data = unwrapData<any[]>(res, []);
    return Array.isArray(data) ? data : [];
  },
};

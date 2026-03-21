export interface AiFlowRuntimeConfig {
  id?: number | string;
  teamId?: string;
  projectId?: string;
  token?: string;
  baseURL?: string;
  type?: string;
}

const RUNTIME_KEY = '__AI_FLOW_RUNTIME__';

export const getAiFlowRuntime = (): AiFlowRuntimeConfig => {
  if (typeof window === 'undefined') {
    return {};
  }
  return window[RUNTIME_KEY] || {};
};

export const setAiFlowRuntime = (runtime: AiFlowRuntimeConfig) => {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getAiFlowRuntime();
  const next = { ...current, ...runtime };
  window[RUNTIME_KEY] = next;

  if (next.token) {
    localStorage.setItem('token', next.token);
  }
  if (next.projectId) {
    localStorage.setItem('workflow_projectId', next.projectId);
  }
  if (next.teamId) {
    localStorage.setItem('workflow_teamId', next.teamId);
  }
};

export const getRuntimeValue = <T extends keyof AiFlowRuntimeConfig>(key: T): AiFlowRuntimeConfig[T] => {
  return getAiFlowRuntime()[key];
};

export const getRuntimeBaseURL = (): string => {
  return getRuntimeValue('baseURL') || import.meta.env.VITE_API_BASE_URL || '/api';
};

export const getRuntimeToken = (): string => {
  return getRuntimeValue('token') || localStorage.getItem('token') || '';
};

export const getRuntimeProjectId = (): string => {
  return getRuntimeValue('projectId') || localStorage.getItem('workflow_projectId') || '';
};

export const getRuntimeTeamId = (): string => {
  return getRuntimeValue('teamId') || localStorage.getItem('workflow_teamId') || '';
};

export const getRuntimeFlowId = (): string => {
  const value = getRuntimeValue('id');
  return value === undefined || value === null ? '' : String(value);
};

export const getRuntimePluginType = (): string => {
  return getRuntimeValue('type') || '';
};

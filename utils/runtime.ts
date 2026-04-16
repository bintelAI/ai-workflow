export interface AiFlowRuntimeConfig {
  id?: number | string;
  teamId?: string;
  projectId?: string;
  token?: string;
  baseURL?: string;
  type?: string;
}

declare global {
  interface Window {
    __AI_FLOW_RUNTIME__?: AiFlowRuntimeConfig;
  }
}

const RUNTIME_KEY = '__AI_FLOW_RUNTIME__';

const getUrlSearchParams = (): URLSearchParams => {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }
  return new URLSearchParams(window.location.search);
};

const getUrlParam = (key: keyof AiFlowRuntimeConfig): string => {
  const value = getUrlSearchParams().get(key);
  return value ?? '';
};

const getUrlFlowId = (): string => {
  const params = getUrlSearchParams();
  return params.get('id') || params.get('workflowId') || params.get('flowId') || '';
};

const readStorageValue = (key: keyof AiFlowRuntimeConfig): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  switch (key) {
    case 'token':
      return localStorage.getItem('token') || '';
    case 'projectId':
      return localStorage.getItem('workflow_projectId') || '';
    case 'teamId':
      return localStorage.getItem('workflow_teamId') || '';
    default:
      return '';
  }
};

const persistRuntime = (runtime: AiFlowRuntimeConfig) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (runtime.token) {
    localStorage.setItem('token', runtime.token);
  }
  if (runtime.projectId) {
    localStorage.setItem('workflow_projectId', runtime.projectId);
  }
  if (runtime.teamId) {
    localStorage.setItem('workflow_teamId', runtime.teamId);
  }
};

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
  persistRuntime(next);
};

export const resolveAiFlowRuntime = (): Required<Pick<AiFlowRuntimeConfig, 'teamId' | 'projectId' | 'token' | 'baseURL' | 'type'>> & Pick<AiFlowRuntimeConfig, 'id'> => {
  const runtime = getAiFlowRuntime();
  const urlId = getUrlFlowId();
  const urlTeamId = getUrlParam('teamId');
  const urlProjectId = getUrlParam('projectId');
  const urlType = getUrlParam('type');
  const urlBaseURL = getUrlParam('baseURL');
  const resolved: Required<Pick<AiFlowRuntimeConfig, 'teamId' | 'projectId' | 'token' | 'baseURL' | 'type'>> & Pick<AiFlowRuntimeConfig, 'id'> = {
    id: runtime.id ?? (urlId || undefined),
    teamId: runtime.teamId || urlTeamId || readStorageValue('teamId'),
    projectId: runtime.projectId || urlProjectId || readStorageValue('projectId'),
    token: runtime.token || readStorageValue('token'),
    baseURL: runtime.baseURL || urlBaseURL || import.meta.env.VITE_API_BASE_URL || '/api',
    type: runtime.type || urlType || '',
  };

  persistRuntime(resolved);
  return resolved;
};

export const getRuntimeValue = <T extends keyof AiFlowRuntimeConfig>(key: T): AiFlowRuntimeConfig[T] => {
  return resolveAiFlowRuntime()[key];
};

export const getRuntimeBaseURL = (): string => {
  return resolveAiFlowRuntime().baseURL;
};

export const getRuntimeToken = (): string => {
  return resolveAiFlowRuntime().token;
};

export const getRuntimeProjectId = (): string => {
  return resolveAiFlowRuntime().projectId;
};

export const getRuntimeTeamId = (): string => {
  return resolveAiFlowRuntime().teamId;
};

export const getRuntimeFlowId = (): string => {
  const value = resolveAiFlowRuntime().id;
  return value === undefined || value === null ? '' : String(value);
};

export const getRuntimePluginType = (): string => {
  return resolveAiFlowRuntime().type;
};

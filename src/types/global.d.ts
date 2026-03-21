export {};

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    __POWERED_BY_WUJIE__?: boolean;
    __WUJIE_MOUNT?: () => void;
    __WUJIE_UNMOUNT?: () => void;
    __WUJIE?: {
      id: string;
    };
    __AI_FLOW_RUNTIME__?: {
      id?: number | string;
      teamId?: string;
      projectId?: string;
      token?: string;
      baseURL?: string;
    };
  }
}

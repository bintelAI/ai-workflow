import request from '../request';

export const flowMcpApi = {
  getMessages: (label: string, sessionId: string, body: any) => {
    return request.post<any, { data: any }>(`/mcp/messages/${label}/${sessionId}`, body);
  },

  getSSEUrl: (label: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${baseUrl}/mcp/sse/${label}`;
  },
};

export default flowMcpApi;

import request from '../request';
import type { FlowRunRequest, FlowNodeResult, FlowNodeResultData, FlowLlmStreamData, FlowToolData, FlowData } from '../../types/flow';

export const flowRunApi = {
  debug: (data: FlowRunRequest) => {
    return request.post<any, { data: void }>('/app/flow/run/debug', data);
  },

  invoke: (data: FlowRunRequest) => {
    return request.post<any, { data: any }>('/app/flow/run/invoke', data);
  },
};

export const createSSEConnection = (
  url: string,
  params: FlowRunRequest,
  onMessage: (data: FlowNodeResult) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): { close: () => void } => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const token = localStorage.getItem('token');

  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  const decoder = new TextDecoder();

  fetch(`${baseUrl}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token || '',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(params),
    signal: controller.signal,
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      reader = response.body?.getReader() || null;
      if (!reader) {
        throw new Error('Response body is null');
      }

      let buffer = '';

      const read = (): Promise<void> => {
        return reader!.read().then(({ done, value }) => {
          if (done) {
            onComplete?.();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              if (data) {
                try {
                  const parsed = JSON.parse(data) as FlowNodeResult;
                  onMessage(parsed);
                } catch (e) {
                  console.error('Failed to parse SSE message:', e);
                }
              }
            }
          }

          return read();
        });
      };

      return read();
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        onError?.(error);
      }
    });

  return {
    close: () => {
      reader?.cancel();
      controller.abort();
    },
  };
};

export const runFlowWithSSE = (
  params: FlowRunRequest,
  callbacks: {
    onFlowStart?: () => void;
    onNodeStart?: (nodeId: string, nodeType: string) => void;
    onNodeRunning?: (nodeId: string, nodeType: string) => void;
    onNodeComplete?: (nodeId: string, nodeType: string, result: any) => void;
    onNodeError?: (nodeId: string, nodeType: string, error: string) => void;
    onLlmStream?: (nodeId: string, content: string, isThinking: boolean) => void;
    onToolStart?: (name: string, nodeId: string) => void;
    onToolEnd?: (name: string, nodeId: string) => void;
    onFlowComplete?: (result: any) => void;
    onFlowError?: (error: string) => void;
    onFlowCancel?: () => void;
    onError?: (error: Error) => void;
  }
): { close: () => void } => {
  return createSSEConnection(
    '/app/flow/run/debug',
    params,
    (data: FlowNodeResult) => {
      const { msgType, data: msgData } = data;

      switch (msgType) {
        case 'flow': {
          const flowData = msgData as FlowData;
          if (flowData.status === 'start') {
            callbacks.onFlowStart?.();
          } else if (flowData.status === 'end') {
            if (flowData.reason === 'success') {
              callbacks.onFlowComplete?.(flowData.result);
            } else if (flowData.reason === 'cancel') {
              callbacks.onFlowCancel?.();
            } else if (flowData.reason === 'error') {
              callbacks.onFlowError?.(flowData.result?.error || 'Unknown error');
            }
          }
          break;
        }

        case 'node': {
          const nodeData = msgData as FlowNodeResultData;
          if (nodeData.status === 'start') {
            callbacks.onNodeStart?.(nodeData.nodeId, nodeData.nodeType);
          } else if (nodeData.status === 'running') {
            callbacks.onNodeRunning?.(nodeData.nodeId, nodeData.nodeType);
          } else if (nodeData.status === 'done') {
            if (nodeData.result?.success === false) {
              callbacks.onNodeError?.(nodeData.nodeId, nodeData.nodeType, nodeData.result.error || 'Unknown error');
            } else {
              callbacks.onNodeComplete?.(nodeData.nodeId, nodeData.nodeType, nodeData.result);
            }
          }
          break;
        }

        case 'llmStream': {
          const llmData = msgData as FlowLlmStreamData;
          callbacks.onLlmStream?.(llmData.nodeId, llmData.content, llmData.isThinking);
          break;
        }

        case 'tool': {
          const toolData = msgData as FlowToolData;
          if (toolData.type === 'start') {
            callbacks.onToolStart?.(toolData.name, toolData.nodeId);
          } else if (toolData.type === 'end') {
            callbacks.onToolEnd?.(toolData.name, toolData.nodeId);
          }
          break;
        }
      }
    },
    callbacks.onError
  );
};

export default flowRunApi;

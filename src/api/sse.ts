export interface SSEMessage {
  id: string;
  event?: string;
  data: string;
}

export interface SSEOptions {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export class SSEClient {
  private controller: AbortController | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private decoder = new TextDecoder();

  async connect(options: SSEOptions): Promise<void> {
    this.controller = new AbortController();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = token;
    }

    try {
      const response = await fetch(`${baseUrl}${options.url}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      options.onOpen?.();

      this.reader = response.body.getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await this.reader.read();

        if (done) {
          options.onClose?.();
          break;
        }

        buffer += this.decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data) {
              try {
                const parsed = JSON.parse(data);
                options.onMessage?.(parsed);
              } catch {
                options.onMessage?.(data);
              }
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        options.onClose?.();
      } else {
        options.onError?.(error as Error);
      }
    }
  }

  disconnect(): void {
    if (this.reader) {
      this.reader.cancel();
      this.reader = null;
    }
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  isConnected(): boolean {
    return this.controller !== null && !this.controller.signal.aborted;
  }
}

export const createSSEClient = (): SSEClient => {
  return new SSEClient();
};

export default SSEClient;

import request from '../request';
import { getRuntimeTeamId } from '@ai-flow/utils/runtime';

export type FlowChatRole = 'system' | 'user' | 'assistant';

export interface FlowChatMessage {
  role: FlowChatRole;
  content: string;
}

export interface FlowChatCompletionPayload {
  model?: string | number | null;
  messages: FlowChatMessage[];
  stream?: boolean;
  user?: string;
  response_format?: {
    type: 'json_object';
  };
  [key: string]: any;
}

const resolveTeamId = (teamId?: string | number | null) => {
  const resolvedTeamId = String(teamId || getRuntimeTeamId() || '');
  if (!resolvedTeamId) {
    throw new Error('缺少 teamId，无法调用聊天接口');
  }
  return resolvedTeamId;
};

export const flowChatApi = {
  completions: (data: FlowChatCompletionPayload, teamId?: string | number | null) => {
    const resolvedTeamId = resolveTeamId(teamId);
    return request.post<any, { data: any }>(`/app/flow/${resolvedTeamId}/v1/chat/completions`, {
      model: data.model ?? 'team-default',
      ...data,
    });
  },
};

export default flowChatApi;

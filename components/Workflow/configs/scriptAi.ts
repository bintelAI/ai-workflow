import { flowChatApi } from '../../../src/api/flow/chat';
import type { FlowField } from '../../../src/types/flow';

export type ScriptLanguage = 'javascript' | 'python';

export interface ScriptAIInput {
  teamId?: string | null;
  projectId?: string | null;
  language: ScriptLanguage;
  code: string;
  requirement?: string;
  inputParams: FlowField[];
  outputParams: FlowField[];
  variables: Array<{
    id: string;
    type?: string;
    label?: string;
    params: FlowField[];
  }>;
}

export interface ScriptAIGenerateResult {
  code: string;
  summary?: string;
  warnings?: string[];
}

export interface ScriptAIValidateIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface ScriptAIValidateResult {
  valid: boolean;
  level: 'success' | 'warning' | 'error';
  summary: string;
  issues: ScriptAIValidateIssue[];
  suggestedCode?: string;
}

const parseAIJson = (content: string) => {
  const normalized = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(normalized);
  } catch {
    throw new Error('AI 返回格式异常，请重试');
  }
};

const getMessageContent = (response: any) => {
  const content = response?.data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('AI 返回格式异常，请重试');
  }
  return content;
};

const assertTeamId = (teamId?: string | null) => {
  if (!teamId) {
    throw new Error('缺少团队上下文，无法调用 AI 模型接口');
  }
};

const buildContext = (input: ScriptAIInput) => ({
  projectId: input.projectId || null,
  language: input.language,
  code: input.code,
  requirement: input.requirement || '',
  inputParams: input.inputParams || [],
  outputParams: input.outputParams || [],
  variables: input.variables || [],
});

const languageRule = (language: ScriptLanguage) =>
  language === 'python'
    ? '必须生成 Python 代码，入口必须是 def main(params, context):，返回 dict。'
    : '必须生成 JavaScript 代码，入口必须是 async function main(params, context) 或 function main(params, context)，返回对象。';

export async function generateScriptCode(input: ScriptAIInput): Promise<ScriptAIGenerateResult> {
  assertTeamId(input.teamId);
  const response = await flowChatApi.completions({
    model: 'team-default',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          '你是工作流脚本节点代码生成助手。',
          '只返回 JSON，不要 Markdown，不要解释性文本。',
          '返回格式固定为 {"code": "...", "summary": "...", "warnings": []}。',
          '脚本只允许使用 params 和 context，不允许访问后端 service、数据库、Redis、用户 token。',
          languageRule(input.language),
        ].join('\n'),
      },
      {
        role: 'user',
        content: JSON.stringify(buildContext(input)),
      },
    ],
    temperature: 0.2,
    user: 'workflow-script-ai-generate',
  }, input.teamId);

  const result = parseAIJson(getMessageContent(response));
  if (!result?.code || typeof result.code !== 'string') {
    throw new Error('AI 未返回可用代码');
  }
  return {
    code: result.code,
    summary: result.summary || '',
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
  };
}

export async function validateScriptCode(input: ScriptAIInput): Promise<ScriptAIValidateResult> {
  assertTeamId(input.teamId);
  const response = await flowChatApi.completions({
    model: 'team-default',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          '你是工作流脚本节点静态验证助手。',
          '只返回 JSON，不要 Markdown，不要解释性文本。',
          '返回格式固定为 {"valid": true, "level": "success", "summary": "...", "issues": [], "suggestedCode": ""}。',
          '验证运行环境与代码语言是否匹配、main(params, context) 是否存在、返回对象是否覆盖 outputParams。',
          '禁止旧 Cool extends Base、Base、后端 service、数据库、Redis、用户 token、本地后端依赖。',
          languageRule(input.language),
        ].join('\n'),
      },
      {
        role: 'user',
        content: JSON.stringify(buildContext(input)),
      },
    ],
    temperature: 0,
    user: 'workflow-script-ai-validate',
  }, input.teamId);

  const result = parseAIJson(getMessageContent(response));
  return {
    valid: Boolean(result?.valid),
    level: ['success', 'warning', 'error'].includes(result?.level) ? result.level : 'warning',
    summary: result?.summary || 'AI 验证完成',
    issues: Array.isArray(result?.issues) ? result.issues : [],
    suggestedCode: typeof result?.suggestedCode === 'string' ? result.suggestedCode : '',
  };
}

export function isCodeLanguageMatched(language: ScriptLanguage, code: string) {
  const looksLikeJavaScript = /\b(?:async\s+)?function\s+main\s*\(/.test(code);
  const looksLikePython = /^\s*def\s+main\s*\(/m.test(code);
  if (language === 'python') {
    return !looksLikeJavaScript;
  }
  return !looksLikePython;
}

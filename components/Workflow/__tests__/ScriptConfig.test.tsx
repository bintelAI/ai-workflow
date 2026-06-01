import React, { useState } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScriptConfig from '../configs/ScriptConfig';
import { flowChatApi } from '../../../src/api/flow/chat';

vi.mock('../../../src/api/flow/chat', () => ({
  flowChatApi: {
    completions: vi.fn(),
  },
}));

vi.mock('../configs/common/index', () => ({
  InputParams: () => <div data-testid="input-params" />,
  OutputParams: () => <div data-testid="output-params" />,
}));

const initialConfig = {
  language: 'javascript' as const,
  code: 'async function main(params, context) {\n  return { result: params.arg1 };\n}',
  inputParams: [{ field: 'arg1', type: 'string' }],
  outputParams: [{ field: 'result', type: 'string' }],
};

const renderScriptConfig = (onConfigChangeSpy = vi.fn()) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const Harness = () => {
    const [config, setConfig] = useState(initialConfig);
    const handleConfigChange = (key: string, value: any) => {
      onConfigChangeSpy(key, value);
      setConfig(prev => ({ ...prev, [key]: value }));
    };
    return (
      <ScriptConfig
        config={config}
        onConfigChange={handleConfigChange}
        teamId="team_1"
        projectId="project_1"
        variables={[{
          id: 'start_1',
          label: '开始',
          type: 'start',
          params: [{ field: 'content', type: 'string' }],
        }]}
      />
    );
  };

  act(() => {
    root.render(<Harness />);
  });

  return { container, root, onConfigChangeSpy };
};

describe('ScriptConfig AI actions', () => {
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('opens generation modal, previews generated code, and applies only after confirmation', async () => {
    (flowChatApi.completions as any).mockResolvedValue({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              code: 'async function main(params, context) { return { result: "generated" }; }',
              summary: '已生成脚本',
              warnings: [],
            }),
          },
        }],
      },
    });
    const { onConfigChangeSpy } = renderScriptConfig();

    await act(async () => {
      Array.from(document.body.querySelectorAll('button'))
        .find(button => button.textContent?.includes('AI 生成'))
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.body.textContent).toContain('AI 生成脚本代码');

    const requirementInput = document.body.querySelector('textarea[placeholder="请输入希望脚本完成的处理逻辑"]') as HTMLTextAreaElement;
    await act(async () => {
      requirementInput.value = '把 arg1 输出为 result';
      requirementInput.dispatchEvent(new Event('input', { bubbles: true }));
      requirementInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="生成脚本代码"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(flowChatApi.completions).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'team-default',
        response_format: { type: 'json_object' },
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('"language":"javascript"'),
          }),
        ]),
      }),
      'team_1'
    );
    expect(onConfigChangeSpy).not.toHaveBeenCalledWith(
      'code',
      expect.stringContaining('generated')
    );
    expect(document.body.textContent).toContain('已生成脚本');
    expect(document.body.textContent).toContain('generated');

    await act(async () => {
      Array.from(document.body.querySelectorAll('button'))
        .find(button => button.textContent?.trim() === '应用代码')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onConfigChangeSpy).toHaveBeenCalledWith(
      'code',
      'async function main(params, context) { return { result: "generated" }; }'
    );
  });

  it('validates code through AI and renders returned issues', async () => {
    (flowChatApi.completions as any).mockResolvedValue({
      data: {
        choices: [{
          message: {
            content: '```json\n{"valid":false,"level":"error","summary":"运行环境不匹配","issues":[{"severity":"error","message":"Python 环境下不能使用 function main()","suggestion":"切换为 JavaScript"}],"suggestedCode":""}\n```',
          },
        }],
      },
    });
    renderScriptConfig();

    await act(async () => {
      Array.from(document.body.querySelectorAll('button'))
        .find(button => button.textContent?.includes('AI 验证'))
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(flowChatApi.completions).toHaveBeenCalled();
    expect(document.body.textContent).toContain('AI 验证结果');
    expect(document.body.textContent).toContain('运行环境不匹配');
    expect(document.body.textContent).toContain('Python 环境下不能使用 function main()');
  });

  it('does not overwrite code when AI returns invalid JSON', async () => {
    (flowChatApi.completions as any).mockResolvedValue({
      data: {
        choices: [{ message: { content: 'not json' } }],
      },
    });
    const { onConfigChangeSpy } = renderScriptConfig();

    await act(async () => {
      Array.from(document.body.querySelectorAll('button'))
        .find(button => button.textContent?.includes('AI 生成'))
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="生成脚本代码"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.body.textContent).toContain('AI 返回格式异常，请重试');
    expect(onConfigChangeSpy).not.toHaveBeenCalledWith('code', expect.any(String));
  });
});

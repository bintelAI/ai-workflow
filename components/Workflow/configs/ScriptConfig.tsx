import React, { useState, useCallback } from 'react';
import { Select, Input, Button, Divider, Tabs, Alert, Modal, Space, Typography } from 'antd';
import { CheckCircleOutlined, CodeOutlined, CodeSandboxOutlined, DatabaseOutlined, ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { InputParams, OutputParams } from './common/index';
import type { FlowField } from '@ai-flow/src/types/flow';
import {
  generateScriptCode,
  isCodeLanguageMatched,
  ScriptAIGenerateResult,
  ScriptAIValidateResult,
  validateScriptCode,
} from './scriptAi';
import './ScriptConfig.css';

const DEFAULT_JS_CODE = `async function main(params, context) {
  console.log('params:', params);

  return {
    result: ''
  };
}`;

const DEFAULT_PYTHON_CODE = `def main(params, context):
    print('params:', params)

    return {
        'result': ''
    }`;

interface ScriptConfigProps {
  config: {
    code?: string;
    language?: 'javascript' | 'python';
    inputParams?: FlowField[];
    outputParams?: FlowField[];
  };
  onConfigChange: (key: string, value: any) => void;
  variables?: Array<{
    id: string;
    type?: string;
    label?: string;
    params: FlowField[];
  }>;
  teamId?: string | null;
  projectId?: string | null;
}

const CODE_TEMPLATES: { id: string; name: string; language: 'javascript' | 'python'; code: string }[] = [
  {
    id: 'js-basic',
    name: 'JavaScript 基础',
    language: 'javascript',
    code: `async function main(params, context) {
  console.log('params:', params);

  return {
    result: ''
  };
}`,
  },
  {
    id: 'js-data-transform',
    name: '数据转换',
    language: 'javascript',
    code: `async function main(params, context) {
  const { data = [] } = params;

  const result = data.map(item => ({
    id: item.id,
    value: item.value * 2,
    processed: true
  }));

  return { result };
}`,
  },
  {
    id: 'js-json-build',
    name: 'JSON 组装',
    language: 'javascript',
    code: `async function main(params, context) {
  return {
    result: {
      ...params,
      handledAt: new Date().toISOString(),
      requestId: context.requestId
    }
  };
}`,
  },
  {
    id: 'python-basic',
    name: 'Python 基础',
    language: 'python',
    code: DEFAULT_PYTHON_CODE,
  },
];

const ScriptConfig: React.FC<ScriptConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
  teamId,
  projectId,
}) => {
  const [activeTab, setActiveTab] = useState('edit');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [requirement, setRequirement] = useState('');
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [generateResult, setGenerateResult] = useState<ScriptAIGenerateResult | null>(null);
  const [validateResult, setValidateResult] = useState<ScriptAIValidateResult | null>(null);
  const [aiError, setAiError] = useState('');

  const language = config.language || 'javascript';
  const currentCode = config.code || DEFAULT_JS_CODE;

  const handleInputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('inputParams', params);
    },
    [onConfigChange]
  );

  const handleOutputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('outputParams', params);
    },
    [onConfigChange]
  );

  const handleTemplateSelect = (templateId: string) => {
    const template = CODE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      onConfigChange('code', template.code);
      onConfigChange('language', template.language);
    }
  };

  const handleLanguageChange = (language: 'javascript' | 'python') => {
    onConfigChange('language', language);
    const currentCode = config.code || '';
    const looksLikeJavaScript = /\b(?:async\s+)?function\s+main\s*\(/.test(currentCode);
    const looksLikePython = /^\s*def\s+main\s*\(/m.test(currentCode);
    if (language === 'python' && looksLikeJavaScript) {
      onConfigChange('code', DEFAULT_PYTHON_CODE);
    }
    if (language === 'javascript' && looksLikePython) {
      onConfigChange('code', DEFAULT_JS_CODE);
    }
  };

  const buildAIInput = (extraRequirement = '') => ({
    teamId,
    projectId,
    language,
    code: currentCode,
    requirement: extraRequirement,
    inputParams: config.inputParams || [],
    outputParams: config.outputParams || [],
    variables,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setAiError('');
    setGenerateResult(null);
    try {
      const result = await generateScriptCode(buildAIInput(requirement));
      if (!isCodeLanguageMatched(language, result.code)) {
        throw new Error('AI 生成代码与当前运行环境不匹配，请调整运行环境后重试');
      }
      setGenerateResult(result);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI 生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setAiError('');
    try {
      const result = await validateScriptCode(buildAIInput());
      setValidateResult(result);
    } catch (error) {
      setValidateResult({
        valid: false,
        level: 'error',
        summary: error instanceof Error ? error.message : 'AI 验证失败，请重试',
        issues: [],
        suggestedCode: '',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleApplyGeneratedCode = () => {
    if (!generateResult?.code) return;
    onConfigChange('code', generateResult.code);
    setGenerateOpen(false);
  };

  const handleApplySuggestedCode = () => {
    if (!validateResult?.suggestedCode) return;
    onConfigChange('code', validateResult.suggestedCode);
    setValidateResult(null);
  };

  const tabItems = [
    {
      key: 'edit',
      label: (
        <span>
          <CodeOutlined />
          编辑
        </span>
      ),
      children: (
        <div className="code-editor">
          <Input.TextArea
            value={currentCode}
            onChange={e => onConfigChange('code', e.target.value)}
            rows={16}
            className="code-textarea"
            placeholder="编写代码..."
          />
        </div>
      ),
    },
    {
      key: 'library',
      label: (
        <span>
          <DatabaseOutlined />
          代码库
        </span>
      ),
      children: (
        <div className="code-library">
          <Select
            placeholder="选择代码模板"
            onChange={handleTemplateSelect}
            style={{ width: '100%', marginBottom: 16 }}
            allowClear
          >
            <Select.OptGroup label="JavaScript">
              {CODE_TEMPLATES.filter(t => t.language === 'javascript').map(t => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select.OptGroup>
            <Select.OptGroup label="Python">
              {CODE_TEMPLATES.filter(t => t.language === 'python').map(t => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select.OptGroup>
          </Select>
          
          {config.code && (
            <div className="code-preview">
              <label className="config-label">当前代码预览</label>
              <pre className="code-preview-content">{config.code}</pre>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="script-config">
      <Alert
        type="info"
        icon={<CodeSandboxOutlined />}
        message="代码执行节点"
        description="脚本将在远程沙盒中执行。请通过 main(params, context) 返回 JSON 对象，不要依赖本地后端服务。"
        showIcon
        className="script-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">运行环境</label>
        <Select
          value={config.language || 'javascript'}
          onChange={handleLanguageChange}
          style={{ width: '100%' }}
        >
          <Select.Option value="javascript">JavaScript (Node.js)</Select.Option>
          <Select.Option value="python">Python 3</Select.Option>
        </Select>
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || [{ field: 'arg1' }]}
          onChange={handleInputParamsChange}
          fieldPrefix="arg"
          variables={variables}
          inputable
        />
      </div>

      <Divider />

      <div className="config-section">
        <div className="script-code-header">
          <label className="config-label">代码编辑</label>
          <Space size={8}>
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => {
                setGenerateOpen(true);
                setAiError('');
                setGenerateResult(null);
              }}
              loading={generating}
            >
              AI 生成
            </Button>
            <Button
              size="small"
              icon={<ExperimentOutlined />}
              onClick={handleValidate}
              loading={validating}
            >
              AI 验证
            </Button>
          </Space>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
        />
      </div>

      {validateResult && (
        <Modal
          title="AI 验证结果"
          open
          onCancel={() => setValidateResult(null)}
          footer={[
            validateResult.suggestedCode ? (
              <Button key="apply" type="primary" onClick={handleApplySuggestedCode}>
                应用建议代码
              </Button>
            ) : null,
            <Button key="close" onClick={() => setValidateResult(null)}>
              关闭
            </Button>,
          ].filter(Boolean)}
        >
          <Alert
            type={validateResult.level === 'error' ? 'error' : validateResult.level === 'warning' ? 'warning' : 'success'}
            message={validateResult.summary}
            showIcon
          />
          {validateResult.issues.length > 0 && (
            <div className="script-ai-issues">
              {validateResult.issues.map((issue, index) => (
                <Alert
                  key={`${issue.message}-${index}`}
                  type={issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info'}
                  message={issue.message}
                  description={issue.suggestion}
                  showIcon
                />
              ))}
            </div>
          )}
          {validateResult.suggestedCode && (
            <pre className="script-ai-code-preview">{validateResult.suggestedCode}</pre>
          )}
        </Modal>
      )}

      <Modal
        title="AI 生成脚本代码"
        open={generateOpen}
        onCancel={() => setGenerateOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setGenerateOpen(false)}>
            取消
          </Button>,
          <Button key="generate" aria-label="生成脚本代码" onClick={handleGenerate} loading={generating}>
            生成
          </Button>,
          <Button key="apply" type="primary" disabled={!generateResult?.code} onClick={handleApplyGeneratedCode}>
            应用代码
          </Button>,
        ]}
      >
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            当前运行环境：{language === 'python' ? 'Python 3' : 'JavaScript (Node.js)'}
          </Typography.Text>
          <Input.TextArea
            value={requirement}
            onChange={event => setRequirement(event.target.value)}
            rows={4}
            placeholder="请输入希望脚本完成的处理逻辑"
          />
          {aiError && (
            <Alert type="error" message={aiError} showIcon />
          )}
          {generateResult && (
            <>
              <Alert
                type={generateResult.warnings?.length ? 'warning' : 'success'}
                icon={<CheckCircleOutlined />}
                message={generateResult.summary || 'AI 已生成脚本代码'}
                description={generateResult.warnings?.join('\n')}
                showIcon
              />
              <pre className="script-ai-code-preview">{generateResult.code}</pre>
            </>
          )}
        </Space>
      </Modal>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <OutputParams
          value={config.outputParams || [{ field: 'result', type: 'string' }]}
          onChange={handleOutputParamsChange}
        />
      </div>
    </div>
  );
};

export default ScriptConfig;

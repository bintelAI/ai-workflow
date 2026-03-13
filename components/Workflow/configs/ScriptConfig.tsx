import React, { useState, useCallback } from 'react';
import { Select, Input, Button, Divider, Tabs, Alert } from 'antd';
import { CodeOutlined, DatabaseOutlined, CodeSandboxOutlined } from '@ant-design/icons';
import { InputParams, OutputParams } from './common/index';
import type { FlowField } from '@/src/types/flow';
import './ScriptConfig.css';

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
}

const CODE_TEMPLATES: { id: string; name: string; language: 'javascript' | 'python'; code: string }[] = [
  {
    id: 'js-basic',
    name: 'JavaScript 基础',
    language: 'javascript',
    code: `// JavaScript 基础模板
async main(params) {
  console.log('params:', params);
  
  // 在这里编写你的代码
  
  return {
    result: ""
  };
}`,
  },
  {
    id: 'js-data-transform',
    name: '数据转换',
    language: 'javascript',
    code: `// 数据转换示例
async main(params) {
  const { data } = params;
  
  const result = data.map(item => ({
    id: item.id,
    value: item.value * 2,
    processed: true
  }));
  
  return { result };
}`,
  },
  {
    id: 'js-http-request',
    name: 'HTTP 请求',
    language: 'javascript',
    code: `// HTTP 请求示例
async main(params) {
  const { url, method = 'GET', data } = params;
  
  const response = await axios({
    method,
    url,
    data
  });
  
  return {
    result: response.data
  };
}`,
  },
  {
    id: 'python-basic',
    name: 'Python 基础',
    language: 'python',
    code: `# Python 基础模板
import json

def main(params):
    print('params:', params)
    
    # 在这里编写你的代码
    
    return {
        'result': ''
    }`,
  },
];

const DEFAULT_JS_CODE = `import axios from 'axios';
import * as _ from 'lodash';
import * as moment from 'moment';

/**
 * 代码执行
 */
export class Cool extends Base {
  /**
   * 主函数
   */
  async main(params: Params): Promise<Result> {
    console.log('Cool main', params);
    return {
      result: ""
    };
  }
}`;

const ScriptConfig: React.FC<ScriptConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const [activeTab, setActiveTab] = useState('edit');

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
            value={config.code || DEFAULT_JS_CODE}
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
        description="执行自定义代码，支持 JavaScript 和 Python。可通过 axios、lodash、moment 等库。"
        showIcon
        className="script-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">运行环境</label>
        <Select
          value={config.language || 'javascript'}
          onChange={val => onConfigChange('language', val)}
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
        <label className="config-label">代码编辑</label>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
        />
      </div>

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

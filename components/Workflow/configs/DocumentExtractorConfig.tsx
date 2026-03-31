import React, { useState, useEffect, useCallback } from 'react';
import { Select, Input, Button, Divider, Alert, Empty, Popover, Spin } from 'antd';
import { 
  FileTextOutlined, 
  SearchOutlined, 
  CheckOutlined, 
  DownOutlined 
} from '@ant-design/icons';
import { InputParams, OutputParams } from './common/index';
import { flowConfigApi } from '@ai-flow/src/api/flow';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { FlowField } from '@ai-flow/src/types/flow';
import './DocumentExtractorConfig.css';

interface DocumentExtractorConfigProps {
  config: {
    inputParams?: FlowField[];
    outputParams?: FlowField[];
    model?: string;
  };
  onConfigChange: (key: string, value: any) => void;
  variables?: Array<{
    id: string;
    type?: string;
    label?: string;
    params: FlowField[];
  }>;
}

interface ModelGroup {
  id: number;
  title: string;
  type: string;
  select: string[];
}

const DocumentExtractorConfig: React.FC<DocumentExtractorConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const teamId = useWorkflowStore(state => state.teamId)
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  useEffect(() => {
    if (teamId) {
      loadModels();
    }
  }, [teamId]);

  const loadModels = async () => {
    if (!teamId) return;
    setModelLoading(true);
    try {
      const res = await flowConfigApi.getModels(teamId);
      const groups: ModelGroup[] = (res.data as any[] || []).map((e: any) => ({
        id: e.id,
        title: e.name,
        type: e.type,
        select: e.options?.options?.find((o: any) => o.field === 'model')?.select || [],
      }));
      setModelGroups(groups);
      
      if (!config.model && groups.length > 0 && groups[0].select.length > 0) {
        onConfigChange('model', groups[0].select[0]);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setModelLoading(false);
    }
  };

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

  const handleModelSelect = (modelName: string) => {
    onConfigChange('model', modelName);
    setModelPopoverOpen(false);
  };

  const filteredGroups = modelGroups.filter(g =>
    g.title.toLowerCase().includes(modelSearch.toLowerCase()) ||
    g.select.some(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
  );

  return (
    <div className="document-extractor-config">
      <Alert
        type="info"
        icon={<FileTextOutlined />}
        message="智能解析节点"
        description="使用 AI 模型智能提取内容的关键信息，支持自定义输出字段。"
        showIcon
        className="extractor-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || [{ field: 'text' }]}
          onChange={handleInputParamsChange}
          fieldPrefix="text"
          variables={variables}
          editField={false}
          disabled
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">模型</label>
        <Popover
          open={modelPopoverOpen}
          onOpenChange={setModelPopoverOpen}
          trigger="click"
          placement="bottomLeft"
          overlayClassName="model-selector-popover"
          arrow={false}
          content={
            <Spin spinning={modelLoading}>
              <div className="model-selector">
                <div className="model-search">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="搜索模型"
                    value={modelSearch}
                    onChange={e => setModelSearch(e.target.value)}
                    allowClear
                  />
                </div>
                <div className="model-list">
                  {filteredGroups.length === 0 ? (
                    <Empty description="未找到匹配项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    filteredGroups.map(group => (
                      <div key={group.id} className="model-group">
                        <div className="model-group-label">{group.title}</div>
                        {group.select.map(model => (
                          <div
                            key={model}
                            className={`model-item ${config.model === model ? 'active' : ''}`}
                            onClick={() => handleModelSelect(model)}
                          >
                            <span>{model}</span>
                            {config.model === model && <CheckOutlined className="check-icon" />}
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Spin>
          }
        >
          <div className="model-selector-trigger">
            <span className={config.model ? '' : 'placeholder'}>
              {config.model || '选择模型'}
            </span>
            <DownOutlined className="arrow-icon" />
          </div>
        </Popover>
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <OutputParams
          value={config.outputParams || [{ field: 'result', type: 'string', label: '解析结果' }]}
          onChange={handleOutputParamsChange}
        />
        <div className="output-hint">
          <p>定义需要提取的字段，AI 将根据字段名称智能提取内容</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentExtractorConfig;

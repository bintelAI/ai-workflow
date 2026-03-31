import React, { useState, useEffect, useCallback } from 'react';
import { Select, Input, Button, Divider, Alert, Empty, Popover, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, CheckOutlined, DownOutlined, TagsOutlined } from '@ant-design/icons';
import { InputParams } from './common/index';
import { flowConfigApi } from '@ai-flow/src/api/flow';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { FlowField, FlowModelOption, ClassifyOptions } from '@ai-flow/src/types/flow';
import './QuestionClassifierConfig.css';

interface QuestionClassifierConfigProps {
  config: {
    inputParams?: FlowField[];
    model?: string;
    types?: string[];
    descriptions?: string[];
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

const QuestionClassifierConfig: React.FC<QuestionClassifierConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const teamId = useWorkflowStore(state => state.teamId)
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  const types = config.types || [''];
  const descriptions = config.descriptions || [''];

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

  const handleAddType = () => {
    onConfigChange('types', [...types, '']);
    onConfigChange('descriptions', [...descriptions, '']);
  };

  const handleRemoveType = (index: number) => {
    const newTypes = types.filter((_, i) => i !== index);
    const newDescriptions = descriptions.filter((_, i) => i !== index);
    onConfigChange('types', newTypes);
    onConfigChange('descriptions', newDescriptions);
  };

  const handleTypeChange = (index: number, value: string) => {
    const newTypes = [...types];
    newTypes[index] = value;
    onConfigChange('types', newTypes);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = value;
    onConfigChange('descriptions', newDescriptions);
  };

  const handleModelSelect = (modelName: string, group: ModelGroup) => {
    onConfigChange('model', modelName);
    setModelPopoverOpen(false);
  };

  const filteredGroups = modelGroups.filter(g =>
    g.title.toLowerCase().includes(modelSearch.toLowerCase()) ||
    g.select.some(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
  );

  return (
    <div className="question-classifier-config">
      <Alert
        type="info"
        icon={<TagsOutlined />}
        message="分类器节点"
        description="根据内容调用 LLM 进行智能分类，每个分类对应一个输出分支。"
        showIcon
        className="classifier-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || [{ field: 'content', type: 'string' }]}
          onChange={handleInputParamsChange}
          fieldPrefix="content"
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
                            onClick={() => handleModelSelect(model, group)}
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
        <div className="section-header">
          <label className="config-label">分类配置</label>
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddType}
          >
            添加分类
          </Button>
        </div>

        <div className="types-list">
          {types.map((type, index) => (
            <div key={index} className="type-item">
              <div className="type-header">
                <span className="type-index">{index + 1}</span>
                <Input
                  value={type}
                  onChange={e => handleTypeChange(index, e.target.value)}
                  placeholder="分类名称"
                  className="type-name-input"
                />
                {types.length > 1 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveType(index)}
                  />
                )}
              </div>
              <Input.TextArea
                value={descriptions[index] || ''}
                onChange={e => handleDescriptionChange(index, e.target.value)}
                placeholder="描述该分类的特征，帮助 AI 准确识别..."
                rows={2}
                className="type-description"
              />
            </div>
          ))}
        </div>

        {types.length === 0 && (
          <Empty description="请添加分类" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <div className="output-info">
          <div className="output-item">
            <span className="output-name">content</span>
            <span className="output-type">string</span>
            <span className="output-desc">分类内容</span>
          </div>
          <div className="output-item">
            <span className="output-name">index</span>
            <span className="output-type">number</span>
            <span className="output-desc">分类索引</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionClassifierConfig;

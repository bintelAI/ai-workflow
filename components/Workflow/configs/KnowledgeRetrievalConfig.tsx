import React, { useState, useEffect, useCallback } from 'react';
import { Select, InputNumber, Slider, Divider, Alert, Tag, Empty, Spin } from 'antd';
import { DatabaseOutlined, SettingOutlined } from '@ant-design/icons';
import { InputParams } from './common/index';
import { flowConfigApi } from '@ai-flow/src/api/flow';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { FlowField, KnowOptions } from '@ai-flow/src/types/flow';
import './KnowledgeRetrievalConfig.css';

interface KnowledgeRetrievalConfigProps {
  config: {
    inputParams?: FlowField[];
    knowIds?: number[];
    size?: number;
    minScore?: number;
  };
  onConfigChange: (key: string, value: any) => void;
  variables?: Array<{
    id: string;
    type?: string;
    label?: string;
    params: FlowField[];
  }>;
}

interface KnowledgeItem {
  id: number;
  name: string;
  description?: string;
}

const KnowledgeRetrievalConfig: React.FC<KnowledgeRetrievalConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const teamId = useWorkflowStore(state => state.teamId)
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teamId) {
      loadKnowledgeList();
    }
  }, [teamId]);

  const loadKnowledgeList = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const res = await flowConfigApi.getKnowledges(teamId);
      setKnowledgeList(res.data?.options || []);
    } catch (error) {
      console.error('Failed to load knowledge list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('inputParams', params);
    },
    [onConfigChange]
  );

  const handleKnowledgeSelect = (knowId: number) => {
    const currentIds = config.knowIds || [];
    if (!currentIds.includes(knowId)) {
      onConfigChange('knowIds', [...currentIds, knowId]);
    }
  };

  const handleKnowledgeRemove = (knowId: number) => {
    const currentIds = config.knowIds || [];
    onConfigChange('knowIds', currentIds.filter(id => id !== knowId));
  };

  const getSelectedKnowledge = () => {
    const ids = config.knowIds || [];
    return knowledgeList.filter(k => ids.includes(k.id));
  };

  const getAvailableKnowledge = () => {
    const ids = config.knowIds || [];
    return knowledgeList.filter(k => !ids.includes(k.id));
  };

  return (
    <div className="knowledge-config">
      <Alert
        type="info"
        icon={<DatabaseOutlined />}
        message="知识库检索节点"
        description="从知识库中检索出相关的内容，支持语义检索和全文检索。"
        showIcon
        className="knowledge-alert"
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
        <label className="config-label">
          <DatabaseOutlined style={{ marginRight: 4 }} />
          选择知识库
          <span className="required">*</span>
        </label>
        
        <Spin spinning={loading}>
          <Select
            placeholder="添加知识库..."
            onChange={handleKnowledgeSelect}
            style={{ width: '100%' }}
            allowClear
          >
            {getAvailableKnowledge().map(k => (
              <Select.Option key={k.id} value={k.id}>
                {k.name}
              </Select.Option>
            ))}
          </Select>
        </Spin>

        <div className="selected-knowledge">
          {getSelectedKnowledge().length === 0 ? (
            <Empty description="请选择知识库" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            getSelectedKnowledge().map(k => (
              <Tag
                key={k.id}
                closable
                onClose={() => handleKnowledgeRemove(k.id)}
                color="blue"
              >
                {k.name}
              </Tag>
            ))
          )}
        </div>
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">
          <SettingOutlined style={{ marginRight: 4 }} />
          检索设置
        </label>

        <div className="setting-item">
          <div className="setting-label">
            <span>结果条数 (Top K)</span>
            <span className="setting-value">{config.size || 30}</span>
          </div>
          <Slider
            min={1}
            max={100}
            value={config.size || 30}
            onChange={val => onConfigChange('size', val)}
          />
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>相似度阈值 (Min Score)</span>
            <span className="setting-value">{config.minScore || 0}</span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.001}
            value={config.minScore || 0}
            onChange={val => onConfigChange('minScore', val)}
          />
        </div>
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <div className="output-info">
          <div className="output-item">
            <span className="output-name">documents</span>
            <span className="output-type">object[]</span>
            <span className="output-desc">文档列表</span>
          </div>
          <div className="output-item">
            <span className="output-name">text</span>
            <span className="output-type">string</span>
            <span className="output-desc">文档内容</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeRetrievalConfig;

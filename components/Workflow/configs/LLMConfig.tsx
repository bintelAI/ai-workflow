import React, { useState, useEffect, useMemo } from 'react';
import { Select, Input, InputNumber, Switch, Slider, Divider, Empty, Spin, Popover, Button, Tag } from 'antd';
import { SearchOutlined, CheckOutlined, DownOutlined, ToolOutlined, ApiOutlined } from '@ant-design/icons';
import { InputParams, VariableSelector } from './common/index';
import { flowConfigApi } from '@/src/api/flow';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { FlowField, FlowModelOption, LLMOptions } from '@/src/types/flow';
import './LLMConfig.css';

interface LLMConfigProps {
  config: {
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    userPrompt?: string;
    history?: number;
    isOutput?: boolean;
    toolConfig?: any[];
    mcpConfig?: any[];
    inputParams?: FlowField[];
  };
  onConfigChange: (key: string, value: any) => void;
  loadingField?: string | null;
  onAIGenerate?: (field: string, isConfig: boolean) => void;
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
  options: any[];
}

interface ConfigItem {
  id: number;
  name: string;
  type: string;
  options?: any;
}

const LLMConfig: React.FC<LLMConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const teamId = useWorkflowStore(state => state.teamId)
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [toolList, setToolList] = useState<ConfigItem[]>([]);
  const [mcpList, setMcpList] = useState<ConfigItem[]>([]);

  useEffect(() => {
    if (!teamId) {
      console.log('[LLMConfig] teamId is null, skipping load')
      return;
    }
    
    console.log('[LLMConfig] Loading data with teamId:', teamId)
    
    const loadData = async () => {
      // 加载模型
      setModelLoading(true);
      try {
        console.log('[LLMConfig] Fetching models for teamId:', teamId)
        const res = await flowConfigApi.getModels(teamId);
        console.log('[LLMConfig] Models response:', res)
        const groups: ModelGroup[] = (res.data as any[] || []).map((e: any) => ({
          id: e.id,
          title: e.name,
          type: e.type,
          select: e.options?.options?.find((o: any) => o.field === 'model')?.select || [],
          options: e.options?.options?.filter((o: any) => o.field !== 'model') || [],
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

      // 加载工具
      try {
        const res = await flowConfigApi.getByNode(teamId, 'tool');
        setToolList(res.data as any[] || []);
      } catch (error) {
        console.error('Failed to load tools:', error);
      }

      // 加载 MCP
      try {
        const res = await flowConfigApi.getByNode(teamId, 'mcp');
        setMcpList(res.data as any[] || []);
      } catch (error) {
        console.error('Failed to load mcps:', error);
      }
    };

    loadData();
  }, [teamId]);

  const filteredGroups = useMemo(() => {
    if (!modelSearch) return modelGroups;
    return modelGroups.filter(g => 
      g.title.toLowerCase().includes(modelSearch.toLowerCase()) ||
      g.select.some(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
    );
  }, [modelGroups, modelSearch]);

  const handleModelSelect = (modelName: string, group: ModelGroup) => {
    onConfigChange('model', modelName);
    onConfigChange('supplier', group.type);
    onConfigChange('supplierName', group.title);
    setModelPopoverOpen(false);
  };

  const handleInputParamsChange = (params: FlowField[]) => {
    onConfigChange('inputParams', params);
  };

  const handleToolSelect = (toolIds: number[]) => {
    const tools = toolIds.map(id => {
      const tool = toolList.find(t => t.id === id);
      return {
        id,
        key: tool?.type,
        options: tool?.options || {}
      };
    });
    onConfigChange('toolConfig', tools);
  };

  const handleMcpSelect = (mcpIds: number[]) => {
    const mcps = mcpIds.map(id => {
      const mcp = mcpList.find(m => m.id === id);
      return {
        id,
        key: mcp?.type,
        options: mcp?.options || {}
      };
    });
    onConfigChange('mcpConfig', mcps);
  };

  const currentModelGroup = useMemo(() => {
    return modelGroups.find(g => g.select.includes(config.model || ''));
  }, [modelGroups, config.model]);

  const selectedToolIds = (config.toolConfig || []).map((t: any) => t.id).filter(Boolean);
  const selectedMcpIds = (config.mcpConfig || []).map((m: any) => m.id).filter(Boolean);

  return (
    <div className="llm-config">
      <div className="config-section">
        <label className="config-label">输入变量</label>
        <InputParams
          value={config.inputParams || [{ field: 'input' }]}
          onChange={handleInputParamsChange}
          fieldPrefix="input"
          variables={variables}
          inputable
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
        <label className="config-label">温度系数 (Temperature)</label>
        <div className="temperature-control">
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={config.temperature ?? 0.7}
            onChange={val => onConfigChange('temperature', val)}
          />
          <span className="temperature-value">{config.temperature ?? 0.7}</span>
        </div>
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">
          <ToolOutlined style={{ marginRight: 4 }} />
          工具 (Tools)
        </label>
        <Select
          mode="multiple"
          placeholder="选择工具..."
          value={selectedToolIds}
          onChange={handleToolSelect}
          style={{ width: '100%' }}
          allowClear
        >
          {toolList.map(tool => (
            <Select.Option key={tool.id} value={tool.id}>
              {tool.name}
            </Select.Option>
          ))}
        </Select>
        {selectedToolIds.length > 0 && (
          <div className="selected-tags">
            {(config.toolConfig || []).map((t: any) => {
              const tool = toolList.find(item => item.id === t.id);
              return tool ? (
                <Tag key={t.id} color="blue" closable onClose={() => {
                  handleToolSelect(selectedToolIds.filter(id => id !== t.id));
                }}>
                  {tool.name}
                </Tag>
              ) : null;
            })}
          </div>
        )}
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">
          <ApiOutlined style={{ marginRight: 4 }} />
          MCP (Model Context Protocol)
        </label>
        <Select
          mode="multiple"
          placeholder="选择MCP..."
          value={selectedMcpIds}
          onChange={handleMcpSelect}
          style={{ width: '100%' }}
          allowClear
        >
          {mcpList.map(mcp => (
            <Select.Option key={mcp.id} value={mcp.id}>
              {mcp.name}
            </Select.Option>
          ))}
        </Select>
        {selectedMcpIds.length > 0 && (
          <div className="selected-tags">
            {(config.mcpConfig || []).map((m: any) => {
              const mcp = mcpList.find(item => item.id === m.id);
              return mcp ? (
                <Tag key={m.id} color="purple" closable onClose={() => {
                  handleMcpSelect(selectedMcpIds.filter(id => id !== m.id));
                }}>
                  {mcp.name}
                </Tag>
              ) : null;
            })}
          </div>
        )}
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">系统提示词 (System)</label>
        <Input.TextArea
          rows={3}
          placeholder="设定 AI 的角色和行为准则..."
          value={config.systemPrompt || ''}
          onChange={e => onConfigChange('systemPrompt', e.target.value)}
        />
      </div>

      <div className="config-section">
        <label className="config-label">用户提示词 (User)</label>
        <Input.TextArea
          rows={4}
          placeholder="输入具体任务..."
          value={config.userPrompt || ''}
          onChange={e => onConfigChange('userPrompt', e.target.value)}
        />
        <div className="variable-insert">
          <VariableSelector
            variables={variables}
            onChange={data => {
              const varRef = data.nodeId ? `{{${data.nodeId}.${data.name}}}` : data.value;
              onConfigChange('userPrompt', `${config.userPrompt || ''} ${varRef}`);
            }}
            placeholder="插入变量..."
          />
        </div>
      </div>

      <Divider />

      <div className="config-section inline">
        <label className="config-label">历史消息</label>
        <InputNumber
          min={0}
          max={100}
          value={config.history ?? 0}
          onChange={val => onConfigChange('history', val)}
          addonBefore="保存"
          addonAfter="条"
        />
      </div>

      <div className="config-section inline">
        <label className="config-label">是否输出</label>
        <Switch
          checked={config.isOutput !== false}
          onChange={val => onConfigChange('isOutput', val)}
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        <div className="output-info">
          <div className="output-item">
            <span className="output-name">text</span>
            <span className="output-type">string</span>
            <span className="output-desc">回复内容</span>
          </div>
          <div className="output-item">
            <span className="output-name">stream</span>
            <span className="output-type">stream</span>
            <span className="output-desc">流式输出</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMConfig;

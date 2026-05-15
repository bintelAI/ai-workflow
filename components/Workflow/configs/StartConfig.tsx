import React, { useCallback, useMemo, useState } from 'react';
import { Input, Select, Switch, Button, Divider, Modal, Tag, Radio, Checkbox, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, BugOutlined, SettingOutlined } from '@ant-design/icons';
import type { VariableType } from '../types';
import ApprovalTableInputModal from './ApprovalTableInputModal';
import { type ApprovalInputConfig, getApprovalInputFields } from './approvalInput';
import './StartConfig.css';

interface VariableConfig {
  name: string;
  displayName: string;
  type: VariableType;
  required: boolean;
  hidden: boolean;
  defaultValue?: any;
  options?: { label: string; value: string }[];
}

const FILE_TYPE_OPTIONS = [
  { label: '文档', value: 'document' },
  { label: '图片', value: 'image' },
  { label: '音频', value: 'audio' },
  { label: '视频', value: 'video' },
  { label: '其他', value: 'other' },
];

const createDefaultValueByType = (type: VariableType) => {
  switch (type) {
    case 'number':
      return undefined;
    case 'checkbox':
      return false;
    case 'dropdown':
      return undefined;
    case 'file':
      return '';
    case 'file_list':
      return [];
    case 'paragraph':
      return '';
    case 'text':
    default:
      return '';
  }
};

const createDefaultOptions = () => [
  { label: '选项 1', value: 'option_1' },
  { label: '选项 2', value: 'option_2' },
];

interface StartConfigProps {
  config: {
    variables?: VariableConfig[];
    approvalInputConfig?: ApprovalInputConfig;
    devMode?: boolean;
    devInput?: string;
  };
  onConfigChange: (key: string, value: any) => void;
  pluginType?: string;
  teamId?: string | null;
  projectId?: string | null;
}

const VARIABLE_TYPES: { label: string; value: VariableType }[] = [
  { label: '文本', value: 'text' },
  { label: '段落', value: 'paragraph' },
  { label: '数字', value: 'number' },
  { label: '下拉选择', value: 'dropdown' },
  { label: '复选框', value: 'checkbox' },
  { label: '文件', value: 'file' },
  { label: '文件列表', value: 'file_list' },
];

const StartConfig: React.FC<StartConfigProps> = ({
  config,
  onConfigChange,
  pluginType,
  teamId,
  projectId,
}) => {
  const variables = config.variables || [];
  const isApprovalMode = pluginType === 'approval';
  const approvalInputFields = getApprovalInputFields(config.approvalInputConfig);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isApprovalInputModalOpen, setIsApprovalInputModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activePanelKey, setActivePanelKey] = useState<'basic' | 'default' | 'options' | 'permission'>('basic');

  const currentVariable = useMemo(
    () => (editingIndex !== null ? variables[editingIndex] : null),
    [editingIndex, variables]
  );

  const openCreateModal = useCallback(() => {
    const newVar: VariableConfig = {
      name: `var_${variables.length + 1}`,
      displayName: `变量 ${variables.length + 1}`,
      type: 'text',
      required: false,
      hidden: false,
    };
    onConfigChange('variables', [...variables, newVar]);
    setEditingIndex(variables.length);
    setActivePanelKey('basic');
    setIsVariableModalOpen(true);
  }, [variables, onConfigChange]);

  const openEditModal = useCallback((index: number) => {
    setEditingIndex(index);
    setActivePanelKey('basic');
    setIsVariableModalOpen(true);
  }, []);

  const closeVariableModal = useCallback(() => {
    setIsVariableModalOpen(false);
    setEditingIndex(null);
    setActivePanelKey('basic');
  }, []);

  const handleAddVariable = useCallback(() => {
    if (isApprovalMode) {
      setIsApprovalInputModalOpen(true);
      return;
    }
    openCreateModal();
  }, [isApprovalMode, openCreateModal]);

  const handleRemoveVariable = useCallback(
    (index: number) => {
      const newVars = [...variables];
      newVars.splice(index, 1);
      onConfigChange('variables', newVars);
    },
    [variables, onConfigChange]
  );

  const closeApprovalInputModal = useCallback(() => {
    setIsApprovalInputModalOpen(false);
  }, []);

  const saveApprovalInputConfig = useCallback((value: ApprovalInputConfig) => {
    onConfigChange('approvalInputConfig', value);
    closeApprovalInputModal();
  }, [closeApprovalInputModal, onConfigChange]);

  const handleVariableChange = useCallback(
    (index: number, key: keyof VariableConfig, value: any) => {
      const newVars = [...variables];
      newVars[index] = { ...newVars[index], [key]: value };
      onConfigChange('variables', newVars);
    },
    [variables, onConfigChange]
  );

  const handleVariableTypeChange = useCallback(
    (index: number, type: VariableType) => {
      const current = variables[index];
      const nextVariable: VariableConfig = {
        ...current,
        type,
        defaultValue: createDefaultValueByType(type),
      };

      if (type === 'dropdown') {
        nextVariable.options = current.options?.length ? current.options : createDefaultOptions();
      } else {
        delete nextVariable.options;
      }

      const newVars = [...variables];
      newVars[index] = nextVariable;
      onConfigChange('variables', newVars);
    },
    [variables, onConfigChange]
  );

  const handleOptionChange = useCallback(
    (index: number, optionIndex: number, key: 'label' | 'value', value: string) => {
      const newVars = [...variables];
      const nextOptions = [...(newVars[index].options || createDefaultOptions())];
      nextOptions[optionIndex] = { ...nextOptions[optionIndex], [key]: value };
      newVars[index] = { ...newVars[index], options: nextOptions };
      onConfigChange('variables', newVars);
    },
    [variables, onConfigChange]
  );

  const handleAddOption = useCallback(() => {
    if (editingIndex === null) return;
    const newVars = [...variables];
    const nextOptions = [
      ...(newVars[editingIndex].options || []),
      {
        label: `选项 ${(newVars[editingIndex].options || []).length + 1}`,
        value: `option_${(newVars[editingIndex].options || []).length + 1}`,
      },
    ];
    newVars[editingIndex] = { ...newVars[editingIndex], options: nextOptions };
    onConfigChange('variables', newVars);
  }, [editingIndex, variables, onConfigChange]);

  const handleRemoveOption = useCallback(
    (optionIndex: number) => {
      if (editingIndex === null) return;
      const newVars = [...variables];
      const nextOptions = [...(newVars[editingIndex].options || [])];
      nextOptions.splice(optionIndex, 1);
      newVars[editingIndex] = { ...newVars[editingIndex], options: nextOptions };
      onConfigChange('variables', newVars);
    },
    [editingIndex, variables, onConfigChange]
  );

  const renderDefaultValueField = useCallback(() => {
    if (!currentVariable || editingIndex === null) return null;

    switch (currentVariable.type) {
      case 'paragraph':
        return (
          <Input.TextArea
            value={currentVariable.defaultValue || ''}
            onChange={e => handleVariableChange(editingIndex, 'defaultValue', e.target.value)}
            placeholder="请输入默认内容"
            rows={4}
          />
        );
      case 'number':
        return (
          <InputNumber
            value={currentVariable.defaultValue}
            onChange={value => handleVariableChange(editingIndex, 'defaultValue', value)}
            placeholder="请输入默认数字"
            style={{ width: '100%' }}
          />
        );
      case 'checkbox':
        return (
          <Radio.Group
            value={Boolean(currentVariable.defaultValue)}
            onChange={e => handleVariableChange(editingIndex, 'defaultValue', e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '否', value: false },
              { label: '是', value: true },
            ]}
          />
        );
      case 'dropdown':
        return (
          <Select
            value={currentVariable.defaultValue}
            onChange={value => handleVariableChange(editingIndex, 'defaultValue', value)}
            placeholder="请选择默认选项"
            options={(currentVariable.options || []).map(option => ({
              label: option.label,
              value: option.value,
            }))}
          />
        );
      case 'file':
        return (
          <Input
            value={currentVariable.defaultValue || ''}
            onChange={e => handleVariableChange(editingIndex, 'defaultValue', e.target.value)}
            placeholder="请输入默认文件 URL 或标识"
          />
        );
      case 'file_list':
        return (
          <Select
            mode="tags"
            value={Array.isArray(currentVariable.defaultValue) ? currentVariable.defaultValue : []}
            onChange={value => handleVariableChange(editingIndex, 'defaultValue', value)}
            placeholder="输入默认文件 URL 或标识后回车"
          />
        );
      case 'text':
      default:
        return (
          <Input
            value={currentVariable.defaultValue || ''}
            onChange={e => handleVariableChange(editingIndex, 'defaultValue', e.target.value)}
            placeholder="请输入默认值"
          />
        );
    }
  }, [currentVariable, editingIndex, handleVariableChange]);

  return (
    <div className="start-config">
      <div className="config-section">
        <div className="start-config-header">
          <label className="config-label">{isApprovalMode ? '审批表数据入参' : '输入变量'}</label>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddVariable}
            className="add-btn"
          >
            {isApprovalMode ? '添加表数据' : '添加变量'}
          </Button>
        </div>

        {isApprovalMode && config.approvalInputConfig ? (
          <div className="variable-list">
            <div className="variable-summary-card">
              <div className="variable-summary-main">
                <div className="variable-summary-title-row">
                  <span className="variable-summary-title">
                    {config.approvalInputConfig.sheetName || config.approvalInputConfig.sheetId || '未选择表'}
                  </span>
                  <Tag color="green">多维表</Tag>
                </div>
                <div className="variable-summary-name">
                  当前项目：{config.approvalInputConfig.projectId || projectId || '-'}
                </div>
                <div className="variable-summary-tags">
                  <Tag color="blue">{approvalInputFields.length} 个字段</Tag>
                  {approvalInputFields.some(field => field.required) && (
                    <Tag color="red">
                      {approvalInputFields.filter(field => field.required).length} 个必填
                    </Tag>
                  )}
                </div>
              </div>
              <div className="variable-summary-actions">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={handleAddVariable}
                >
                  配置
                </Button>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onConfigChange('approvalInputConfig', undefined)}
                >
                  删除
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {!isApprovalMode && variables.length > 0 && (
          <div className="variable-list">
            {variables.map((v, index) => (
              <div key={index} className="variable-summary-card">
                <div className="variable-summary-main">
                  <div className="variable-summary-title-row">
                    <span className="variable-summary-title">{v.displayName || `变量 ${index + 1}`}</span>
                    <Tag color="blue">{VARIABLE_TYPES.find(item => item.value === v.type)?.label || v.type}</Tag>
                  </div>
                  <div className="variable-summary-name">变量名：{v.name || '-'}</div>
                  <div className="variable-summary-tags">
                    {v.required && <Tag color="red">必填</Tag>}
                    {v.hidden && <Tag>隐藏</Tag>}
                    {v.defaultValue ? <Tag color="gold">默认值</Tag> : null}
                  </div>
                </div>
                <div className="variable-summary-actions">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={() => openEditModal(index)}
                  >
                    配置
                  </Button>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveVariable(index)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {((isApprovalMode && !config.approvalInputConfig) || (!isApprovalMode && variables.length === 0)) && (
          <div className="empty-hint">
            {isApprovalMode
              ? '点击上方按钮选择当前项目下的表和要传递的字段'
              : '点击上方按钮添加输入变量'}
          </div>
        )}
      </div>

      <Divider />

      <Modal
        title={null}
        open={isVariableModalOpen}
        onCancel={closeVariableModal}
        onOk={closeVariableModal}
        okText="完成"
        cancelText="关闭"
        destroyOnHidden
        width={860}
        className="start-variable-modal"
      >
        {currentVariable && editingIndex !== null ? (
          <div className="variable-modal-shell">
            <div className="variable-modal-banner">
              <div>
                <div className="variable-modal-eyebrow">开始节点变量</div>
                <div className="variable-modal-title-row">
                  <h3>{currentVariable.displayName || `变量 ${editingIndex + 1}`}</h3>
                  <Tag color="blue">{VARIABLE_TYPES.find(item => item.value === currentVariable.type)?.label || currentVariable.type}</Tag>
                </div>
                <p>配置变量的展示名称、变量标识、默认值和输入限制，让运行入参更清晰。</p>
              </div>
            </div>

            <div className="variable-modal-layout">
              <aside className="variable-modal-sidebar">
                <button
                  className={`sidebar-nav-item ${activePanelKey === 'basic' ? 'active' : ''}`}
                  onClick={() => setActivePanelKey('basic')}
                >
                  <span className="sidebar-nav-title">基础信息</span>
                  <span className="sidebar-nav-desc">名称、变量名、字段类型</span>
                </button>
                <button
                  className={`sidebar-nav-item ${activePanelKey === 'default' ? 'active' : ''}`}
                  onClick={() => setActivePanelKey('default')}
                >
                  <span className="sidebar-nav-title">默认值</span>
                  <span className="sidebar-nav-desc">按字段类型展示不同输入样式</span>
                </button>
                {currentVariable.type === 'dropdown' && (
                  <button
                    className={`sidebar-nav-item ${activePanelKey === 'options' ? 'active' : ''}`}
                    onClick={() => setActivePanelKey('options')}
                  >
                    <span className="sidebar-nav-title">选项配置</span>
                    <span className="sidebar-nav-desc">维护下拉选项名称和值</span>
                  </button>
                )}
                <button
                  className={`sidebar-nav-item ${activePanelKey === 'permission' ? 'active' : ''}`}
                  onClick={() => setActivePanelKey('permission')}
                >
                  <span className="sidebar-nav-title">显示与权限</span>
                  <span className="sidebar-nav-desc">必填、隐藏、上传类型</span>
                </button>
              </aside>

              <div className="variable-modal-content">
                <div className="variable-modal-form enhanced">
                  {activePanelKey === 'basic' && (
                    <>
                      <div className="variable-modal-grid variable-modal-grid-hero">
                        <div className="form-item card-field full-width">
                          <span className="form-item-label">字段显示名称</span>
                          <Input
                            size="large"
                            value={currentVariable.displayName}
                            onChange={e => handleVariableChange(editingIndex, 'displayName', e.target.value)}
                            placeholder="例如：审批标题 / 申请人 / 附件"
                          />
                        </div>
                      </div>

                      <div className="variable-modal-grid">
                        <div className="form-item card-field">
                          <span className="form-item-label">字段变量名</span>
                          <Input
                            value={currentVariable.name}
                            onChange={e => handleVariableChange(editingIndex, 'name', e.target.value)}
                            placeholder="例如：title"
                          />
                        </div>
                        <div className="form-item card-field">
                          <span className="form-item-label">字段类型</span>
                          <Select
                            value={currentVariable.type}
                            onChange={val => handleVariableTypeChange(editingIndex, val)}
                            options={VARIABLE_TYPES}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activePanelKey === 'default' && (
                    <div className="form-item card-field full-width">
                      <div className="field-header-row">
                        <span className="form-item-label">默认值</span>
                        <span className="field-header-tip">不同字段类型会展示不同的默认值编辑方式</span>
                      </div>
                      {renderDefaultValueField()}
                    </div>
                  )}

                  {activePanelKey === 'options' && currentVariable.type === 'dropdown' && (
                    <div className="form-item card-field full-width">
                      <div className="field-header-row">
                        <span className="form-item-label">下拉选项</span>
                        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddOption}>
                          添加选项
                        </Button>
                      </div>
                      <div className="option-list">
                        {(currentVariable.options || []).map((option, optionIndex) => (
                          <div key={`${option.value}-${optionIndex}`} className="option-row">
                            <Input
                              value={option.label}
                              onChange={e => handleOptionChange(editingIndex, optionIndex, 'label', e.target.value)}
                              placeholder="选项名称"
                            />
                            <Input
                              value={option.value}
                              onChange={e => handleOptionChange(editingIndex, optionIndex, 'value', e.target.value)}
                              placeholder="选项值"
                            />
                            <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveOption(optionIndex)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activePanelKey === 'permission' && (
                    <>
                      {(currentVariable.type === 'file' || currentVariable.type === 'file_list') && (
                        <div className="form-item card-field full-width">
                          <span className="form-item-label">允许上传类型</span>
                          <Checkbox.Group options={FILE_TYPE_OPTIONS} defaultValue={['document', 'image']} />
                        </div>
                      )}

                      <div className="variable-modal-switches">
                        <div className="switch-card emphasis">
                          <div>
                            <div className="switch-title">必填</div>
                            <div className="switch-desc">开启后，流程运行时必须传入该字段。</div>
                          </div>
                          <Switch
                            checked={currentVariable.required}
                            onChange={val => handleVariableChange(editingIndex, 'required', val)}
                          />
                        </div>
                        <div className="switch-card emphasis">
                          <div>
                            <div className="switch-title">隐藏</div>
                            <div className="switch-desc">开启后，仅保留内部使用，不在简要信息中突出展示。</div>
                          </div>
                          <Switch
                            checked={currentVariable.hidden}
                            onChange={val => handleVariableChange(editingIndex, 'hidden', val)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <ApprovalTableInputModal
        open={isApprovalInputModalOpen}
        value={config.approvalInputConfig}
        teamId={teamId}
        projectId={projectId}
        onCancel={closeApprovalInputModal}
        onSave={saveApprovalInputConfig}
      />
    </div>
  );
};

export default StartConfig;

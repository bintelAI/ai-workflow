import React, { useState } from 'react';
import { Button, Tooltip, Modal, Input, message, Tag, Spin } from 'antd';
import {
  SaveOutlined,
  CloudUploadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from './store/useWorkflowStore';
import type { FlowInfoEntity } from '@/src/types/flow';
import './FlowToolbar.css';

interface FlowToolbarProps {
  onOpenFlowList?: () => void;
}

const FlowToolbar: React.FC<FlowToolbarProps> = ({ onOpenFlowList }) => {
  const {
    flowInfo,
    isFlowSaving,
    isExecuting,
    saveFlow,
    releaseFlow,
    runFlow,
    stopExecution,
    createFlow,
    nodes,
  } = useWorkflowStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowLabel, setNewFlowLabel] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');

  const handleSave = async () => {
    try {
      await saveFlow();
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handlePublish = async () => {
    try {
      await saveFlow();
      await releaseFlow();
      message.success('发布成功');
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleRun = async () => {
    try {
      await runFlow();
    } catch (error) {
      message.error('运行失败');
    }
  };

  const handleStop = () => {
    stopExecution();
    message.info('已停止执行');
  };

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) {
      message.warning('请输入流程名称');
      return;
    }

    try {
      const flow = await createFlow({
        name: newFlowName,
        label: newFlowLabel || newFlowName,
        description: newFlowDescription,
      });
      message.success('创建成功');
      setCreateModalOpen(false);
      setNewFlowName('');
      setNewFlowLabel('');
      setNewFlowDescription('');
    } catch (error) {
      message.error('创建失败');
    }
  };

  const hasNodes = nodes && nodes.length > 0;
  const hasStartNode = nodes?.some(n => n.type === 'start');

  return (
    <div className="flow-toolbar">
      <div className="toolbar-left">
        <div className="flow-info">
          {flowInfo ? (
            <>
              <span className="flow-name">{flowInfo.name}</span>
              {flowInfo.label && (
                <Tag color="blue" className="flow-tag">
                  {flowInfo.label}
                </Tag>
              )}
              {flowInfo.status === 1 && (
                <Tag color="green" className="flow-tag">
                  已发布
                </Tag>
              )}
            </>
          ) : (
            <span className="flow-name placeholder">未选择流程</span>
          )}
        </div>
      </div>

      <div className="toolbar-right">
        <Tooltip title="新建流程">
          <Button
            type="text"
            icon={<FileAddOutlined />}
            onClick={() => setCreateModalOpen(true)}
          />
        </Tooltip>

        <Tooltip title="流程列表">
          <Button
            type="text"
            icon={<FolderOpenOutlined />}
            onClick={onOpenFlowList}
          />
        </Tooltip>

        <div className="toolbar-divider" />

        <Tooltip title="保存 (Ctrl+S)">
          <Button
            type="default"
            icon={<SaveOutlined />}
            loading={isFlowSaving}
            onClick={handleSave}
            disabled={!flowInfo}
          >
            保存
          </Button>
        </Tooltip>

        <Tooltip title="发布流程">
          <Button
            type="default"
            icon={<CloudUploadOutlined />}
            onClick={handlePublish}
            disabled={!flowInfo || !hasNodes}
          >
            发布
          </Button>
        </Tooltip>

        <div className="toolbar-divider" />

        {isExecuting ? (
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={handleStop}
          >
            停止
          </Button>
        ) : (
          <Tooltip title={!hasStartNode ? '请先添加开始节点' : ''}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRun}
              disabled={!flowInfo || !hasStartNode}
            >
              运行
            </Button>
          </Tooltip>
        )}
      </div>

      <Modal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        title="新建流程"
        onOk={handleCreateFlow}
        okText="创建"
        cancelText="取消"
      >
        <div className="create-flow-form">
          <div className="form-item">
            <label>流程名称 *</label>
            <Input
              value={newFlowName}
              onChange={e => setNewFlowName(e.target.value)}
              placeholder="请输入流程名称"
            />
          </div>
          <div className="form-item">
            <label>流程标签</label>
            <Input
              value={newFlowLabel}
              onChange={e => setNewFlowLabel(e.target.value)}
              placeholder="用于API调用的唯一标识"
            />
          </div>
          <div className="form-item">
            <label>流程描述</label>
            <Input.TextArea
              value={newFlowDescription}
              onChange={e => setNewFlowDescription(e.target.value)}
              placeholder="请输入流程描述"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FlowToolbar;

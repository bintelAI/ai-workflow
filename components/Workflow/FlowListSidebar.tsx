import React, { useState, useEffect, useCallback } from 'react';
import { List, Button, Input, Modal, Tag, Empty, Spin, Popconfirm, message } from 'antd';
import {
  FolderOpenOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from './store/useWorkflowStore';
import { flowInfoApi } from '@ai-flow/src/api/flow';
import type { FlowInfoEntity } from '@ai-flow/src/types/flow';
import './FlowListSidebar.css';

interface FlowListSidebarProps {
  visible: boolean;
  onClose: () => void;
}

const FlowListSidebar: React.FC<FlowListSidebarProps> = ({ visible, onClose }) => {
  const [flowList, setFlowList] = useState<FlowInfoEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<FlowInfoEntity | null>(null);
  const [editName, setEditName] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { flowInfo, loadFlow, createFlow, updateFlow, deleteFlow, teamId } = useWorkflowStore() as any;

  useEffect(() => {
    if (visible && teamId) {
      loadFlowList();
    }
  }, [visible, teamId]);

  const loadFlowList = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const res = await flowInfoApi.page({ page: 1, size: 100, teamId });
      setFlowList(res.data.list || []);
    } catch (error) {
      console.error('Failed to load flow list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlow = async (flow: FlowInfoEntity) => {
    try {
      await loadFlow(flow.id!);
      onClose();
    } catch (error) {
      message.error('加载流程失败');
    }
  };

  const handleCreateFlow = async () => {
    try {
      const newFlow = await createFlow({
        name: '新流程',
        label: `flow_${Date.now()}`,
        description: '',
      });
      message.success('创建成功');
      loadFlowList();
      handleSelectFlow(newFlow);
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDeleteFlow = async (id: number) => {
    try {
      await deleteFlow(id);
      message.success('删除成功');
      loadFlowList();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEditFlow = (flow: FlowInfoEntity) => {
    setEditingFlow(flow);
    setEditName(flow.name || '');
    setEditLabel(flow.label || '');
    setEditDescription(flow.description || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFlow) return;
    try {
      await updateFlow({
        id: editingFlow.id,
        name: editName,
        label: editLabel,
        description: editDescription,
      });
      message.success('保存成功');
      setEditModalOpen(false);
      loadFlowList();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const filteredFlows = flowList.filter(
    flow =>
      flow.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className={`flow-list-sidebar ${visible ? 'visible' : ''}`}>
        <div className="sidebar-header">
          <div className="header-title">
            <FolderOpenOutlined />
            <span>流程列表</span>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            size="small"
          />
        </div>

        <div className="sidebar-toolbar">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索流程..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            allowClear
            size="small"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateFlow}
            size="small"
          >
            新建
          </Button>
        </div>

        <Spin spinning={loading}>
          <div className="sidebar-content">
            {filteredFlows.length === 0 ? (
              <Empty description="暂无流程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={filteredFlows}
                renderItem={flow => (
                  <List.Item
                    className={`flow-item ${flowInfo?.id === flow.id ? 'active' : ''}`}
                    onClick={() => handleSelectFlow(flow)}
                  >
                    <div className="flow-item-content">
                      <div className="flow-item-header">
                        <span className="flow-name">{flow.name}</span>
                        {flow.status === 1 ? (
                          <Tag color="green" icon={<CheckCircleOutlined />}>
                            已发布
                          </Tag>
                        ) : (
                          <Tag icon={<ClockCircleOutlined />}>
                            草稿
                          </Tag>
                        )}
                      </div>
                      <div className="flow-item-meta">
                        <span className="flow-label">{flow.label}</span>
                        {flow.description && (
                          <span className="flow-description">{flow.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flow-item-actions">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={e => {
                          e.stopPropagation();
                          handleEditFlow(flow);
                        }}
                      />
                      <Popconfirm
                        title="确定要删除此流程吗？"
                        onConfirm={e => {
                          e?.stopPropagation();
                          handleDeleteFlow(flow.id!);
                        }}
                        onCancel={e => e?.stopPropagation()}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={e => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        </Spin>
      </div>

      <Modal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        title="编辑流程"
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
      >
        <div className="edit-flow-form">
          <div className="form-item">
            <label>流程名称</label>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="请输入流程名称"
            />
          </div>
          <div className="form-item">
            <label>流程标签</label>
            <Input
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              placeholder="用于API调用的唯一标识"
            />
          </div>
          <div className="form-item">
            <label>流程描述</label>
            <Input.TextArea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="请输入流程描述"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FlowListSidebar;

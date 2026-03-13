import React, { useState, useEffect, useCallback } from 'react';
import { Select, Input, Button, Divider, Alert, Empty, Spin, Modal, Table, Tag } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ApartmentOutlined, 
  ReloadOutlined,
  CheckOutlined 
} from '@ant-design/icons';
import { InputParams, OutputParams } from './common/index';
import { flowInfoApi } from '@/src/api/flow';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { FlowField, FlowInfoEntity, FlowNode } from '@/src/types/flow';
import './LoopConfig.css';

interface LoopConfigProps {
  config: {
    inputParams?: FlowField[];
    outputParams?: FlowField[];
    flowId?: number;
    flowLabel?: string;
  };
  onConfigChange: (key: string, value: any) => void;
  variables?: Array<{
    id: string;
    type?: string;
    label?: string;
    params: FlowField[];
  }>;
}

const LoopConfig: React.FC<LoopConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
}) => {
  const teamId = useWorkflowStore(state => state.teamId)
  const [flowList, setFlowList] = useState<FlowInfoEntity[]>([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<FlowInfoEntity | null>(null);

  useEffect(() => {
    if (teamId) {
      loadFlowList();
    }
  }, [teamId]);

  useEffect(() => {
    if (config.flowId && teamId) {
      loadFlowDetail(config.flowId);
    }
  }, [config.flowId, teamId]);

  const loadFlowList = async () => {
    if (!teamId) return;
    setFlowLoading(true);
    try {
      const res = await flowInfoApi.page({ page: 1, size: 100, status: 1, teamId });
      setFlowList(res.data.list || []);
    } catch (error) {
      console.error('Failed to load flow list:', error);
    } finally {
      setFlowLoading(false);
    }
  };

  const loadFlowDetail = async (flowId: number) => {
    if (!teamId) return;
    try {
      const res = await flowInfoApi.info(flowId, teamId);
      const flow = res.data;
      setSelectedFlow(flow);
      
      const draft = flow.draft || flow.release;
      if (draft?.nodes) {
        const startNode = draft.nodes.find((n: FlowNode) => n.type === 'start');
        const endNode = draft.nodes.find((n: FlowNode) => n.type === 'end');
        
        if (startNode?.data?.inputParams) {
          onConfigChange('inputParams', startNode.data.inputParams);
        }
        if (endNode?.data?.outputParams) {
          onConfigChange('outputParams', endNode.data.outputParams);
        }
      }
    } catch (error) {
      console.error('Failed to load flow detail:', error);
    }
  };

  const handleSelectFlow = (flow: FlowInfoEntity) => {
    onConfigChange('flowId', flow.id);
    onConfigChange('flowLabel', flow.label);
    setSelectedFlowId(flow.id || null);
    setModalOpen(false);
  };

  const handleClearFlow = () => {
    onConfigChange('flowId', undefined);
    onConfigChange('flowLabel', undefined);
    onConfigChange('inputParams', []);
    onConfigChange('outputParams', []);
    setSelectedFlow(null);
    setSelectedFlowId(null);
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

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 140,
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      width: 140,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'default'}>
          {status === 1 ? '已发布' : '未发布'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: FlowInfoEntity) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSelectFlow(record)}
        >
          选择
        </Button>
      ),
    },
  ];

  return (
    <div className="loop-config">
      <Alert
        type="info"
        icon={<ApartmentOutlined />}
        message="子流程节点"
        description="调用其他已发布的流程，实现流程复用和模块化编排。"
        showIcon
        className="loop-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">选择流程</label>
        
        {config.flowId && selectedFlow ? (
          <div className="selected-flow">
            <div className="flow-info">
              <span className="flow-name">{selectedFlow.name}</span>
              <Tag color="blue">{selectedFlow.label}</Tag>
            </div>
            <div className="flow-actions">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => setModalOpen(true)}
              >
                更换
              </Button>
              <Button
                type="text"
                size="small"
                danger
                onClick={handleClearFlow}
              >
                清除
              </Button>
            </div>
          </div>
        ) : (
          <div className="empty-flow" onClick={() => setModalOpen(true)}>
            <span className="empty-text">未选择流程，</span>
            <span className="empty-action">点击选择</span>
          </div>
        )}
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输入变量</label>
        {config.flowId ? (
          <InputParams
            value={config.inputParams || []}
            onChange={handleInputParamsChange}
            variables={variables}
            editField={false}
            disabled
            placeholder="请先选择流程"
          />
        ) : (
          <Empty description="请先选择流程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">输出变量</label>
        {config.flowId ? (
          <OutputParams
            value={config.outputParams || []}
            onChange={handleOutputParamsChange}
            editField={false}
          />
        ) : (
          <Empty description="请先选择流程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title="选择流程"
        width={800}
        footer={null}
      >
        <Spin spinning={flowLoading}>
          <Table
            dataSource={flowList}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
            onRow={(record) => ({
              onDoubleClick: () => handleSelectFlow(record),
              onClick: () => setSelectedFlowId(record.id || null),
            })}
            rowClassName={(record) => 
              record.id === selectedFlowId ? 'row-selected' : ''
            }
          />
        </Spin>
      </Modal>
    </div>
  );
};

export default LoopConfig;

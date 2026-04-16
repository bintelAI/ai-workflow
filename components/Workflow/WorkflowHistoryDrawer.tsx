import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Descriptions, Drawer, Empty, Space, Spin, Table, Tag } from 'antd'
import { GitCompare, RotateCcw, ScrollText } from 'lucide-react'
import { flowInfoHistoryApi, type FlowCompareResult, type FlowInfoHistoryEntity } from '@ai-flow/src/api/flow/infoHistory'
import type { FlowInfoEntity } from '@ai-flow/src/types/flow'
import { Modal, message } from '@ai-flow/components/common/AntdStaticFunction'

interface WorkflowHistoryDrawerProps {
  open: boolean
  flowInfo: FlowInfoEntity | null
  teamId?: string | null
  onClose: () => void
  onRollbackSuccess?: () => Promise<void> | void
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

const isReleaseHistory = (record: FlowInfoHistoryEntity) => {
  return Boolean(record.releaseTime) || (record.remark || '').includes('发布')
}

const normalizeHistoryList = (payload: unknown): FlowInfoHistoryEntity[] => {
  if (Array.isArray(payload)) {
    return payload as FlowInfoHistoryEntity[]
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { list?: unknown[] }).list)) {
    return (payload as { list: FlowInfoHistoryEntity[] }).list
  }
  return []
}

const WorkflowHistoryDrawer: React.FC<WorkflowHistoryDrawerProps> = ({
  open,
  flowInfo,
  teamId,
  onClose,
  onRollbackSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [historyList, setHistoryList] = useState<FlowInfoHistoryEntity[]>([])
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<number[]>([])
  const [detailRecord, setDetailRecord] = useState<FlowInfoHistoryEntity | null>(null)
  const [compareResult, setCompareResult] = useState<FlowCompareResult | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)

  const currentFlowId = flowInfo?.id

  const loadHistory = async () => {
    if (!teamId || !currentFlowId) {
      setHistoryList([])
      return
    }

    setLoading(true)
    try {
      const res = await flowInfoHistoryApi.historyList(teamId, currentFlowId)
      setHistoryList(normalizeHistoryList(res.data))
    } catch (error) {
      console.error('Failed to load workflow history:', error)
      message.error('加载工作流历史失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setSelectedHistoryIds([])
    setCompareOpen(false)
    setCompareResult(null)
    void loadHistory()
  }, [open, currentFlowId, teamId])

  const releaseCount = useMemo(
    () => historyList.filter(record => isReleaseHistory(record)).length,
    [historyList]
  )

  const handleRollback = (record: FlowInfoHistoryEntity) => {
    if (!teamId || !currentFlowId || !record.id) return

    Modal.confirm({
      title: '确认回退',
      content: '确定要回退到此历史版本吗？系统会先自动保存当前版本到历史记录。',
      okText: '确认回退',
      cancelText: '取消',
      async onOk() {
        try {
          await flowInfoHistoryApi.rollback(teamId, currentFlowId, record.id as number)
          message.success('回退成功')
          await loadHistory()
          await onRollbackSuccess?.()
        } catch (error) {
          console.error('Failed to rollback workflow history:', error)
          message.error('回退失败')
        }
      },
    })
  }

  const handleCompare = async () => {
    if (!teamId) return
    if (selectedHistoryIds.length !== 2) {
      message.warning('请选择两个历史版本进行对比')
      return
    }
    try {
      const res = await flowInfoHistoryApi.compare(teamId, selectedHistoryIds[0], selectedHistoryIds[1])
      setCompareResult(res.data)
      setCompareOpen(true)
    } catch (error) {
      console.error('Failed to compare workflow history:', error)
      message.error('版本对比失败')
    }
  }

  const columns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 110,
      render: (value: string, record: FlowInfoHistoryEntity) => (
        <Space size={6}>
          <span>{value || '-'}</span>
          {isReleaseHistory(record) ? <Tag color="green">已发布</Tag> : null}
        </Space>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (value: string) => value || '未填写备注',
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 110,
      render: (value: string) => value || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: FlowInfoHistoryEntity) => (
        <Space size={8}>
          <Button size="small" onClick={() => setDetailRecord(record)}>
            查看
          </Button>
          <Button size="small" type="primary" ghost icon={<RotateCcw size={14} />} onClick={() => handleRollback(record)}>
            回退
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Drawer
        title="工作流历史"
        placement="right"
        size="large"
        open={open}
        onClose={onClose}
        extra={
          <Button
            icon={<GitCompare size={14} />}
            onClick={handleCompare}
            disabled={selectedHistoryIds.length !== 2}
          >
            对比版本
          </Button>
        }
      >
        <div className="space-y-4">
          <Card size="small" title="当前版本">
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="流程名称">{flowInfo?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="版本号">{flowInfo?.version || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {flowInfo?.status === 1 ? <Tag color="green">已发布</Tag> : <Tag>未发布</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">{formatDateTime(flowInfo?.releaseTime)}</Descriptions.Item>
              <Descriptions.Item label="历史条数">{historyList.length}</Descriptions.Item>
              <Descriptions.Item label="发布记录">{releaseCount}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            size="small"
            title="历史记录"
            extra={
              <Button type="link" onClick={() => void loadHistory()}>
                刷新
              </Button>
            }
          >
            <Spin spinning={loading}>
              {historyList.length ? (
                <Table
                  rowKey={record => String(record.id || record.version || record.createTime || '')}
                  size="small"
                  columns={columns}
                  dataSource={historyList}
                  pagination={{ pageSize: 8 }}
                  rowSelection={{
                    selectedRowKeys: selectedHistoryIds,
                    onChange: keys => {
                      if (keys.length <= 2) {
                        setSelectedHistoryIds(keys as number[])
                      }
                    },
                  }}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无工作流历史记录"
                />
              )}
            </Spin>
          </Card>
        </div>
      </Drawer>

      <Drawer
        title="历史详情"
        placement="right"
        size="large"
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
      >
        {detailRecord ? (
          <div className="space-y-4">
            <Card size="small">
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="版本号">{detailRecord.version || '-'}</Descriptions.Item>
                <Descriptions.Item label="备注">{detailRecord.remark || '未填写备注'}</Descriptions.Item>
                <Descriptions.Item label="操作人">{detailRecord.operatorName || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{formatDateTime(detailRecord.createTime)}</Descriptions.Item>
                <Descriptions.Item label="发布时间">{formatDateTime(detailRecord.releaseTime)}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card size="small" title="流程快照">
              <pre className="max-h-[520px] overflow-auto rounded bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                {JSON.stringify(detailRecord.data || detailRecord.draft || {}, null, 2)}
              </pre>
            </Card>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        title="版本对比"
        placement="right"
        size="large"
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      >
        {compareResult ? (
          <div className="space-y-4">
            <Card title={`版本 ${compareResult.version1.version || '-'}`} size="small">
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="时间">{formatDateTime(compareResult.version1.createTime)}</Descriptions.Item>
                <Descriptions.Item label="操作人">{compareResult.version1.operatorName || '-'}</Descriptions.Item>
              </Descriptions>
              <pre className="mt-3 max-h-72 overflow-auto rounded bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                {JSON.stringify(compareResult.version1.data || {}, null, 2)}
              </pre>
            </Card>
            <Card title={`版本 ${compareResult.version2.version || '-'}`} size="small">
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="时间">{formatDateTime(compareResult.version2.createTime)}</Descriptions.Item>
                <Descriptions.Item label="操作人">{compareResult.version2.operatorName || '-'}</Descriptions.Item>
              </Descriptions>
              <pre className="mt-3 max-h-72 overflow-auto rounded bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                {JSON.stringify(compareResult.version2.data || {}, null, 2)}
              </pre>
            </Card>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请选择两个历史版本后再对比"
          />
        )}
      </Drawer>
    </>
  )
}

export default WorkflowHistoryDrawer

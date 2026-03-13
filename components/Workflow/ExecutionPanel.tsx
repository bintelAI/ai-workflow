import React, { useRef, useEffect } from 'react';
import { Button, Empty, Tag, Collapse, Spin } from 'antd';
import {
  CloseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from './store/useWorkflowStore';
import type { ExecutionLog } from './store/modules/executionActions';
import './ExecutionPanel.css';

interface ExecutionPanelProps {
  visible: boolean;
  onClose: () => void;
}

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ visible, onClose }) => {
  const { executionLogs, isExecuting, clearExecutionLogs } = useWorkflowStore() as any;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [executionLogs]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'running':
        return <LoadingOutlined spin className="status-icon running" />;
      case 'success':
        return <CheckCircleOutlined className="status-icon success" />;
      case 'error':
        return <CloseCircleOutlined className="status-icon error" />;
      default:
        return <ClockCircleOutlined className="status-icon pending" />;
    }
  };

  const getStatusTag = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'running':
        return <Tag color="processing">运行中</Tag>;
      case 'success':
        return <Tag color="success">成功</Tag>;
      case 'error':
        return <Tag color="error">失败</Tag>;
      default:
        return <Tag color="default">等待中</Tag>;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`execution-panel ${visible ? 'visible' : ''}`}>
      <div className="panel-header">
        <div className="header-title">
          {isExecuting ? (
            <>
              <LoadingOutlined spin />
              <span>执行中...</span>
            </>
          ) : (
            <>
              <CheckCircleOutlined />
              <span>执行结果</span>
            </>
          )}
        </div>
        <div className="header-actions">
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined />}
            onClick={clearExecutionLogs}
            disabled={isExecuting}
          >
            清空
          </Button>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </div>
      </div>

      <div className="panel-content" ref={contentRef}>
        {executionLogs.length === 0 ? (
          <Empty
            description={isExecuting ? '正在启动...' : '暂无执行记录'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="log-list">
            {executionLogs.map((log: ExecutionLog, index: number) => (
              <div key={log.id || index} className={`log-item ${log.status}`}>
                <div className="log-header">
                  <div className="log-info">
                    {getStatusIcon(log.status)}
                    <span className="node-label">{log.nodeLabel}</span>
                    <span className="node-type">({log.nodeType})</span>
                    {getStatusTag(log.status)}
                  </div>
                  <div className="log-meta">
                    <span className="timestamp">{formatTimestamp(log.timestamp)}</span>
                    {log.duration > 0 && (
                      <span className="duration">{formatDuration(log.duration)}</span>
                    )}
                  </div>
                </div>

                {log.content && (
                  <div className="log-content">
                    <div className="content-header">
                      <span>输出内容</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(log.content || '')}
                      />
                    </div>
                    <pre className="content-text">{log.content}</pre>
                  </div>
                )}

                {log.output && (
                  <div className="log-output">
                    <div className="content-header">
                      <span>执行结果</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(JSON.stringify(log.output, null, 2))}
                      />
                    </div>
                    <pre className="content-text">
                      {typeof log.output === 'string'
                        ? log.output
                        : JSON.stringify(log.output, null, 2)}
                    </pre>
                  </div>
                )}

                {log.error && (
                  <div className="log-error">
                    <div className="content-header">
                      <span>错误信息</span>
                    </div>
                    <pre className="error-text">{log.error}</pre>
                  </div>
                )}
              </div>
            ))}

            {isExecuting && (
              <div className="log-item running-indicator">
                <Spin size="small" />
                <span>等待下一个节点...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="panel-footer">
        <div className="summary">
          <span>共 {executionLogs.length} 个节点</span>
          <span className="divider">|</span>
          <span className="success-count">
            成功: {executionLogs.filter((l: ExecutionLog) => l.status === 'success').length}
          </span>
          <span className="error-count">
            失败: {executionLogs.filter((l: ExecutionLog) => l.status === 'error').length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPanel;

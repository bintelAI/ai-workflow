import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Empty, Input, Modal, Radio, Select, Spin, Switch, Table } from 'antd';
import { mulApi, type WorkflowMulColumn, type WorkflowMulSheet } from '@ai-flow-src/api/mul';
import {
  APPROVAL_FIELD_PERMISSION_OPTIONS,
  type ApprovalInputConfig,
  type ApprovalInputField,
  createApprovalInputField,
  normalizeVariableName,
} from './approvalInput';

interface ApprovalTableInputModalProps {
  open: boolean;
  value?: ApprovalInputConfig;
  teamId?: string | null;
  projectId?: string | null;
  onCancel: () => void;
  onSave: (value: ApprovalInputConfig) => void;
}

const getColumnKey = (column: WorkflowMulColumn) => String(column.fieldId || column.id || '');
export const filterApprovalMulSheets = (list: WorkflowMulSheet[]) =>
  list.filter(sheet => String(sheet.type || 'sheet') === 'sheet');

const ApprovalTableInputModal: React.FC<ApprovalTableInputModalProps> = ({
  open,
  value,
  teamId,
  projectId,
  onCancel,
  onSave,
}) => {
  const [sheetLoading, setSheetLoading] = useState(false);
  const [columnLoading, setColumnLoading] = useState(false);
  const [sheets, setSheets] = useState<WorkflowMulSheet[]>([]);
  const [columns, setColumns] = useState<WorkflowMulColumn[]>([]);
  const [draftValue, setDraftValue] = useState<ApprovalInputConfig | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftValue(
      value || {
        sourceType: 'mul_table',
        projectId: projectId || '',
        sheetId: '',
        fields: [],
      }
    );
  }, [open, projectId, value]);

  useEffect(() => {
    if (!open || !projectId) {
      setSheets([]);
      return;
    }

    setSheetLoading(true);
    mulApi
      .getProjectSheets(projectId)
      .then(list => setSheets(filterApprovalMulSheets(list)))
      .catch(() => setSheets([]))
      .finally(() => setSheetLoading(false));
  }, [open, projectId]);

  useEffect(() => {
    if (!open || !teamId || !projectId || !draftValue?.sheetId) {
      setColumns([]);
      return;
    }

    setColumnLoading(true);
    mulApi
      .getSheetColumns(teamId, projectId, draftValue.sheetId)
      .then(setColumns)
      .catch(() => setColumns([]))
      .finally(() => setColumnLoading(false));
  }, [draftValue?.sheetId, open, projectId, teamId]);

  const handleSheetChange = useCallback(
    (sheetId: string) => {
      const sheet = sheets.find(item => item.sheetId === sheetId);
      setDraftValue({
        sourceType: 'mul_table',
        projectId: projectId || '',
        sheetId,
        sheetName: sheet?.name,
        fields: [],
      });
    },
    [projectId, sheets]
  );

  const handleFieldSelection = useCallback(
    (fieldIds: React.Key[]) => {
      setDraftValue(current => {
        if (!current) return current;
        const currentMap = new Map(current.fields.map(field => [field.fieldId, field]));
        const nextFields = fieldIds
          .map(fieldId => {
            const key = String(fieldId);
            const existing = currentMap.get(key);
            if (existing) return existing;
            const column = columns.find(item => getColumnKey(item) === key);
            return column ? createApprovalInputField(column) : null;
          })
          .filter(Boolean) as ApprovalInputField[];
        return {
          ...current,
          fields: nextFields,
        };
      });
    },
    [columns]
  );

  const updateField = useCallback((fieldId: string, patch: Partial<ApprovalInputField>) => {
    setDraftValue(current => {
      if (!current) return current;
      return {
        ...current,
        fields: current.fields.map(field =>
          field.fieldId === fieldId ? { ...field, ...patch } : field
        ),
      };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!draftValue || !projectId) return;
    const selectedSheet = sheets.find(item => item.sheetId === draftValue.sheetId);
      onSave({
        ...draftValue,
        sourceType: 'mul_table',
        projectId,
      sheetName: draftValue.sheetName || selectedSheet?.name,
      fields: draftValue.fields.map(field => ({
        ...field,
          variableName: normalizeVariableName(field.variableName, field.fieldId),
        })),
      });
      setDraftValue(null);
  }, [draftValue, onSave, projectId, sheets]);

  const handleCancel = useCallback(() => {
    setDraftValue(null);
    setColumns([]);
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      title="配置审批表数据入参"
      open={open}
      onCancel={handleCancel}
      onOk={handleSave}
      okText="保存入参"
      cancelText="关闭"
      width={960}
      destroyOnHidden
      okButtonProps={{
        disabled: !projectId || !draftValue?.sheetId || !draftValue.fields.length,
      }}
    >
      <div className="space-y-4">
        <Alert
          type="info"
          showIcon
          title="审批工作流只能选择当前所属项目的数据表"
          description={`当前项目：${projectId || '未识别到项目上下文，请从所属项目进入审批工作流编辑页'}`}
        />

        <Spin spinning={sheetLoading} description="正在获取当前项目的数据表...">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-item card-field">
              <span className="form-item-label">所属项目</span>
              <Input value={projectId || ''} disabled placeholder="当前审批工作流所属项目" />
            </div>
            <div className="form-item card-field">
              <span className="form-item-label">选择数据表</span>
              <Select
                loading={sheetLoading}
                value={draftValue?.sheetId || undefined}
                onChange={handleSheetChange}
                placeholder="请选择当前项目下的多维表格"
                disabled={!projectId || sheetLoading}
                notFoundContent={sheetLoading ? '正在加载...' : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前项目暂无多维表格" />}
                options={sheets.map(sheet => ({
                  label: sheet.name || sheet.sheetId,
                  value: sheet.sheetId,
                }))}
              />
              <div className="mt-1 text-xs text-slate-500">仅展示多维表格，文档、报表、画布等资源不会作为审批入参。</div>
            </div>
          </div>
        </Spin>

        <Table
          rowKey={getColumnKey}
          size="small"
          loading={columnLoading}
          dataSource={columns}
          pagination={false}
          rowSelection={{
            selectedRowKeys: (draftValue?.fields || []).map(field => field.fieldId),
            onChange: handleFieldSelection,
          }}
          columns={[
            {
              title: '字段',
              dataIndex: 'label',
              render: (_: unknown, record) => record.label || record.name || record.fieldId,
            },
            {
              title: '类型',
              dataIndex: 'type',
              width: 90,
            },
            {
              title: '变量名',
              width: 180,
              render: (_: unknown, record) => {
                const fieldId = getColumnKey(record);
                const field = draftValue?.fields.find(item => item.fieldId === fieldId);
                return field ? (
                  <Input
                    size="small"
                    value={field.variableName}
                    onChange={event =>
                      updateField(fieldId, {
                        variableName: event.target.value,
                      })
                    }
                  />
                ) : (
                  <span className="text-slate-400">选择后配置</span>
                );
              },
            },
            {
              title: '权限',
              width: 180,
              render: (_: unknown, record) => {
                const fieldId = getColumnKey(record);
                const field = draftValue?.fields.find(item => item.fieldId === fieldId);
                return field ? (
                  <Radio.Group
                    size="small"
                    value={field.permission}
                    onChange={event =>
                      updateField(fieldId, {
                        permission: event.target.value,
                      })
                    }
                    options={APPROVAL_FIELD_PERMISSION_OPTIONS}
                  />
                ) : null;
              },
            },
            {
              title: '必填',
              width: 80,
              render: (_: unknown, record) => {
                const fieldId = getColumnKey(record);
                const field = draftValue?.fields.find(item => item.fieldId === fieldId);
                return field ? (
                  <Switch
                    size="small"
                    checked={field.required}
                    onChange={checked =>
                      updateField(fieldId, {
                        required: checked,
                      })
                    }
                  />
                ) : null;
              },
            },
          ]}
        />
      </div>
    </Modal>
  );
};

export default ApprovalTableInputModal;

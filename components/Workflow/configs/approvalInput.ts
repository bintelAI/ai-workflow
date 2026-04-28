export type ApprovalFieldPermission = 'editable' | 'readonly' | 'hidden';

export interface ApprovalInputField {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  variableName: string;
  label: string;
  required: boolean;
  permission: ApprovalFieldPermission;
  includeInPayload: boolean;
}

export interface ApprovalInputConfig {
  sourceType: 'mul_table';
  projectId: string;
  projectName?: string;
  sheetId: string;
  sheetName?: string;
  fields: ApprovalInputField[];
}

export const APPROVAL_FIELD_PERMISSION_OPTIONS: Array<{
  label: string;
  value: ApprovalFieldPermission;
}> = [
  { label: '可编辑', value: 'editable' },
  { label: '只读', value: 'readonly' },
  { label: '隐藏', value: 'hidden' },
];

export const normalizeVariableName = (value: string, fallback: string) => {
  const normalized = String(value || '')
    .trim()
    .replace(/[^\w]/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
};

export const createApprovalInputField = (column: any): ApprovalInputField => {
  const fieldId = String(column?.fieldId || column?.id || '');
  const label = String(column?.label || column?.name || fieldId);
  return {
    fieldId,
    fieldName: label,
    fieldType: String(column?.type || 'text'),
    variableName: normalizeVariableName(fieldId, `field_${Date.now()}`),
    label,
    required: Boolean(column?.required),
    permission: 'editable',
    includeInPayload: true,
  };
};

export const getApprovalInputFields = (approvalInputConfig?: ApprovalInputConfig | null) => {
  return Array.isArray(approvalInputConfig?.fields)
    ? approvalInputConfig.fields.filter(field => field?.includeInPayload !== false)
    : [];
};

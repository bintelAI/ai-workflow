import React, { useCallback, useMemo } from 'react';
import { Input, Select, Divider, Alert, InputNumber, Tag } from 'antd';
import { Repeat } from 'lucide-react';
import { OutputParams } from './common/index';
import VariableSelector from './common/VariableSelector';
import type { FlowField } from '@ai-flow/src/types/flow';
import './LoopConfig.css';

interface VariableGroup {
  id: string;
  type?: string;
  label?: string;
  params: FlowField[];
}

interface LoopConfigProps {
  config: {
    targetArray?: string;
    targetArrayField?: string;
    targetArrayNodeId?: string;
    targetArrayNodeType?: string;
    targetArrayTemplate?: string;
    executionMode?: 'serial' | 'parallel';
    maxConcurrency?: number;
    outputMode?: 'all' | 'field';
    resultNodeId?: string;
    resultNodeType?: string;
    resultField?: string;
    resultTemplate?: string;
    outputParams?: FlowField[];
  };
  onConfigChange: (key: string, value: any) => void;
  variables?: VariableGroup[];
  loopBodyVariables?: VariableGroup[];
}

const LoopConfig: React.FC<LoopConfigProps> = ({
  config,
  onConfigChange,
  variables = [],
  loopBodyVariables = [],
}) => {
  const handleOutputParamsChange = useCallback(
    (params: FlowField[]) => {
      onConfigChange('outputParams', params);
    },
    [onConfigChange]
  );

  const targetArrayValue = config.targetArrayTemplate || config.targetArray || '';

  const loopInternalGroups = useMemo(
    () => loopBodyVariables,
    [loopBodyVariables]
  );

  const handleTargetArrayChange = useCallback(
    (data: {
      field: string;
      nodeId: string;
      nodeType: string;
      value: string;
      name?: string;
      template?: string;
      refPath?: string;
      label?: string;
    }) => {
      onConfigChange('targetArrayField', data.field || data.name || '');
      onConfigChange('targetArrayNodeId', data.nodeId || '');
      onConfigChange('targetArrayNodeType', data.nodeType || '');
      onConfigChange('targetArrayTemplate', data.template || data.refPath || data.value || '');
      onConfigChange('targetArray', data.template || data.refPath || data.value || '');
    },
    [onConfigChange]
  );

  const handleTargetArrayClear = useCallback(() => {
    onConfigChange('targetArrayField', '');
    onConfigChange('targetArrayNodeId', '');
    onConfigChange('targetArrayNodeType', '');
    onConfigChange('targetArrayTemplate', '');
    onConfigChange('targetArray', '');
  }, [onConfigChange]);

  const handleExecutionModeChange = useCallback(
    (value: 'serial' | 'parallel') => {
      onConfigChange('executionMode', value);
      if (value === 'serial') {
        onConfigChange('maxConcurrency', 1);
      } else if (!config.maxConcurrency || config.maxConcurrency < 1) {
        onConfigChange('maxConcurrency', 1);
      }
    },
    [config.maxConcurrency, onConfigChange]
  );

  const syncOutputParamsFromSelection = useCallback(
    (data: {
      field: string;
      name?: string;
      label?: string;
    }) => {
      const selectedField = data.field || data.name || 'result';
      const selectedGroup = loopInternalGroups.find(group => group.id === config.resultNodeId || group.params.some(param => param.field === selectedField));
      const selectedParam = selectedGroup?.params.find(param => param.field === selectedField || param.name === data.name);
      const itemType = selectedParam?.type || 'any';
      const itemLabel = selectedParam?.label || data.label || selectedField;
      onConfigChange('outputParams', [
        {
          field: 'result',
          name: 'result',
          type: 'array',
          label: `${itemLabel} 列表`,
          itemType,
          itemLabel,
        },
      ]);
    },
    [config.resultNodeId, loopInternalGroups, onConfigChange]
  );

  const handleResultFieldChange = useCallback(
    (data: {
      field: string;
      nodeId: string;
      nodeType: string;
      value: string;
      name?: string;
      template?: string;
      refPath?: string;
      label?: string;
    }) => {
      onConfigChange('resultNodeId', data.nodeId || '');
      onConfigChange('resultNodeType', data.nodeType || '');
      onConfigChange('resultField', data.field || data.name || '');
      onConfigChange('resultTemplate', data.template || data.refPath || '');
      syncOutputParamsFromSelection(data);
    },
    [onConfigChange, syncOutputParamsFromSelection]
  );

  const selectedOutputMeta = useMemo(() => {
    const group = loopInternalGroups.find(item => item.id === config.resultNodeId)
    const param = group?.params.find(item => item.field === config.resultField || item.name === config.resultField)
    return {
      nodeLabel: group?.label || '未绑定',
      field: param?.field || config.resultField || '未选择',
      type: param?.type || 'any',
      itemLabel: param?.label || config.resultField || '未选择',
    }
  }, [config.resultField, config.resultNodeId, loopInternalGroups])

  return (
    <div className="loop-config">
      <Alert
        type="info"
        icon={<Repeat className="w-4 h-4" />}
        message="循环迭代节点"
        description="参考 FastGPT 的循环节点：选择数组变量作为循环源，支持串行/并发执行，并绑定循环体输出字段作为聚合结果。"
        showIcon
        className="loop-alert"
      />

      <Divider />

      <div className="config-section">
        <label className="config-label">循环数组</label>
        <VariableSelector
          value={targetArrayValue}
          field={config.targetArrayField || ''}
          nodeId={config.targetArrayNodeId || ''}
          nodeType={config.targetArrayNodeType || ''}
          customValue=""
          variables={variables}
          inputable={false}
          placeholder="选择一个数组变量"
          onChange={handleTargetArrayChange}
          onClear={handleTargetArrayClear}
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">执行方式</label>
        <Select
          value={config.executionMode || 'serial'}
          onChange={handleExecutionModeChange}
          style={{ width: '100%' }}
          options={[
            { label: '串行', value: 'serial' },
            { label: '并发', value: 'parallel' },
          ]}
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">最大并发数</label>
        <InputNumber
          min={1}
          precision={0}
          style={{ width: '100%' }}
          value={config.executionMode === 'parallel' ? (config.maxConcurrency || 1) : 1}
          disabled={(config.executionMode || 'serial') !== 'parallel'}
          onChange={value => onConfigChange('maxConcurrency', Number(value) || 1)}
        />
      </div>

      <Divider />

      <div className="config-section">
        <label className="config-label">结果聚合方式</label>
        <Select
          value={config.outputMode || 'all'}
          onChange={value => onConfigChange('outputMode', value)}
          style={{ width: '100%' }}
          options={[
            { label: '聚合完整结果', value: 'all' },
            { label: '聚合指定字段', value: 'field' },
          ]}
        />
      </div>

      {(config.outputMode || 'all') === 'field' && (
        <>
          <Divider />
          <div className="config-section">
            <label className="config-label">循环体输出字段</label>
            {loopInternalGroups.length > 0 ? (
              <VariableSelector
                value={config.resultTemplate || config.resultField || ''}
                field={config.resultField || ''}
                nodeId={config.resultNodeId || ''}
                nodeType={config.resultNodeType || ''}
                customValue=""
                variables={loopInternalGroups}
                inputable={false}
                placeholder="选择循环体内部节点的输出字段"
                onChange={handleResultFieldChange}
                onClear={() => {
                  onConfigChange('resultNodeId', '')
                  onConfigChange('resultNodeType', '')
                  onConfigChange('resultField', '')
                  onConfigChange('resultTemplate', '')
                  onConfigChange('outputParams', [{ field: 'result', type: 'array', label: '聚合结果列表' }])
                }}
              />
            ) : (
              <Input
                value={config.resultField || ''}
                placeholder="请先在循环体中放入节点，再选择输出字段"
                onChange={e => onConfigChange('resultField', e.target.value)}
              />
            )}
          </div>

          <div className="config-section mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">输出类型预览</span>
              <Tag color="blue">array&lt;{selectedOutputMeta.type || 'any'}&gt;</Tag>
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              <div>来源节点：{selectedOutputMeta.nodeLabel}</div>
              <div>来源字段：{selectedOutputMeta.field}</div>
              <div>元素类型：{selectedOutputMeta.type}</div>
              <div>输出标签：{selectedOutputMeta.itemLabel} 列表</div>
            </div>
          </div>
        </>
      )}

      <Divider />

      <div className="config-section">
        <label className="config-label">循环节点输出</label>
        <OutputParams
          value={config.outputParams || [{ field: 'result', type: 'array', label: '聚合结果列表' }]}
          onChange={handleOutputParamsChange}
        />
      </div>
    </div>
  );
};

export default LoopConfig;

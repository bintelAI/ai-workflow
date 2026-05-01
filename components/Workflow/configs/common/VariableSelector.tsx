import React, { useState, useMemo, useEffect } from 'react';
import { Input, Button, Tooltip } from 'antd';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import type { FlowField } from '@ai-flow/src/types/flow';
import type { WorkflowVariableMeta } from '../../utils/workflowVariables';
import { resolveVariableSelection } from '../../utils/variableSelection';
import { VariableBindModal } from '../VariableBindModal';
import './VariableSelector.css';

interface VariableGroup {
  id: string;
  type?: string;
  label?: string;
  params: FlowField[];
  variables?: WorkflowVariableMeta[];
}

interface VariableSelectorProps {
  value?: string;
  field?: string;
  nodeId?: string;
  nodeType?: string;
  customValue?: string;
  onChange?: (data: {
    field: string;
    nodeId: string;
    nodeType: string;
    value: string;
    name?: string;
    template?: string;
    refPath?: string;
    label?: string;
  }) => void;
  onClear?: () => void;
  variables?: VariableGroup[];
  placeholder?: string;
  showPicker?: boolean;
  inputable?: boolean;
  disabled?: boolean;
  showSearch?: boolean;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  value = '',
  field = '',
  nodeId = '',
  nodeType = '',
  customValue = '',
  onChange,
  onClear,
  variables = [],
  placeholder = '选择变量',
  showPicker = true,
  inputable = false,
  disabled = false,
  showSearch: _showSearch = true,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(customValue);
  const [showInputDialog, setShowInputDialog] = useState(false);

  useEffect(() => {
    setInputValue(customValue);
  }, [customValue]);

  const selectedMeta = useMemo(() => {
    const directGroup = variables.find(g => g.id === nodeId)
    const directMatch = directGroup?.variables?.find(item => item.name === field || item.path === value || item.template === value)
    if (directMatch) {
      return directMatch
    }
    for (const group of variables) {
      const match = group.variables?.find(item => item.path === value || item.template === value)
      if (match) {
        return match
      }
    }
    return undefined
  }, [variables, nodeId, field, value]);

  const displayText = useMemo(() => {
    if (customValue) return customValue;
    if (selectedMeta) return `${selectedMeta.nodeLabel || selectedMeta.label} / ${selectedMeta.label}`;
    if (!nodeId && !value) return '';
    const group = variables.find(g => g.id === nodeId)
      || variables.find(g => g.variables?.some(item => item.path === value || item.template === value));
    if (group) {
      return `${group.label} / ${field || selectedMeta?.name || ''}`;
    }
    return '';
  }, [customValue, nodeId, field, value, variables, selectedMeta]);

  const handleSelect = (selectedValue: string, meta?: WorkflowVariableMeta) => {
    onChange?.(resolveVariableSelection(selectedValue, variables, meta));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  };

  const handleInputSave = () => {
    if (inputValue) {
      onChange?.({
        field: '',
        nodeId: '',
        nodeType: '',
        value: inputValue,
      });
    }
    setShowInputDialog(false);
  };

  if (!showPicker) {
    return (
      <div className="variable-selector-trigger" onClick={() => !disabled && setOpen(true)}>
        <span className="text">{displayText || placeholder}</span>
        <VariableBindModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onSelect={handleSelect}
          currentValue={value}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={`variable-selector-trigger ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
      >
        {inputable && (
          <Tooltip title="自定义输入">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              className="input-btn"
              onClick={e => {
                e.stopPropagation();
                if (!disabled) setShowInputDialog(true);
              }}
            />
          </Tooltip>
        )}
        <span className={`text ${!displayText ? 'placeholder' : ''}`}>
          {displayText || placeholder}
        </span>
        {displayText && !disabled && (
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            className="clear-btn"
            onClick={handleClear}
          />
        )}
      </div>

      <VariableBindModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
        currentValue={value}
      />

      {showInputDialog && (
        <div className="variable-input-dialog">
          <div className="dialog-mask" onClick={() => setShowInputDialog(false)} />
          <div className="dialog-content">
            <h4>自定义输入</h4>
            <Input.TextArea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              rows={6}
              placeholder="请输入内容"
            />
            <div className="dialog-footer">
              <Button onClick={() => setShowInputDialog(false)}>取消</Button>
              <Button type="primary" onClick={handleInputSave}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VariableSelector;

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Popover, Input, Button, Empty, Tooltip } from 'antd';
import { SearchOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import type { FlowField } from '@/src/types/flow';
import './VariableSelector.css';

interface VariableGroup {
  id: string;
  type?: string;
  label?: string;
  params: FlowField[];
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
  showSearch = true,
}) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [inputValue, setInputValue] = useState(customValue);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(customValue);
  }, [customValue]);

  const filteredVariables = useMemo(() => {
    if (!keyword) return variables;
    return variables
      .map(group => ({
        ...group,
        params: group.params.filter(
          p => p.field?.includes(keyword) || p.label?.includes(keyword)
        ),
      }))
      .filter(group => group.params.length > 0);
  }, [variables, keyword]);

  const displayText = useMemo(() => {
    if (customValue) return customValue;
    if (!nodeId || !field) return '';
    const group = variables.find(g => g.id === nodeId);
    if (group) {
      return `${group.label} / ${field}`;
    }
    return '';
  }, [customValue, nodeId, field, variables]);

  const handleSelect = (param: FlowField, group: VariableGroup) => {
    onChange?.({
      field: param.field || '',
      nodeId: group.id,
      nodeType: group.type || '',
      value: '',
      name: param.name || param.field,
    });
    setOpen(false);
    setKeyword('');
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
      <div className="variable-selector-trigger" onClick={() => setOpen(true)}>
        <span className="text">{displayText || placeholder}</span>
      </div>
    );
  }

  const content = (
    <div className="variable-selector-content">
      {showSearch && (
        <div className="variable-selector-search">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索变量"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            allowClear
          />
        </div>
      )}
      <div className="variable-selector-list">
        {filteredVariables.length === 0 ? (
          <Empty description="未找到匹配项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          filteredVariables.map(group => (
            <div key={group.id} className="variable-group">
              <div className="variable-group-label">{group.label}</div>
              {group.params.map(param => (
                <div
                  key={`${group.id}_${param.field}`}
                  className={`variable-item ${
                    nodeId === group.id && field === param.field ? 'active' : ''
                  }`}
                  onClick={() => handleSelect(param, group)}
                >
                  <span className="variable-icon">📋</span>
                  <span className="variable-name">{param.field}</span>
                  <span className="variable-type">{param.type || 'any'}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <Popover
        open={open}
        onOpenChange={setOpen}
        content={content}
        trigger="click"
        placement="bottomLeft"
        overlayClassName="variable-selector-popover"
        arrow={false}
      >
        <div className={`variable-selector-trigger ${disabled ? 'disabled' : ''}`}>
          {inputable && (
            <Tooltip title="自定义输入">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                className="input-btn"
                onClick={e => {
                  e.stopPropagation();
                  setShowInputDialog(true);
                }}
              />
            </Tooltip>
          )}
          <span className={`text ${!displayText ? 'placeholder' : ''}`}>
            {displayText || placeholder}
          </span>
          {displayText && (
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              className="clear-btn"
              onClick={handleClear}
            />
          )}
        </div>
      </Popover>

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

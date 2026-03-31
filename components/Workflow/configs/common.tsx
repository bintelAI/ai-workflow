import React, { useMemo, useState } from 'react'
import { Plus, Trash2, ListPlus, ChevronDown, Variable, Braces, X, Check, Search, CircleX, Info } from 'lucide-react'
import { VariableBindModal } from './VariableBindModal'
import { normalizeLegacyTemplate, parseVariableTemplate } from '../utils/workflowVariables'

// --- Helper: Flatten JSON object to dot notation ---
export const flattenObject = (obj: any, parentKey = '', res: any[] = []) => {
  if (!obj || typeof obj !== 'object') {
    return res
  }

  Object.keys(obj).forEach(key => {
    const value = obj[key]
    const propPath = parentKey ? `${parentKey}.${key}` : key
    const displayPath = `payload.${propPath}`

    let type: string = typeof value
    if (value === null) type = 'null'
    else if (Array.isArray(value)) type = 'array'

    res.push({
      label: key,
      path: displayPath,
      type: type,
      value: value,
    })

    if (type === 'object' && value !== null) {
      flattenObject(value, propPath, res)
    } else if (type === 'array' && value.length > 0) {
      // Handle array first item if it's an object for schema inference
      const firstItem = value[0]
      if (typeof firstItem === 'object' && firstItem !== null) {
        flattenObject(firstItem, `${propPath}.0`, res)
      }
    }
  })
  return res
}

// --- Variable Selector (Strict Selection - Dropdown style) ---
export interface VariableSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  scope?: 'upstream' | 'internal' | 'all'
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  value,
  onChange,
  placeholder = '选择变量...',
  scope = 'upstream',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const displayValue = normalizeLegacyTemplate(value)

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white cursor-pointer flex items-center justify-between hover:border-indigo-400 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {displayValue ? (
            <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 max-w-full">
              <Variable size={12} className="text-indigo-500 shrink-0" />
              <span className="font-mono text-indigo-600 text-xs truncate">
                {displayValue.replace(/^{{|}}$/g, '')}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className="text-slate-400 group-hover:text-indigo-500 transition-colors"
        />
      </div>

      <VariableBindModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={val => {
          onChange(val)
          setIsModalOpen(false)
        }}
        currentValue={normalizeLegacyTemplate(value)}
        scope={scope}
      />
    </>
  )
}

// --- Variable Input (Mixed Text + Variable Insertion) ---
export interface VariableInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  scope?: 'upstream' | 'internal' | 'all'
}

export const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  placeholder = '输入或插入变量...',
  className = '',
  scope = 'upstream',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const removeVariableToken = (targetToken: TemplateToken) => {
    if (targetToken.type !== 'variable' || targetToken.start === undefined || targetToken.end === undefined) {
      return
    }

    const nextCursor = targetToken.start
    const newValue = `${value.slice(0, targetToken.start)}${value.slice(targetToken.end)}`
    onChange(newValue)

    setTimeout(() => {
      const textarea = textAreaRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(nextCursor, nextCursor)
      selectionRef.current = { start: nextCursor, end: nextCursor }
      syncScroll()
    }, 0)
  }

  const findVariableTokenByRange = (start: number, end: number) => {
    return parsedTokens.find(
      token =>
        token.type === 'variable' &&
        token.start !== undefined &&
        token.end !== undefined &&
        start < token.end && end > token.start
    )
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
      return
    }

    const textarea = textAreaRef.current
    if (!textarea) return

    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0

    if (start !== end) {
      const selectedToken = findVariableTokenByRange(start, end)
      if (selectedToken) {
        event.preventDefault()
        removeVariableToken(selectedToken)
      }
      return
    }

    const targetIndex = event.key === 'Backspace' ? start - 1 : start
    if (targetIndex < 0) return

    const targetToken = parsedTokens.find(
      token =>
        token.type === 'variable' &&
        token.start !== undefined &&
        token.end !== undefined &&
        targetIndex >= token.start && targetIndex < token.end
    )

    if (targetToken) {
      event.preventDefault()
      removeVariableToken(targetToken)
    }
  }

  const handleInsert = (variable: string) => {
    // Insert at cursor position or append
    const input = inputRef.current
    if (input) {
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newValue = value.substring(0, start) + variable + value.substring(end)
      onChange(newValue)

      // Restore cursor (approximate)
      setTimeout(() => {
        input.focus()
        const newCursorPos = start + variable.length
        input.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    } else {
      onChange(value + variable)
    }
    setIsModalOpen(false)
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        ref={inputRef}
        type="text"
        className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        onClick={() => setIsModalOpen(true)}
        className="absolute right-1.5 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
        title="插入变量"
      >
        <Braces size={14} />
      </button>

      <VariableBindModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleInsert}
        currentValue={normalizeLegacyTemplate(value)}
        scope={scope}
      />
    </div>
  )
}

// --- Variable TextArea (Mixed Text + Variable Insertion) ---
export interface VariableTextAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  scope?: 'upstream' | 'internal' | 'all'
  disabled?: boolean
  stableMode?: boolean
  plainTextMode?: boolean
}

interface TemplateToken {
  type: 'text' | 'variable'
  value: string
  displayValue?: string
  start?: number
  end?: number
  scope?: 'payload' | 'global' | 'system' | 'loop' | 'node' | 'unknown'
  path?: string
}

const VARIABLE_TOKEN_REGEX = /(\$?\{\{\s*[^}]+?\s*\}\})/g

const getTokenStyleByScope = (scope?: TemplateToken['scope']) => {
  switch (scope) {
    case 'system':
      return {
        chip: 'bg-amber-100/80 text-amber-700 shadow-[inset_0_-1px_0_rgba(245,158,11,0.18)]',
        label: '系统变量',
      }
    case 'global':
    case 'payload':
      return {
        chip: 'bg-emerald-100/80 text-emerald-700 shadow-[inset_0_-1px_0_rgba(16,185,129,0.18)]',
        label: '全局变量',
      }
    case 'loop':
      return {
        chip: 'bg-fuchsia-100/80 text-fuchsia-700 shadow-[inset_0_-1px_0_rgba(217,70,239,0.18)]',
        label: '循环变量',
      }
    case 'node':
      return {
        chip: 'bg-indigo-100/80 text-indigo-700 shadow-[inset_0_-1px_0_rgba(99,102,241,0.18)]',
        label: '节点变量',
      }
    default:
      return {
        chip: 'bg-slate-100 text-slate-700 shadow-[inset_0_-1px_0_rgba(100,116,139,0.16)]',
        label: '变量',
      }
  }
}

const getTokenDisplayText = (token: TemplateToken) => {
  if (token.scope === 'node' && token.path?.startsWith('nodes.')) {
    const parts = token.path.split('.')
    if (parts.length >= 3) {
      return parts.slice(2).join('.')
    }
  }

  if (token.path) {
    return token.path.replace(/^(payload|global|system|loop|nodes\.[^.]+)\./, '')
  }

  return token.displayValue || token.value
}

const parseTemplateTokens = (value: string): TemplateToken[] => {
  if (!value) {
    return []
  }

  const tokens: TemplateToken[] = []
  let lastIndex = 0

  value.replace(VARIABLE_TOKEN_REGEX, (match, _group, offset: number) => {
    if (offset > lastIndex) {
      tokens.push({
        type: 'text',
        value: value.slice(lastIndex, offset),
        start: lastIndex,
        end: offset,
      })
    }

    const normalized = normalizeLegacyTemplate(match)
    const parsedRef = parseVariableTemplate(normalized)[0]
    const displayValue = normalized.replace(/^\{\{\s*|\s*\}\}$/g, '')

    tokens.push({
      type: 'variable',
      value: normalized,
      displayValue,
      start: offset,
      end: offset + match.length,
      scope: parsedRef?.kind,
      path: parsedRef?.path,
    })

    lastIndex = offset + match.length
    return match
  })

  if (lastIndex < value.length) {
    tokens.push({
      type: 'text',
      value: value.slice(lastIndex),
      start: lastIndex,
      end: value.length,
    })
  }

  if (tokens.length === 0) {
    return [
      {
        type: 'text',
        value,
        start: 0,
        end: value.length,
      },
    ]
  }

  return tokens
}

export const VariableTextArea: React.FC<VariableTextAreaProps> = ({
  value,
  onChange,
  placeholder = '输入或插入变量...',
  className = '',
  rows = 4,
  scope = 'upstream',
  disabled = false,
  stableMode = false,
  plainTextMode = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const selectionRef = React.useRef({ start: 0, end: 0 })

  const parsedTokens = useMemo(() => parseTemplateTokens(value), [value])

  const textAreaClassName = plainTextMode
    ? 'relative z-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-12 text-sm font-mono leading-[22px] text-slate-700 caret-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]'
    : stableMode
      ? 'relative z-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 pr-12 text-sm font-mono leading-[22px] text-transparent caret-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]'
      : 'relative z-10 w-full resize-y rounded-md border border-slate-300 bg-transparent px-3 py-2 pr-12 text-sm font-mono leading-[22px] text-transparent caret-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]'

  const overlayClassName = stableMode && !plainTextMode
    ? 'pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words rounded-md border border-transparent px-3 py-2 pr-12 text-sm font-mono leading-[22px] opacity-100'
    : 'absolute inset-0 overflow-auto whitespace-pre-wrap break-words rounded-md border border-transparent px-3 py-2 pr-12 text-sm font-mono leading-[22px]'

  const syncScroll = () => {
    const textarea = textAreaRef.current
    const overlay = overlayRef.current
    if (!textarea || !overlay) return
    overlay.scrollTop = textarea.scrollTop
    overlay.scrollLeft = textarea.scrollLeft
  }

  const rememberSelection = () => {
    const textarea = textAreaRef.current
    if (!textarea) return
    selectionRef.current = {
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0,
    }
  }

  const removeVariableToken = (targetToken: TemplateToken) => {
    if (targetToken.type !== 'variable' || targetToken.start === undefined || targetToken.end === undefined) {
      return
    }

    const nextCursor = targetToken.start
    const newValue = `${value.slice(0, targetToken.start)}${value.slice(targetToken.end)}`
    onChange(newValue)

    setTimeout(() => {
      const textarea = textAreaRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(nextCursor, nextCursor)
      selectionRef.current = { start: nextCursor, end: nextCursor }
      syncScroll()
    }, 0)
  }

  const findVariableTokenByRange = (start: number, end: number) => {
    return parsedTokens.find(
      token =>
        token.type === 'variable' &&
        token.start !== undefined &&
        token.end !== undefined &&
        start < token.end && end > token.start
    )
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
      return
    }

    const textarea = textAreaRef.current
    if (!textarea) return

    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0

    if (start !== end) {
      const selectedToken = findVariableTokenByRange(start, end)
      if (selectedToken) {
        event.preventDefault()
        removeVariableToken(selectedToken)
      }
      return
    }

    const targetIndex = event.key === 'Backspace' ? start - 1 : start
    if (targetIndex < 0) return

    const targetToken = parsedTokens.find(
      token =>
        token.type === 'variable' &&
        token.start !== undefined &&
        token.end !== undefined &&
        targetIndex >= token.start && targetIndex < token.end
    )

    if (targetToken) {
      event.preventDefault()
      removeVariableToken(targetToken)
    }
  }

  const handleInsert = (variable: string) => {
    const textarea = textAreaRef.current
    const { start, end } = textarea
      ? { start: textarea.selectionStart || 0, end: textarea.selectionEnd || 0 }
      : selectionRef.current

    const newValue = value.substring(0, start) + variable + value.substring(end)
    onChange(newValue)

    setTimeout(() => {
      if (!textarea) return
      textarea.focus()
      const newCursorPos = start + variable.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      selectionRef.current = { start: newCursorPos, end: newCursorPos }
      syncScroll()
    }, 0)

    setIsModalOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute right-2 top-2 z-20">
        <button
          type="button"
          onMouseDown={rememberSelection}
          onClick={() => !disabled && setIsModalOpen(true)}
          className="flex h-7 min-w-7 items-center justify-center rounded-full border border-indigo-200 bg-white/95 px-2 text-[11px] font-semibold text-indigo-600 shadow-sm backdrop-blur transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          title="插入变量"
          disabled={disabled}
        >
          <Braces size={12} />
        </button>
      </div>

        <div
          ref={overlayRef}
          className={overlayClassName}
          style={{ display: plainTextMode ? 'none' : undefined }}
        >
        {value ? (
          parsedTokens.map((token, index) =>
            token.type === 'variable' ? (
              (() => {
                const tokenStyle = getTokenStyleByScope(token.scope)
                return (
                  <span
                    key={`${token.value}-${index}`}
                    className={`group/token relative mx-[1px] rounded px-0.5 transition-colors duration-150 ${tokenStyle.chip}`}
                    title={`${tokenStyle.label}\n${token.path || token.displayValue || token.value}`}
                  >
                    <span className="inline-flex items-center gap-1 align-baseline">
                      <Info size={11} className="text-current opacity-55 transition-opacity group-hover/token:opacity-80" />
                      <span>{getTokenDisplayText(token)}</span>
                    </span>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={event => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                      onClick={event => {
                        event.preventDefault()
                        event.stopPropagation()
                        removeVariableToken(token)
                      }}
                      className="pointer-events-auto absolute -right-2 -top-2 hidden h-4 w-4 items-center justify-center rounded-full border border-white bg-slate-700 text-white shadow-sm transition-colors hover:bg-rose-500 group-hover/token:flex"
                      title={`删除${tokenStyle.label}`}
                    >
                      <CircleX size={12} />
                    </button>
                  </span>
                )
              })()
            ) : (
              <span key={`${token.value}-${index}`} className="text-slate-700">
                {token.value}
              </span>
            )
          )
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        </div>

      <textarea
        ref={textAreaRef}
        className={textAreaClassName}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        onClick={rememberSelection}
        onKeyUp={rememberSelection}
        onKeyDown={handleKeyDown}
        onSelect={rememberSelection}
        onBlur={rememberSelection}
        placeholder={value ? '' : placeholder}
        rows={rows}
        disabled={disabled}
      />

      <VariableBindModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleInsert}
        currentValue={normalizeLegacyTemplate(value)}
        scope={scope}
      />
    </div>
  )
}

// --- Key-Value List Editor (Dify Style) ---
export interface KeyValueEditorProps {
  items: Array<{ key: string; value: string }>
  onChange: (items: Array<{ key: string; value: string }>) => void
  title: string
  description?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  icon?: any
  addButtonLabel?: string
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items = [],
  onChange,
  title,
  description,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  icon: Icon = ListPlus,
  addButtonLabel = '添加参数',
}) => {
  const handleAdd = () => {
    onChange([...items, { key: '', value: '' }])
  }

  const handleRemove = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    onChange(newItems)
  }

  const handleChange = (index: number, field: 'key' | 'value', val: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: val }
    onChange(newItems)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
          <Icon size={12} className="text-indigo-500" />
          {title}
        </label>
        {description && <span className="text-[10px] text-slate-400">{description}</span>}
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-2 bg-slate-50 rounded border border-dashed border-slate-200">
            暂无配置
          </div>
        )}
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-start group">
            <div className="w-1/3 shrink-0">
              <input
                type="text"
                className="w-full px-2 py-2 border border-slate-300 rounded-md text-xs font-mono bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder={keyPlaceholder}
                value={item.key}
                onChange={e => handleChange(index, 'key', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-0">
              {/* Use VariableInput for mixed content support in values */}
              <VariableInput
                value={item.value}
                onChange={val => handleChange(index, 'value', val)}
                placeholder={valuePlaceholder}
                className="w-full"
              />
            </div>
            <button
              onClick={() => handleRemove(index)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded border border-dashed border-indigo-200 transition-colors"
      >
        <Plus size={12} /> {addButtonLabel}
      </button>
    </div>
  )
}

// --- MultiSelect Component ---
export interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: { label: string; value: string }[]
  placeholder?: string
  className?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  const handleRemove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== val))
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white cursor-pointer min-h-[38px] flex flex-wrap gap-1 items-center hover:border-indigo-400 hover:shadow-sm transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value.length > 0 ? (
          value.map(val => {
            const label = options.find(o => o.value === val)?.label || val
            return (
              <span
                key={val}
                className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs flex items-center gap-1 border border-indigo-100"
              >
                {label}
                <button
                  onClick={(e) => handleRemove(val, e)}
                  className="hover:text-indigo-900"
                >
                  <X size={10} />
                </button>
              </span>
            )
          })
        ) : (
          <span className="text-slate-400 text-xs">{placeholder}</span>
        )}
        <div className="ml-auto">
           <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 relative">
            <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
              placeholder="搜索..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`px-2 py-1.5 text-xs rounded cursor-pointer flex items-center justify-between ${
                    value.includes(opt.value)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span>{opt.label}</span>
                  {value.includes(opt.value) && <Check size={12} />}
                </div>
              ))
            ) : (
              <div className="px-2 py-2 text-xs text-slate-400 text-center">
                无匹配项
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Variable Parsing and Replacement System ---

/**
 * 从对象中根据路径获取值
 * @param obj 源对象
 * @param path 路径，如 "a.b.c" 或 "nodes.123.response"
 * @returns 对应的值，若路径不存在则返回undefined
 */
export const getValueByPath = (obj: any, path: string): any => {
  if (!path || !obj) return undefined

  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (current === undefined || current === null) return undefined
    current = current[part]
  }

  return current
}

/**
 * 替换字符串中的变量占位符
 * 支持格式：{{ variable.path }} 或 ${{ variable.path }}
 * @param str 包含变量占位符的字符串
 * @param context 变量上下文对象
 * @returns 替换后的字符串
 */
export const replaceVariables = (str: string, context: any): string => {
  if (!str || typeof str !== 'string') return str

  const normalized = normalizeLegacyTemplate(str)
  const variableRegex = /\$?\{\{\s*([^}]+?)\s*\}\}/g

  return normalized.replace(variableRegex, (match, variablePath) => {
    const value = getValueByPath(context, variablePath)
    return value !== undefined ? String(value) : match
  })
}

/**
 * 递归替换对象中所有字符串值的变量占位符
 * @param obj 源对象
 * @param context 变量上下文对象
 * @returns 替换后的对象
 */
export const replaceVariablesInObject = (obj: any, context: any): any => {
  if (typeof obj === 'string') {
    return replaceVariables(obj, context)
  } else if (Array.isArray(obj)) {
    return obj.map(item => replaceVariablesInObject(item, context))
  } else if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = replaceVariablesInObject(obj[key], context)
      }
    }
    return result
  }
  return obj
}

// --- AI Button Component ---
export interface AIButtonProps {
  field: string
  isConfig?: boolean
  loadingField?: string | null
  onGenerate: (field: string, isConfig: boolean) => void
}

export const AIButton: React.FC<AIButtonProps> = ({
  field,
  isConfig = false,
  loadingField,
  onGenerate,
}) => (
  <button
    onClick={() => onGenerate(field, isConfig)}
    disabled={!!loadingField}
    className="text-indigo-500 hover:text-indigo-700 p-1 rounded-md hover:bg-indigo-50 transition-colors"
  >
    {loadingField === field ? (
      <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    ) : (
      <span className="w-3.5 h-3.5 text-indigo-500">✨</span>
    )}
  </button>
)

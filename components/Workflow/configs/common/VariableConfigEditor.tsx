import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
import { VariableConfig, VariableType, VariableOption } from '../../types'

interface VariableConfigEditorProps {
  variables: VariableConfig[]
  onVariablesChange: (variables: VariableConfig[]) => void
}

interface VariableModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (variable: VariableConfig) => void
  initialVariable?: VariableConfig
}

export const VariableConfigEditor: React.FC<VariableConfigEditorProps> = ({ variables, onVariablesChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const openAddModal = () => {
    setEditingIndex(null)
    setIsModalOpen(true)
  }

  const openEditModal = (index: number) => {
    setEditingIndex(index)
    setIsModalOpen(true)
  }

  const handleDelete = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index)
    onVariablesChange(newVariables)
  }

  const handleSave = (variable: VariableConfig) => {
    let newVariables
    if (editingIndex !== null) {
      newVariables = [...variables]
      newVariables[editingIndex] = variable
    } else {
      newVariables = [...variables, variable]
    }
    onVariablesChange(newVariables)
    setIsModalOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold text-slate-700">全局变量配置</label>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={12} />
          添加变量
        </button>
      </div>

      <div className="space-y-2">
        {variables.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-xs">暂无变量配置</div>
        ) : (
          variables.map((variable, index) => (
            <div key={index} className="flex items-center justify-between p-2 border border-slate-200 rounded-md bg-slate-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700">{variable.displayName}</span>
                  <span className="text-xs text-slate-400">({variable.name})</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                    {variable.type}
                  </span>
                  {variable.required && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600">必填</span>
                  )}
                  {variable.hidden && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-300 text-slate-600">隐藏</span>
                  )}
                </div>
                {variable.defaultValue && (
                  <div className="text-xs text-slate-500 mt-1">
                    默认值: {JSON.stringify(variable.defaultValue)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(index)}
                  className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <VariableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialVariable={editingIndex !== null ? variables[editingIndex] : undefined}
      />
    </div>
  )
}

const VariableModal: React.FC<VariableModalProps> = ({ isOpen, onClose, onSave, initialVariable }) => {
  const [variable, setVariable] = useState<VariableConfig>(initialVariable || {
    name: '',
    displayName: '',
    type: 'text',
    required: false,
    hidden: false,
    allowedFileTypes: {
      document: false,
      image: false,
      audio: false,
      video: false,
      other: false,
      customExtensions: [],
    },
    uploadType: 'both',
  })

  const [options, setOptions] = useState<VariableOption[]>(initialVariable?.options || [{ label: '', value: '' }])

  // Update state when initialVariable changes (for edit mode)
  useEffect(() => {
    if (initialVariable) {
      setVariable({
        ...initialVariable,
        allowedFileTypes: initialVariable.allowedFileTypes || {
          document: false,
          image: false,
          audio: false,
          video: false,
          other: false,
          customExtensions: [],
        },
        uploadType: initialVariable.uploadType || 'both',
      })
      setOptions(initialVariable.options || [{ label: '', value: '' }])
    } else {
      // Reset to default when no initialVariable (add mode)
      setVariable({
        name: '',
        displayName: '',
        type: 'text',
        required: false,
        hidden: false,
        allowedFileTypes: {
          document: false,
          image: false,
          audio: false,
          video: false,
          other: false,
          customExtensions: [],
        },
        uploadType: 'both',
      })
      setOptions([{ label: '', value: '' }])
    }
  }, [initialVariable])

  const handleSave = () => {
    // 表单验证
    if (!variable.name.trim()) {
      alert('变量名称不能为空')
      return
    }
    if (!variable.displayName.trim()) {
      alert('显示名称不能为空')
      return
    }
    // 下拉选项验证
    if (variable.type === 'dropdown') {
      const validOptions = options.filter(opt => opt.label && opt.value)
      if (validOptions.length === 0) {
        alert('下拉选项不能为空')
        return
      }
    }
    const finalVariable = {
      ...variable,
      required: variable.required || false,
      hidden: variable.hidden || false,
      options: variable.type === 'dropdown' ? options.filter(opt => opt.label && opt.value) : undefined,
    }
    onSave(finalVariable)
  }

  const addOption = () => {
    setOptions([...options, { label: '', value: '' }])
  }

  const updateOption = (index: number, field: 'label' | 'value', value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
    }
  }

  const handleFileTypesChange = (type: keyof VariableConfig['allowedFileTypes'], checked: boolean) => {
    setVariable({
      ...variable,
      allowedFileTypes: {
        ...variable.allowedFileTypes,
        [type]: checked,
      },
    })
  }

  const handleUploadTypeChange = (type: 'local' | 'url' | 'both') => {
    setVariable({
      ...variable,
      uploadType: type,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-800 mb-3">{initialVariable ? '编辑变量' : '添加变量'}</h3>
        
        <div className="space-y-3">
          {/* 字段类型 */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">字段类型</label>
            <select
              value={variable.type}
              onChange={(e) => setVariable({ ...variable, type: e.target.value as VariableType })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="text">文本</option>
              <option value="paragraph">段落</option>
              <option value="dropdown">下拉选项</option>
              <option value="number">数字</option>
              <option value="checkbox">复选框</option>
              <option value="file">单文件</option>
              <option value="file_list">文件列表</option>
            </select>
          </div>

          {/* 变量名称 */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <span>变量名称</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={variable.name}
              onChange={(e) => setVariable({ ...variable, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="请输入变量名称（必填）"
              required
            />
          </div>

          {/* 显示名称 */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <span>显示名称</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={variable.displayName}
              onChange={(e) => setVariable({ ...variable, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="请输入显示名称（必填）"
              required
            />
          </div>

          {/* 最大长度 */}
          {(variable.type === 'text' || variable.type === 'paragraph') && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">最大长度</label>
              <input
                type="number"
                value={variable.maxLength || 48}
                onChange={(e) => setVariable({ ...variable, maxLength: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
          )}

          {/* 支持的文件类型 */}
          {(variable.type === 'file' || variable.type === 'file_list') && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">支持的文件类型</label>
              <div className="space-y-2">
                {/* 文档 */}
                <div className="flex items-center justify-between p-2 border border-slate-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <span className="text-xs">📄</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-700">文档</div>
                      <div className="text-xs text-slate-400">TXT, MD, PDF, HTML, XLSX, DOCX, CSV, etc.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={variable.allowedFileTypes?.document || false}
                    onChange={(e) => handleFileTypesChange('document', e.target.checked)}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>

                {/* 图片 */}
                <div className="flex items-center justify-between p-2 border border-slate-200 rounded-md bg-indigo-50 border-indigo-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <span className="text-xs">🖼️</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-700">图片</div>
                      <div className="text-xs text-slate-400">JPG, PNG, GIF, WEBP, SVG</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={variable.allowedFileTypes?.image || false}
                    onChange={(e) => handleFileTypesChange('image', e.target.checked)}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>

                {/* 音频 */}
                <div className="flex items-center justify-between p-2 border border-slate-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <span className="text-xs">🎵</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-700">音频</div>
                      <div className="text-xs text-slate-400">MP3, WAV, AAC, AMR, MPGA</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={variable.allowedFileTypes?.audio || false}
                    onChange={(e) => handleFileTypesChange('audio', e.target.checked)}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>

                {/* 视频 */}
                <div className="flex items-center justify-between p-2 border border-slate-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <span className="text-xs">🎬</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-700">视频</div>
                      <div className="text-xs text-slate-400">MP4, MOV, MPEG, WEBM</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={variable.allowedFileTypes?.video || false}
                    onChange={(e) => handleFileTypesChange('video', e.target.checked)}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>

                {/* 其他文件类型 */}
                <div>
                  <div className="flex items-center justify-between p-2 border border-slate-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                        <span className="text-xs">📁</span>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-700">其他文件类型</div>
                        <div className="text-xs text-slate-400">指定其他文件类型</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={variable.allowedFileTypes?.other || false}
                      onChange={(e) => handleFileTypesChange('other', e.target.checked)}
                      className="w-4 h-4 text-indigo-600"
                    />
                  </div>
                  {/* 其他文件类型输入框 */}
                  {(variable.allowedFileTypes?.other || false) && (
                    <div className="ml-7 mt-1">
                      <input
                        type="text"
                        placeholder="请输入文件后缀，多个后缀用逗号分隔（如：zip,rar,7z）"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        value={variable.allowedFileTypes?.customExtensions?.join(', ') || ''}
                        onChange={(e) => {
                          const extensions = e.target.value
                            .split(',')
                            .map(ext => ext.trim())
                            .filter(ext => ext)
                          setVariable({
                            ...variable,
                            allowedFileTypes: {
                              ...variable.allowedFileTypes,
                              customExtensions: extensions,
                            },
                          })
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 上传文件类型 */}
          {(variable.type === 'file' || variable.type === 'file_list') && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">上传文件类型</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-md text-sm transition-colors ${variable.uploadType === 'local' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  onClick={() => handleUploadTypeChange('local')}
                >
                  本地上传
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-md text-sm transition-colors ${variable.uploadType === 'url' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  onClick={() => handleUploadTypeChange('url')}
                >
                  URL
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-md text-sm transition-colors ${variable.uploadType === 'both' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  onClick={() => handleUploadTypeChange('both')}
                >
                  两者
                </button>
              </div>
            </div>
          )}

          {/* 默认值 */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">默认值</label>
            {variable.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={variable.defaultValue || false}
                onChange={(e) => setVariable({ ...variable, defaultValue: e.target.checked })}
                className="w-4 h-4 text-indigo-600"
              />
            ) : variable.type === 'number' ? (
              <input
                type="number"
                value={variable.defaultValue || ''}
                onChange={(e) => setVariable({ ...variable, defaultValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            ) : (variable.type === 'file' || variable.type === 'file_list') ? (
              <div className="space-y-2">
                {/* 本地上传 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2 px-4 rounded-md text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                    onClick={() => {
                      // 创建隐藏的文件输入框
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.multiple = variable.type === 'file_list'
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files
                        if (files) {
                          const fileList = Array.from(files).map(file => ({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            url: URL.createObjectURL(file),
                          }))
                          setVariable({
                            ...variable,
                            defaultValue: variable.type === 'file' ? fileList[0] : fileList,
                          })
                        }
                      }
                      input.click()
                    }}
                  >
                    <span className="text-xs">📁</span> 从本地上传
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 px-4 rounded-md text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                    onClick={() => {
                      const link = prompt('请输入文件链接：')
                      if (link) {
                        const file = {
                          name: link.split('/').pop() || 'file',
                          url: link,
                        }
                        setVariable({
                          ...variable,
                          defaultValue: variable.type === 'file' ? file : [file],
                        })
                      }
                    }}
                  >
                    <span className="text-xs">🔗</span> 粘贴文件链接
                  </button>
                </div>
                {/* 已上传文件预览 */}
                {variable.defaultValue && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-slate-600 mb-1">已上传文件：</div>
                    <div className="space-y-1">
                      {(Array.isArray(variable.defaultValue) ? variable.defaultValue : [variable.defaultValue]).map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <span className="text-xs">📄</span>
                            </div>
                            <div className="text-xs text-slate-700 truncate">{file.name}</div>
                          </div>
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:text-red-600"
                            onClick={() => {
                              if (variable.type === 'file') {
                                setVariable({ ...variable, defaultValue: undefined })
                              } else {
                                const newFiles = (variable.defaultValue as any[]).filter((_, i) => i !== index)
                                setVariable({ ...variable, defaultValue: newFiles })
                              }
                            }}
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={variable.defaultValue || ''}
                onChange={(e) => setVariable({ ...variable, defaultValue: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                placeholder="请输入默认值"
              />
            )}
          </div>

          {/* 下拉选项 */}
          {variable.type === 'dropdown' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">下拉选项</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                      placeholder="选项标签"
                    />
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                      placeholder="选项值"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1 text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={12} />
                  添加选项
                </button>
              </div>
            </div>
          )}

          {/* 必填 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={variable.required}
              onChange={(e) => setVariable({ ...variable, required: e.target.checked })}
              className="w-4 h-4 text-indigo-600"
            />
            <label htmlFor="required" className="text-xs font-medium text-slate-600 cursor-pointer">必填</label>
          </div>

          {/* 隐藏 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hidden"
              checked={variable.hidden}
              onChange={(e) => setVariable({ ...variable, hidden: e.target.checked })}
              className="w-4 h-4 text-indigo-600"
            />
            <label htmlFor="hidden" className="text-xs font-medium text-slate-600 cursor-pointer">隐藏</label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { TerminalSquare, ArrowRightFromLine, Code, Database } from 'lucide-react'
import { KeyValueEditor } from './common'
import { AIButton } from './common'

interface ScriptConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
  loadingField: string | null
  onAIGenerate: (field: string, isConfig: boolean) => void
}

type TabKey = 'library' | 'edit'

export const ScriptConfig: React.FC<ScriptConfigProps> = ({
  config,
  onConfigChange,
  loadingField,
  onAIGenerate,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('edit')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  const codeLibraryItems = [
    { id: 'data-transformation', name: '数据转换', language: 'javascript', code: `// 数据转换示例
const result = {
  transformed: true,
  timestamp: new Date().toISOString(),
  data: inputs.data.map(item => ({
    id: item.id,
    value: item.value * 2,
    status: 'processed'
  }))
}

return result` },
    { id: 'string-manipulation', name: '字符串处理', language: 'javascript', code: `// 字符串处理示例
const text = inputs.text || ''
const result = {
  original: text,
  uppercase: text.toUpperCase(),
  lowercase: text.toLowerCase(),
  length: text.length,
  reversed: text.split('').reverse().join('')
}

return result` },
    { id: 'array-operations', name: '数组操作', language: 'javascript', code: `// 数组操作示例
const items = inputs.items || []
const result = {
  total: items.length,
  sum: items.reduce((acc, val) => acc + val, 0),
  average: items.length > 0 ? items.reduce((acc, val) => acc + val, 0) / items.length : 0,
  max: Math.max(...items),
  min: Math.min(...items)
}

return result` },
    { id: 'date-operations', name: '日期处理', language: 'javascript', code: `// 日期处理示例
const date = new Date(inputs.date || Date.now())
const result = {
  isoString: date.toISOString(),
  timestamp: date.getTime(),
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
  weekday: date.toLocaleDateString('zh-CN', { weekday: 'long' }),
  formatted: date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
}

return result` },
    { id: 'python-data-processing', name: 'Python数据处理', language: 'python', code: `# Python数据处理示例
import json
from datetime import datetime

data = inputs.get('data', [])
result = {
    'count': len(data),
    'processed': True,
    'timestamp': datetime.now().isoformat(),
    'summary': {
        'total': sum(item.get('value', 0) for item in data),
        'average': sum(item.get('value', 0) for item in data) / len(data) if data else 0
    }
}

print(json.dumps(result, ensure_ascii=False))` },
    { id: 'python-string-ops', name: 'Python字符串操作', language: 'python', code: `# Python字符串操作示例
text = inputs.get('text', '')
result = {
    'original': text,
    'uppercase': text.upper(),
    'lowercase': text.lower(),
    'length': len(text),
    'words': len(text.split()),
    'reversed': text[::-1]
}

print(result)` },
  ]

  const handleCodeLibrarySelect = (codeId: string) => {
    const selectedItem = codeLibraryItems.find(item => item.id === codeId)
    if (selectedItem) {
      onConfigChange('code', selectedItem.code)
      onConfigChange('language', selectedItem.language)
      setSelectedTemplateId(codeId)
    }
  }

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
  }
  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
            运行环境
          </label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            value={config?.language || 'javascript'}
            onChange={e => onConfigChange('language', e.target.value)}
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
            输出字段名
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            placeholder="result"
            value={config?.outputField || 'result'}
            onChange={e => onConfigChange('outputField', e.target.value)}
          />
        </div>
      </div>

      {/* Input Variables (Dify Style) */}
      <KeyValueEditor
        title="输入变量 (Input Args)"
        description="将外部变量映射为脚本入参，代码中通过 inputs.key 调用"
        keyPlaceholder="参数名 (e.g. arg1)"
        items={config?.inputVariables || []}
        onChange={items => onConfigChange('inputVariables', items)}
        icon={ArrowRightFromLine}
      />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => handleTabChange('library')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'library' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <Database size={16} />
            代码库
          </button>
          <button
            onClick={() => handleTabChange('edit')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'edit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <Code size={16} />
            编辑
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-[200px]">
        {activeTab === 'library' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                <Database size={12} className="text-indigo-500" />
                选择代码模板
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                value={selectedTemplateId}
                onChange={e => {
                  if (e.target.value) {
                    handleCodeLibrarySelect(e.target.value)
                  }
                }}
              >
                <option value="">-- 选择代码模板 --</option>
                <optgroup label="JavaScript">
                  {codeLibraryItems.filter(item => item.language === 'javascript').map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Python">
                  {codeLibraryItems.filter(item => item.language === 'python').map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <p className="text-xs text-indigo-700 mb-2">
                <strong>提示：</strong>选择代码模板后，会自动填充到编辑器中，您可以根据需要进行修改。
              </p>
              <p className="text-xs text-indigo-600">
                可用模板：数据转换、字符串处理、数组操作、日期处理等
              </p>
            </div>

            {config?.code && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                  <TerminalSquare size={12} className="text-indigo-500" />
                  当前代码预览
                </label>
                <div className="bg-slate-900 rounded-md p-3 overflow-x-auto">
                  <pre className="text-xs text-slate-50 font-mono whitespace-pre-wrap">
                    {config.code}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <TerminalSquare size={12} className="text-indigo-500" />
                代码逻辑
              </label>
              <AIButton field="code" isConfig loadingField={loadingField} onGenerate={onAIGenerate} />
            </div>
            <textarea
              className="w-full flex-1 px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-slate-900 text-slate-50 resize-y"
              placeholder="// Access inputs via `inputs.argName`"
              value={config?.code || ''}
              onChange={e => onConfigChange('code', e.target.value)}
              rows={10}
            />
          </div>
        )}
      </div>
    </div>
  )
}

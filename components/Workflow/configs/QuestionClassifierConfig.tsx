import React from 'react'
import { Plus, Trash2, HelpCircle } from 'lucide-react'
import { VariableSelector } from './common'
import { QuestionClassifierConfig as IQuestionClassifierConfig, QuestionClassifierCategory } from '../types'

interface QuestionClassifierConfigProps {
  config: IQuestionClassifierConfig
  onConfigChange: (key: string, value: any) => void
}

export const QuestionClassifierConfig: React.FC<QuestionClassifierConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const categories = config?.categories || []

  const handleAddCategory = () => {
    const newCategory: QuestionClassifierCategory = {
      id: `category_${Date.now()}`,
      name: `分类 ${categories.length + 1}`,
      description: '',
    }
    onConfigChange('categories', [...categories, newCategory])
  }

  const handleRemoveCategory = (id: string) => {
    onConfigChange('categories', categories.filter(c => c.id !== id))
  }

  const handleUpdateCategory = (id: string, updates: Partial<QuestionClassifierCategory>) => {
    onConfigChange(
      'categories',
      categories.map(c => (c.id === id ? { ...c, ...updates } : c))
    )
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          模型选择
        </label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          value={config?.model || 'gpt-4'}
          onChange={e => onConfigChange('model', e.target.value)}
        >
          <option value="gpt-4">GPT-4 Turbo</option>
          <option value="gpt-3.5">GPT-3.5 Turbo</option>
          <option value="claude-3">Claude 3 Opus</option>
          <option value="gemini-pro">Gemini Pro</option>
        </select>
      </div>

      {/* Input Variable */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          输入变量
        </label>
        <div className="flex flex-col gap-2">
          <div className="w-full">
            <VariableSelector
              value={config?.inputVariable || ''}
              onChange={val => onConfigChange('inputVariable', val)}
              placeholder="选择需要分类的变量..."
            />
          </div>
          <p className="text-[10px] text-slate-400">
            AI 将根据此变量的内容进行分类。
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            分类配置
          </label>
          <button
            onClick={handleAddCategory}
            className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-md transition-colors"
            title="添加分类"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 w-5 h-5 flex items-center justify-center rounded-full">
                  {index + 1}
                </span>
                <input
                  type="text"
                  className="flex-1 px-2 py-1 text-xs border border-transparent hover:border-slate-300 focus:border-indigo-500 bg-transparent focus:bg-white rounded outline-none font-medium"
                  value={category.name}
                  onChange={e => handleUpdateCategory(category.id, { name: e.target.value })}
                  placeholder="分类名称"
                />
                <button
                  onClick={() => handleRemoveCategory(category.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                className="w-full px-2 py-1.5 text-[11px] border border-transparent hover:border-slate-300 focus:border-indigo-500 bg-transparent focus:bg-white rounded outline-none resize-none"
                rows={2}
                value={category.description}
                onChange={e => handleUpdateCategory(category.id, { description: e.target.value })}
                placeholder="描述该分类的特征，帮助 AI 准确识别..."
              />
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
              <p className="text-xs text-slate-400">暂无分类，请点击上方按钮添加</p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-3">
          <HelpCircle size={12} />
          <span>分类逻辑说明</span>
        </div>
        <div className="text-[10px] text-slate-500 space-y-1.5 leading-relaxed">
          <p>• 系统将自动构建提示词，要求 AI 将输入内容匹配到上述分类之一。</p>
          <p>• 每个分类都有一个对应的输出锚点，可连接到后续不同的流程。</p>
          <p>• 如果 AI 无法匹配任何分类，将默认走“其他”分支。</p>
        </div>
      </div>
    </div>
  )
}

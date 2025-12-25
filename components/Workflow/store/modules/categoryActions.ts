import { WorkflowCategory } from '../../types'

const DEFAULT_CATEGORIES: WorkflowCategory[] = [
  {
    id: 'general',
    name: '全功能模式',
    description: '包含所有可用节点，适用于复杂混合场景。',
    isSystem: true,
    allowedNodeTypes: [],
  },
  {
    id: 'business_approval',
    name: '行政审批流 (BPM)',
    description: '专注于OA审批、报销、请假等业务流程。屏蔽技术性节点。',
    isSystem: true,
    allowedNodeTypes: [],
  },
  {
    id: 'ai_agent',
    name: 'AI Agent 编排',
    description: '专注于 LLM 调用、数据处理和 API 集成。屏蔽人工审批节点。',
    isSystem: true,
    allowedNodeTypes: [],
  },
]

export interface CategoryActions {
  setActiveCategory: (categoryId: string) => void
  addCategory: (category: WorkflowCategory) => void
  updateCategory: (categoryId: string, updates: Partial<WorkflowCategory>) => void
  deleteCategory: (categoryId: string) => void
  toggleSettings: (isOpen?: boolean) => void
}

export const createCategoryActions = (set: any, get: any): CategoryActions => ({
  setActiveCategory: (categoryId: string) => {
    set({ activeCategoryId: categoryId })
  },

  addCategory: (category: WorkflowCategory) => {
    set((state: any) => ({
      categories: [...state.categories, category],
    }))
  },

  updateCategory: (categoryId: string, updates: Partial<WorkflowCategory>) => {
    set((state: any) => ({
      categories: state.categories.map((cat: WorkflowCategory) =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ),
    }))
  },

  deleteCategory: (categoryId: string) => {
    set((state: any) => ({
      categories: state.categories.filter((cat: WorkflowCategory) => cat.id !== categoryId),
      activeCategoryId: state.activeCategoryId === categoryId ? 'general' : state.activeCategoryId,
    }))
  },

  toggleSettings: (isOpen?: boolean) =>
    set((state: any) => ({
      isSettingsOpen: isOpen !== undefined ? isOpen : !state.isSettingsOpen,
    })),
})

export { DEFAULT_CATEGORIES }

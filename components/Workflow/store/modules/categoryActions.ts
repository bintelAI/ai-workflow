import { WorkflowCategory } from '../../types'
import { getDefaultCategoriesFromPluginModes } from '../../config/pluginModeRegistry'

const DEFAULT_CATEGORIES: WorkflowCategory[] = getDefaultCategoriesFromPluginModes()

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

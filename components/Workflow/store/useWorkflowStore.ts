import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { WorkflowStoreState, WorkflowNode, WorkflowEdge, WorkflowNodeType, WorkflowCategory } from '../types'
import {
  createNodeActions,
  createEdgeActions,
  createMenuActions,
  createSimulationActions,
  createCategoryActions,
  createNodeOutputActions,
  createAIActions,
  createFlowActions,
  createExecutionActions,
  createLayoutActions,
  DEFAULT_CATEGORIES,
} from './modules'
import { getDefaultCategoriesFromPluginModes } from '../config/pluginModeRegistry'
import { DEFAULT_DEV_INPUT } from '../config/defaultDevInput'

const initialNodes: WorkflowNode[] = [
  {
    id: '1',
    type: WorkflowNodeType.START,
    position: { x: 250, y: 50 },
    data: {
      label: '流程开始',
      description: 'Webhook 触发',
      config: {
        devMode: true,
        devInput: DEFAULT_DEV_INPUT,
      },
    },
  },
]

const initialEdges: WorkflowEdge[] = []

const normalizePersistedCategories = (persistedCategories?: WorkflowCategory[]) => {
  const systemCategories = getDefaultCategoriesFromPluginModes()
  const customCategories = (persistedCategories || []).filter(category => !category.isSystem)
  return [...systemCategories, ...customCategories]
}

const normalizeActiveCategoryId = (activeCategoryId?: string | null, categories: WorkflowCategory[] = DEFAULT_CATEGORIES) => {
  if (activeCategoryId && categories.some(category => category.id === activeCategoryId)) {
    return activeCategoryId
  }
  return 'general'
}

export const useWorkflowStore = create<WorkflowStoreState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: null,
      edgeMenu: {
        isOpen: false,
        edgeId: null,
        position: null,
        sourceId: null,
        targetId: null,
      },
      nodeMenu: {
        isOpen: false,
        sourceNodeId: null,
        position: null,
        parentNodeId: null,
      },
      isDrawerOpen: false,
      simulationLogs: [],
      nodeExecutionStatus: {},
      isAIGenerating: false,
      nodeOutputs: {},
      isSettingsOpen: false,
      isGlobalConfigOpen: false,
      globalVariables: [],
      categories: DEFAULT_CATEGORIES,
      activeCategoryId: 'general',
      teamId: (() => {
        const stored = localStorage.getItem('workflow_teamId')
        return stored || null
      })(),

      ...createNodeActions(set, get),
      ...createEdgeActions(set, get),
      ...createMenuActions(set, get),
      ...createSimulationActions(set, get),
      ...createCategoryActions(set, get),
      ...createNodeOutputActions(set, get),
      ...createAIActions(set, get),
      ...createFlowActions(set, get),
      ...createExecutionActions(set, get),
      ...createLayoutActions(set, get, {}),

      toggleGlobalConfig: (isOpen?: boolean) => {
        set(state => ({
          isGlobalConfigOpen: isOpen !== undefined ? isOpen : !state.isGlobalConfigOpen,
        }))
      },
      setGlobalVariables: (variables) => {
        set({ globalVariables: variables })
      },
    }),
    {
      name: 'workflow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        nodes: state.nodes,
        edges: state.edges,
        categories: state.categories,
        activeCategoryId: state.activeCategoryId,
        globalVariables: state.globalVariables,
        teamId: state.teamId,
        flowSchemaVersion: state.flowSchemaVersion,
      }),
      merge: (persistedState: any, currentState) => {
        const persisted = persistedState || {}
        const categories = normalizePersistedCategories(persisted.categories)
        return {
          ...currentState,
          ...persisted,
          categories,
          activeCategoryId: normalizeActiveCategoryId(persisted.activeCategoryId, categories),
          flowSchemaVersion:
            persisted.flowSchemaVersion === 2
              ? 2
              : Object.prototype.hasOwnProperty.call(persisted, 'nodes')
                ? null
                : currentState.flowSchemaVersion,
        }
      },
    }
  )
)

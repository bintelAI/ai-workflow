import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { WorkflowStoreState, WorkflowNode, WorkflowEdge } from '../../../types'
import {
  createNodeActions,
  createEdgeActions,
  createMenuActions,
  createSimulationActions,
  createCategoryActions,
  createNodeOutputActions,
  createAIActions,
  DEFAULT_CATEGORIES,
} from './modules'

export const DEFAULT_DEV_INPUT = JSON.stringify(
  {
    order_id: 'ORD-2024-001',
    amount: 8500,
    currency: 'CNY',
    requester: {
      id: 'U-8821',
      name: 'Alex Chen',
      department: 'Engineering',
    },
    items: [
      { name: 'Server License', price: 4000 },
      { name: 'Cloud Credits', price: 4500 },
    ],
  },
  null,
  2
)

const initialNodes: WorkflowNode[] = [
  {
    id: '1',
    type: 'START',
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
      categories: DEFAULT_CATEGORIES,
      activeCategoryId: 'general',

      ...createNodeActions(set, get),
      ...createEdgeActions(set, get),
      ...createMenuActions(set, get),
      ...createSimulationActions(set, get),
      ...createCategoryActions(set, get),
      ...createNodeOutputActions(set, get),
      ...createAIActions(set, get),
    }),
    {
      name: 'workflow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        nodes: state.nodes,
        edges: state.edges,
        categories: state.categories,
        activeCategoryId: state.activeCategoryId,
      }),
    }
  )
)

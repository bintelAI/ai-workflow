import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from '../../../../types'

const DEFAULT_DEV_INPUT = JSON.stringify(
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

const initialNodes = [
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

const initialEdges: any[] = []

export interface AIActions {
  generateWorkflowFromPrompt: (prompt: string) => Promise<void>
  setWorkflow: (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    activeCategoryId?: string,
    categories?: any[]
  ) => void
  aiAutocompleteConfig: (field: string, context: string) => Promise<string>
}

export const createAIActions = (set: any, get: any): AIActions => ({
  generateWorkflowFromPrompt: async (prompt: string) => {
    set({ isAIGenerating: true })

    try {
      const apiKey = (process.env as any).GEMINI_API_KEY || ''

      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        await new Promise(resolve => setTimeout(resolve, 1000))

        const newNodes = [
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
          {
            id: '2',
            type: WorkflowNodeType.CONDITION,
            position: { x: 250, y: 200 },
            data: {
              label: '条件判断',
              description: '判断是否需要审批',
              config: {
                expression: 'amount > 1000',
                conditionGroups: [],
              },
            },
          },
          {
            id: '3',
            type: WorkflowNodeType.APPROVAL,
            position: { x: 450, y: 350 },
            data: {
              label: '审批节点',
              description: '经理审批',
              config: {
                approver: 'manager',
                approvalType: 'single',
                formTitle: '费用审批单',
              },
            },
          },
          {
            id: '4',
            type: WorkflowNodeType.NOTIFICATION,
            position: { x: 50, y: 350 },
            data: {
              label: '通知节点',
              description: '发送通知',
              config: {
                channel: 'feishu',
                recipients: 'requester',
              },
            },
          },
          {
            id: '5',
            type: WorkflowNodeType.END,
            position: { x: 250, y: 500 },
            data: {
              label: '流程结束',
              description: '工作流结束',
            },
          },
        ]

        const newEdges = [
          {
            id: 'e1-2',
            source: '1',
            target: '2',
            type: 'custom',
            animated: true,
            markerEnd: { type: 'arrowclosed' },
          },
          {
            id: 'e2-3',
            source: '2',
            target: '3',
            sourceHandle: 'true',
            type: 'custom',
            animated: true,
            markerEnd: { type: 'arrowclosed' },
          },
          {
            id: 'e2-4',
            source: '2',
            target: '4',
            sourceHandle: 'false',
            type: 'custom',
            animated: true,
            markerEnd: { type: 'arrowclosed' },
          },
          {
            id: 'e3-5',
            source: '3',
            target: '5',
            type: 'custom',
            animated: true,
            markerEnd: { type: 'arrowclosed' },
          },
          {
            id: 'e4-5',
            source: '4',
            target: '5',
            type: 'custom',
            animated: true,
            markerEnd: { type: 'arrowclosed' },
          },
        ]

        set({ nodes: newNodes, edges: newEdges })
      } else {
        const response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `根据用户需求生成工作流配置，返回JSON格式。用户需求：${prompt}\n\n可用节点类型：${Object.values(WorkflowNodeType).join(', ')}\n\n返回格式：{"nodes": [...], "edges": [...]}`,
                    },
                  ],
                },
              ],
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          const generatedContent = data.candidates[0].content.parts[0].text

          const workflowConfig = JSON.parse(generatedContent)
          if (workflowConfig.nodes && workflowConfig.edges) {
            set({ nodes: workflowConfig.nodes, edges: workflowConfig.edges })
          }
        }
      }
    } catch (error) {
      console.error('生成工作流失败:', error)
      set({
        nodes: initialNodes,
        edges: initialEdges,
      })
    } finally {
      set({ isAIGenerating: false })
    }
  },

  setWorkflow: (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    activeCategoryId?: string,
    categories?: any[]
  ) => {
    set((state: any) => ({
      nodes,
      edges,
      activeCategoryId: activeCategoryId || state.activeCategoryId,
      categories: categories || state.categories,
    }))
  },
})

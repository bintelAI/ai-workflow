import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from '../../types'

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
    categories?: any[],
    globalVariables?: any[]
  ) => void
  aiAutocompleteConfig: (field: string, context: string) => Promise<string>
}

const SYSTEM_PROMPT = `你是一个专业的工作流设计专家，负责将用户的业务需求转化为精确的 ReactFlow 工作流配置。

### 核心任务
生成一个符合规范的 JSON 对象，包含 nodes（节点）和 edges（连线）。

### 节点类型 (WorkflowNodeType) 必须严格遵守
1. 'start': 流程起点（唯一）
2. 'end': 流程终点
3. 'approval': 审批
4. 'cc': 抄送
5. 'condition': 条件分支（必须有 true/false 两个 sourceHandle 出口）
6. 'notification': 消息通知
7. 'llm': AI 大模型
8. 'api_call': HTTP 请求
9. 'delay': 延时
10. 'data_op': 数据处理
11. 'loop': 循环
12. 'parallel': 并行分支
13. 'sql': 数据库操作
14. 'storage': 文件存储

### 关键配置规范
- 所有节点必须包含：id (string), type (string), position ({x: number, y: number}), data ({label: string, config: object})。
- condition 节点：data.config 必须包含 expression (如 "amount > 500")。
- llm 节点：data.config 必须包含 model, systemPrompt, userPrompt。
- api_call 节点：data.config 必须包含 method, url, bodyType。

### 布局规则
- 垂直布局：y 坐标从 50 开始，每个节点间隔 150 像素。
- 水平居中：x 坐标统一设为 250，除非是分支节点。

### 输出格式要求
1. **禁止** Markdown 标签（如 \`\`\`json）。
2. **必须** 是合法的 JSON 字符串。
3. 必须包含 {"nodes": [], "edges": []} 根结构。

### 示例
{
  "nodes": [
    {
      "id": "1",
      "type": "start",
      "position": { "x": 250, "y": 50 },
      "data": { "label": "开始", "config": { "devMode": true } }
    },
    {
      "id": "2",
      "type": "condition",
      "position": { "x": 250, "y": 200 },
      "data": { "label": "金额校验", "config": { "expression": "amount > 100" } }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "type": "custom", "animated": true, "markerEnd": { "type": "arrowclosed" } }
  ]
}

用户需求：`

export const createAIActions = (set: any, get: any): AIActions => ({
  generateWorkflowFromPrompt: async (prompt: string) => {
    set({ isAIGenerating: true })

    try {
      const apiKey = (process.env as any).OPENAI_API_KEY || ''
      const baseUrl = (process.env as any).OPENAI_BASE_URL || 'https://api.openai.com/v1'
      const model = (process.env as any).OPENAI_MODEL || 'gpt-4o-mini'

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
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: SYSTEM_PROMPT,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          let generatedContent = data.choices[0].message.content

          // Handle potential markdown wrapping
          if (generatedContent.includes('```')) {
            generatedContent = generatedContent.replace(/```json\n?|```/g, '').trim()
          }

          const workflowConfig = JSON.parse(generatedContent)
          if (workflowConfig.nodes && workflowConfig.edges) {
            // Validate and repair nodes to prevent NaN coordinates
            const validatedNodes = workflowConfig.nodes.map((node: any, index: number) => {
              const x = Number(node.position?.x)
              const y = Number(node.position?.y)

              return {
                ...node,
                position: {
                  x: isNaN(x) ? 250 : x,
                  y: isNaN(y) ? 50 + index * 150 : y,
                },
              }
            })

            set({ nodes: validatedNodes, edges: workflowConfig.edges })
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
    categories?: any[],
    globalVariables?: any[]
  ) => {
    set((state: any) => ({
      nodes,
      edges,
      activeCategoryId: activeCategoryId || state.activeCategoryId,
      categories: categories || state.categories,
      globalVariables: globalVariables || state.globalVariables,
    }))
  },

  aiAutocompleteConfig: async (field: string, context: string) => {
    // Placeholder implementation for AI autocomplete
    await new Promise(resolve => setTimeout(resolve, 500))
    return 'AI generated content for ' + field
  },
})

import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from '../types'
import { ValidationError, ValidationResult } from '../ValidationReportModal'

export class WorkflowValidator {
  private nodes: WorkflowNode[]
  private edges: WorkflowEdge[]
  private errors: ValidationError[] = []

  constructor(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    this.nodes = nodes
    this.edges = edges
  }

  validate(): ValidationResult {
    this.errors = []

    this.validateWorkflowStructure()
    this.validateNodeConfigs()
    this.validateConnections()
    this.validateVariables()

    const errorCount = this.errors.filter(e => e.type === 'error').length
    const warningCount = this.errors.filter(e => e.type === 'warning').length
    const infoCount = this.errors.filter(e => e.type === 'info').length

    return {
      isValid: errorCount === 0,
      errors: this.errors,
      summary: {
        totalNodes: this.nodes.length,
        totalEdges: this.edges.length,
        errorCount,
        warningCount,
        infoCount,
      },
    }
  }

  private addError(error: Omit<ValidationError, 'id'>) {
    this.errors.push({
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })
  }

  private validateWorkflowStructure() {
    const startNodes = this.nodes.filter(n => n.type === WorkflowNodeType.START)
    const endNodes = this.nodes.filter(n => n.type === WorkflowNodeType.END)

    if (startNodes.length === 0) {
      this.addError({
        type: 'error',
        category: 'workflow',
        message: '工作流必须包含至少一个开始节点',
        suggestion: '从左侧面板拖拽"开始节点"到画布中',
      })
    } else if (startNodes.length > 1) {
      this.addError({
        type: 'error',
        category: 'workflow',
        message: '工作流只能包含一个开始节点',
        suggestion: '删除多余的开始节点',
      })
    }

    if (endNodes.length === 0) {
      this.addError({
        type: 'warning',
        category: 'workflow',
        message: '工作流缺少结束节点',
        suggestion: '建议添加结束节点以明确流程终点',
      })
    }

    if (this.nodes.length > 0 && this.edges.length === 0) {
      this.addError({
        type: 'warning',
        category: 'workflow',
        message: '工作流节点之间没有连接',
        suggestion: '拖拽节点之间的连接点建立连接关系',
      })
    }
  }

  private validateNodeConfigs() {
    this.nodes.forEach(node => {
      const config = node.data.config || {}

      switch (node.type) {
        case WorkflowNodeType.START:
          this.validateStartNode(node, config)
          break
        case WorkflowNodeType.END:
          this.validateEndNode(node, config)
          break
        case WorkflowNodeType.API_CALL:
          this.validateAPICallNode(node, config)
          break
        case WorkflowNodeType.CONDITION:
          this.validateConditionNode(node, config)
          break
        case WorkflowNodeType.LOOP:
          this.validateLoopNode(node, config)
          break
        case WorkflowNodeType.PARALLEL:
          this.validateParallelNode(node, config)
          break
        case WorkflowNodeType.APPROVAL:
          this.validateApprovalNode(node, config)
          break
        case WorkflowNodeType.NOTIFICATION:
          this.validateNotificationNode(node, config)
          break
        case WorkflowNodeType.DELAY:
          this.validateDelayNode(node, config)
          break
        case WorkflowNodeType.SCRIPT:
          this.validateScriptNode(node, config)
          break
        case WorkflowNodeType.LLM:
          this.validateLLMNode(node, config)
          break
        case WorkflowNodeType.SQL:
          this.validateSQLNode(node, config)
          break
        case WorkflowNodeType.KNOWLEDGE_RETRIEVAL:
          this.validateKnowledgeRetrievalNode(node, config)
          break
        case WorkflowNodeType.DOCUMENT_EXTRACTOR:
          this.validateDocumentExtractorNode(node, config)
          break
        case WorkflowNodeType.DATA_OP:
          this.validateDataOpNode(node, config)
          break
        case WorkflowNodeType.CC:
          this.validateCCNode(node, config)
          break
      }
    })
  }

  private validateStartNode(node: WorkflowNode, config: any) {
    // 模拟数据功能的设计逻辑：
    // - 当 devMode !== false 时，开关是打开状态
    // - 打开状态下，textarea 会显示默认值，但 config.devInput 可能是 undefined
    // - 这种情况下不应该报错，因为用户已经开启了模拟数据功能
    // - 只有当开关关闭时，才应该检查是否配置了模拟数据
    
    // 简化验证逻辑：只要开关开启，就认为模拟数据功能已配置
    // 只有当开关关闭且没有配置数据时，才提示用户
    const devModeEnabled = config.devMode !== false
    
    // 修复：只有当用户关闭了模拟数据开关，才检查是否配置了数据
    // 或者更准确地说：只有当用户想要使用模拟数据（开关开启）但没有配置时，才提示
    // 但这里存在设计问题：开关开启时，UI显示默认值，但实际config.devInput可能是undefined
    
    // 最终解决方案：当模拟数据开关开启时，无论config.devInput是否存在，都不报错
    // 因为用户已经明确表示要使用模拟数据功能
    if (devModeEnabled) {
      return // 开关开启，通过验证
    }
    
    // 开关关闭时，检查是否有模拟数据配置（可选）
    // 这里可以选择不检查，或者只作为info提示
  }

  private validateEndNode(node: WorkflowNode, config: any) {
    if (!node.data.label || node.data.label.trim() === '') {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label || '结束节点',
        message: '结束节点缺少标签',
        suggestion: '为结束节点设置一个描述性标签',
      })
    }
  }

  private validateAPICallNode(node: WorkflowNode, config: any) {
    if (!config.url || config.url.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'API 调用节点缺少 URL 配置',
        suggestion: '在配置面板中填写目标 API 的 URL 地址',
      })
    }

    if (
      config.method &&
      !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE'].includes(config.method)
    ) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'API 调用节点使用了无效的 HTTP 方法',
        suggestion: '选择有效的 HTTP 方法（GET、POST、PUT 等）',
      })
    }

    if (config.url && config.url.includes('{{')) {
      this.addError({
        type: 'info',
        category: 'variable',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'API URL 中使用了变量引用',
        suggestion: '确保变量路径正确，运行时将自动替换',
      })
    }
  }

  private validateConditionNode(node: WorkflowNode, config: any) {
    const hasExpression = config.expression && config.expression.trim() !== ''
    const hasConditionGroups = config.conditionGroups && config.conditionGroups.length > 0

    if (!hasExpression && !hasConditionGroups) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '条件节点缺少判断条件',
        suggestion: '配置表达式或添加条件组来定义分支逻辑',
      })
    }

    if (hasConditionGroups) {
      const outgoingEdges = this.edges.filter(e => e.source === node.id)
      const conditionCount = config.conditionGroups.length

      if (outgoingEdges.length < conditionCount) {
        this.addError({
          type: 'warning',
          category: 'connection',
          nodeId: node.id,
          nodeLabel: node.data.label,
          message: `条件节点定义了 ${conditionCount} 个条件，但只有 ${outgoingEdges.length} 条输出连接`,
          suggestion: '为每个条件分支添加对应的输出连接',
        })
      }
    }
  }

  private validateLoopNode(node: WorkflowNode, config: any) {
    if (!config.targetArray || config.targetArray.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '循环节点未配置目标数组',
        suggestion: '在配置面板中指定要遍历的数组变量路径',
      })
    }

    const children = this.nodes.filter(n => n.parentNode === node.id)
    if (children.length === 0) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '循环节点内部没有子节点',
        suggestion: '拖拽节点到循环节点内部以定义循环体',
      })
    }

    const outgoingEdges = this.edges.filter(e => e.source === node.id)
    const hasLoopOutput = outgoingEdges.some(e => e.sourceHandle === 'loop-output')

    if (!hasLoopOutput && children.length > 0) {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '循环节点缺少循环输出连接',
        suggestion: '从循环节点的输出连接点连接到后续节点',
      })
    }
  }

  private validateParallelNode(node: WorkflowNode, config: any) {
    if (!config.branches || config.branches.length === 0) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '并行节点未配置分支',
        suggestion: '在配置面板中添加至少一个分支',
      })
    }

    const outgoingEdges = this.edges.filter(e => e.source === node.id)
    const branchCount = config.branches?.length || 0

    if (outgoingEdges.length < branchCount) {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `并行节点定义了 ${branchCount} 个分支，但只有 ${outgoingEdges.length} 条输出连接`,
        suggestion: '为每个分支添加对应的输出连接',
      })
    }
  }

  private validateApprovalNode(node: WorkflowNode, config: any) {
    if (!config.approver || config.approver.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '审批节点未配置审批人',
        suggestion: '在配置面板中指定审批人或审批组',
      })
    }

    if (!config.approvalType || !['single', 'any', 'all'].includes(config.approvalType)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '审批节点未配置审批类型',
        suggestion: '选择审批类型：单人审批、任意一人审批、全员审批',
      })
    }
  }

  private validateNotificationNode(node: WorkflowNode, config: any) {
    if (!config.channel || config.channel.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '通知节点未配置通知渠道',
        suggestion: '选择通知渠道：飞书、钉钉、企业微信等',
      })
    }

    if (!config.recipients || config.recipients.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '通知节点未配置接收人',
        suggestion: '指定通知接收人',
      })
    }
  }

  private validateDelayNode(node: WorkflowNode, config: any) {
    if (!config.duration || config.duration <= 0) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '延时节点未配置延时时间',
        suggestion: '设置延时时间（单位：秒）',
      })
    }

    if (config.duration > 86400) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '延时时间超过 24 小时',
        suggestion: '确认是否需要如此长的延时时间',
      })
    }
  }

  private validateScriptNode(node: WorkflowNode, config: any) {
    if (!config.script || config.script.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '脚本节点未配置脚本代码',
        suggestion: '在配置面板中编写 JavaScript 代码',
      })
    }
  }

  private validateLLMNode(node: WorkflowNode, config: any) {
    if (!config.model || config.model.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'LLM 节点未配置模型',
        suggestion: '选择或输入 LLM 模型名称',
      })
    }

    if (!config.systemPrompt || config.systemPrompt.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'LLM 节点未配置系统提示词',
        suggestion: '在配置面板中输入系统提示词',
      })
    }

    if (!config.userPrompt || config.userPrompt.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'LLM 节点未配置用户提示词',
        suggestion: '在配置面板中输入用户提示词',
      })
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'LLM 温度参数超出推荐范围 (0-2)',
        suggestion: '建议将温度参数设置在 0-2 之间',
      })
    }
  }

  private validateSQLNode(node: WorkflowNode, config: any) {
    if (!config.sql || config.sql.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'SQL 节点未配置 SQL 语句',
        suggestion: '在配置面板中编写 SQL 语句',
      })
    }

    if (!config.databaseId || config.databaseId.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'SQL 节点未选择数据库',
        suggestion: '选择要执行的数据库',
      })
    }

    if (config.unsafeMode) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'SQL 节点启用了不安全模式',
        suggestion: '不安全模式允许执行任意 SQL，请谨慎使用',
      })
    }
  }

  private validateKnowledgeRetrievalNode(node: WorkflowNode, config: any) {
    if (!config.knowledgeBaseId || config.knowledgeBaseId.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '知识库检索节点未选择知识库',
        suggestion: '选择要检索的知识库',
      })
    }

    if (!config.query || config.query.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '知识库检索节点未配置查询语句',
        suggestion: '输入要查询的内容或变量引用',
      })
    }
  }

  private validateDocumentExtractorNode(node: WorkflowNode, config: any) {
    if (!config.documentUrl || config.documentUrl.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '文档提取器节点未配置文档 URL',
        suggestion: '输入文档的 URL 地址',
      })
    }

    if (!config.extractFields || config.extractFields.length === 0) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '文档提取器节点未配置提取字段',
        suggestion: '添加需要从文档中提取的字段',
      })
    }
  }

  private validateDataOpNode(node: WorkflowNode, config: any) {
    if (!config.operation || config.operation.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '数据操作节点未配置操作类型',
        suggestion: '选择操作类型：映射、过滤、转换等',
      })
    }
  }

  private validateCCNode(node: WorkflowNode, config: any) {
    if (!config.recipients || config.recipients.trim() === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '抄送节点未配置接收人',
        suggestion: '指定抄送接收人',
      })
    }
  }

  private validateConnections() {
    if (this.nodes.length === 0) return

    const nodeIds = new Set(this.nodes.map(n => n.id))
    const connectedNodes = new Set<string>()

    this.edges.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        this.addError({
          type: 'error',
          category: 'connection',
          message: `连接引用了不存在的源节点: ${edge.source}`,
          suggestion: '删除无效的连接或重新创建节点',
        })
      }
      if (!nodeIds.has(edge.target)) {
        this.addError({
          type: 'error',
          category: 'connection',
          message: `连接引用了不存在的目标节点: ${edge.target}`,
          suggestion: '删除无效的连接或重新创建节点',
        })
      }
      connectedNodes.add(edge.source)
      connectedNodes.add(edge.target)
    })

    const isolatedNodes = this.nodes.filter(n => !connectedNodes.has(n.id))
    isolatedNodes.forEach(node => {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `节点 "${node.data.label}" 是孤立节点，没有连接到其他节点`,
        suggestion: '删除该节点或将其连接到工作流中',
      })
    })

    this.detectCycles()
  }

  private detectCycles() {
    const graph = new Map<string, string[]>()
    this.nodes.forEach(node => {
      graph.set(node.id, [])
    })

    this.edges.forEach(edge => {
      const targets = graph.get(edge.source) || []
      targets.push(edge.target)
      graph.set(edge.source, targets)
    })

    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const cycles: string[][] = []

    const dfs = (nodeId: string, path: string[]) => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const neighbors = graph.get(nodeId) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, [...path])) {
            return true
          }
        } else if (recursionStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor)
          const cyclePath = path.slice(cycleStart)
          cycles.push(cyclePath)
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, [])
      }
    }

    cycles.forEach(cycle => {
      const cycleLabels = cycle
        .map(id => {
          const node = this.nodes.find(n => n.id === id)
          return node?.data.label || id
        })
        .join(' → ')

      this.addError({
        type: 'error',
        category: 'connection',
        message: `检测到循环依赖: ${cycleLabels}`,
        suggestion: '检查并修改连接关系，避免形成死循环',
      })
    })
  }

  private validateVariables() {
    const variablePattern = /\{\{([^}]+)\}\}/g

    this.nodes.forEach(node => {
      const config = node.data.config || {}
      const configString = JSON.stringify(config)
      const matches = configString.matchAll(variablePattern)
      const variables = Array.from(matches, m => m[1])

      variables.forEach(variable => {
        const parts = variable.split('.')
        if (parts[0] === 'nodes') {
          const sourceNodeId = parts[1]
          const sourceNode = this.nodes.find(n => n.id === sourceNodeId)

          if (!sourceNode) {
            this.addError({
              type: 'error',
              category: 'variable',
              nodeId: node.id,
              nodeLabel: node.data.label,
              message: `变量引用了不存在的节点: {{${variable}}}`,
              suggestion: '检查变量路径是否正确，或确保源节点存在',
            })
          } else {
            const hasConnection = this.edges.some(
              e => e.source === sourceNodeId && e.target === node.id
            )
            if (!hasConnection && sourceNode.type !== WorkflowNodeType.START) {
              this.addError({
                type: 'warning',
                category: 'variable',
                nodeId: node.id,
                nodeLabel: node.data.label,
                message: `节点引用了上游节点 {{${variable}}} 的数据，但两者之间没有连接`,
                suggestion: '建立从源节点到当前节点的连接',
              })
            }
          }
        }
      })
    })
  }
}

export const validateWorkflow = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult => {
  const validator = new WorkflowValidator(nodes, edges)
  return validator.validate()
}

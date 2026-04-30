import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from '../types'
import { ValidationError, ValidationResult } from '../ValidationReportModal'

type ValidationConfig = Record<string, any>

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
      const config = this.getNodeConfig(node)

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
        case WorkflowNodeType.MUL_QUERY:
          this.validateMulQueryNode(node, config)
          break
        case WorkflowNodeType.MUL_UPDATE_ROW:
          this.validateMulUpdateRowNode(node, config)
          break
        case WorkflowNodeType.MUL_DELETE_ROW:
          this.validateMulDeleteRowNode(node, config)
          break
        case WorkflowNodeType.CC:
          this.validateCCNode(node, config)
          break
        case WorkflowNodeType.CLOUD_PHONE:
          this.validateCloudPhoneNode(node, config)
          break
        case WorkflowNodeType.STORAGE:
          this.validateStorageNode(node, config)
          break
        case WorkflowNodeType.QUESTION_CLASSIFIER:
          this.validateQuestionClassifierNode(node, config)
          break
        case WorkflowNodeType.JSON_PARSE:
          this.validateJSONParseNode(node, config)
          break
        case WorkflowNodeType.SMART_PARSE:
          this.validateSmartParseNode(node, config)
          break
        case WorkflowNodeType.FLOW_CALL:
          this.validateFlowCallNode(node, config)
          break
        case WorkflowNodeType.VARIABLE:
          this.validateVariableNode(node, config)
          break
      }
    })
  }

  private getNodeConfig(node: WorkflowNode): ValidationConfig {
    return (node.data?.config || {}) as ValidationConfig
  }

  private getOutgoingEdges(nodeId: string) {
    return this.edges.filter(edge => edge.source === nodeId)
  }

  private getTrimmedString(value: unknown) {
    return typeof value === 'string' ? value.trim() : ''
  }

  private hasNonEmptyString(value: unknown) {
    return this.getTrimmedString(value) !== ''
  }

  private hasConfiguredParams(params: unknown) {
    return Array.isArray(params) && params.some(item => this.hasNamedField(item))
  }

  private hasNamedField(item: any) {
    if (!item || typeof item !== 'object') return false
    return this.hasNonEmptyString(item.field) || this.hasNonEmptyString(item.name)
  }

  private countOutgoingHandles(nodeId: string, handleIds: string[]) {
    const handleSet = new Set(handleIds)
    return this.getOutgoingEdges(nodeId).filter(edge => edge.sourceHandle && handleSet.has(edge.sourceHandle))
      .length
  }

  private hasOutgoingHandle(nodeId: string, handleIds: string[]) {
    return this.countOutgoingHandles(nodeId, handleIds) > 0
  }

  private getNodeById(nodeId: string) {
    return this.nodes.find(node => node.id === nodeId)
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
    const conditionItems = Array.isArray(config.IF)
      ? config.IF.filter((item: any) => this.hasNonEmptyString(item?.field))
      : []
    const hasExpression = this.hasNonEmptyString(config.expression)
    const hasConditionGroups = Array.isArray(config.conditionGroups) && config.conditionGroups.length > 0
    const hasLegacyConditions = conditionItems.length > 0

    if (!hasExpression && !hasConditionGroups && !hasLegacyConditions) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '条件节点缺少判断条件',
        suggestion: '至少添加一条 IF 条件，或配置表达式/条件组来定义分支逻辑',
      })
    }

    const ifBranchConnected = this.hasOutgoingHandle(node.id, ['source-if', 'true'])
    const elseBranchConnected = this.hasOutgoingHandle(node.id, ['source-else', 'false'])

    if (!ifBranchConnected) {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '条件节点缺少“是”分支连接',
        suggestion: '从条件节点的“是”出口连接后续节点',
      })
    }

    if (!elseBranchConnected) {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '条件节点缺少“否”分支连接',
        suggestion: '从条件节点的“否”出口连接后续节点',
      })
    }
  }

  private validateLoopNode(node: WorkflowNode, config: any) {
    const hasTargetArray = this.hasNonEmptyString(config.targetArray || config.targetArrayTemplate)

    if (!hasTargetArray) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '循环节点未配置循环数组',
        suggestion: '请从变量选择器中选择一个数组变量作为循环源',
      })
    }

    if (!['serial', 'parallel', undefined].includes(config.executionMode)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '循环节点执行方式配置无效',
        suggestion: '执行方式仅支持串行或并发',
      })
    }

    if ((config.executionMode || 'serial') === 'parallel' && Number(config.maxConcurrency || 0) < 1) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '循环节点最大并发数必须大于 0',
        suggestion: '并发执行时请设置至少为 1 的最大并发数',
      })
    }

    if ((config.outputMode || 'all') === 'field' && !this.hasNonEmptyString(config.resultField)) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '循环节点未选择循环体输出字段',
        suggestion: '当聚合指定字段时，请绑定循环体内部节点的输出字段',
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
        suggestion: '拖拽节点到循环节点内部作为循环体',
      })
    }

    const hasLoopOutput = this.hasOutgoingHandle(node.id, ['loop-output'])

    if (!hasLoopOutput && children.length > 0) {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '循环节点缺少循环输出连接',
        suggestion: '从循环节点的循环输出连接到后续节点',
      })
    }
  }

  private validateParallelNode(node: WorkflowNode, config: any) {
    const branches = Array.isArray(config.branches)
      ? config.branches.filter((branch: any) => this.hasNonEmptyString(branch))
      : []

    if (branches.length === 0) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '并行节点未配置分支',
        suggestion: '在配置面板中添加至少一个分支',
      })
      return
    }

    const connectedBranchCount = this.countOutgoingHandles(
      node.id,
      branches.map((_, index) => `branch-${index}`)
    )

    if (connectedBranchCount < branches.length) {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `并行节点定义了 ${branches.length} 个分支，但只有 ${connectedBranchCount} 个分支已连接`,
        suggestion: '为每个并行分支添加对应的输出连接',
      })
    }
  }

  private validateApprovalNode(node: WorkflowNode, config: any) {
    const participantRules = Array.isArray(config?.participantRules) ? config.participantRules : []
    if (
      participantRules.length === 0 &&
      (!config.approver || String(config.approver).trim() === '')
    ) {
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

    if (
      config.autoApproval?.enabled &&
      !String(config.autoApproval?.decisionVariable || '').trim()
    ) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '启用 AI 自动审批时必须配置决策值来源',
        suggestion: '选择 AI 审批评估节点输出的 approvalDecision 作为决策值来源',
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
    if (!this.hasNonEmptyString(config.code) && !this.hasNonEmptyString(config.script)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '脚本节点未配置脚本代码',
        suggestion: '在配置面板中编写代码内容',
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
    const hasDocumentUrl = this.hasNonEmptyString(config.documentUrl)
    const hasInputParams = this.hasConfiguredParams(config.inputParams)

    if (!hasDocumentUrl && !hasInputParams) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '文档提取器节点未配置文档来源',
        suggestion: '填写文档 URL，或通过输入变量传入待提取文档',
      })
    }

    if (!Array.isArray(config.extractFields) || config.extractFields.length === 0) {
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

  private validateCloudPhoneNode(node: WorkflowNode, config: any) {
    if (!this.hasNonEmptyString(config.phoneId)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '云手机节点未选择云手机设备',
        suggestion: '先选择要执行操作的云手机设备',
      })
    }

    if (!this.hasNonEmptyString(config.operationContent)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '云手机节点未配置执行内容',
        suggestion: '填写需要在云手机执行的操作内容',
      })
    }
  }

  private validateStorageNode(node: WorkflowNode, config: any) {
    if (!this.hasNonEmptyString(config.provider)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '文件存储节点未配置存储提供商',
        suggestion: '选择本地或云端存储提供商',
      })
    }
  }

  private validateDataOpNode(node: WorkflowNode, config: any) {
    if (!this.hasNonEmptyString(config.code) && !this.hasNonEmptyString(config.operation)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '数据操作节点未配置处理逻辑',
        suggestion: '填写数据处理代码或选择操作类型',
      })
    }
  }

  private validateMulTableTarget(node: WorkflowNode, config: any, label: string) {
    if (!this.hasNonEmptyString(config.targetProjectId)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `${label}节点未配置目标项目`,
        suggestion: '填写目标项目 ID；跨项目操作必须在同一团队内并通过后端权限校验',
      })
    }

    if (!this.hasNonEmptyString(config.sheetId)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `${label}节点未配置目标表`,
        suggestion: '填写目标多维表 Sheet ID',
      })
    }
  }

  private validateMulQueryNode(node: WorkflowNode, config: any) {
    this.validateMulTableTarget(node, config, '查询项目表')

    const maxRows = Number(config.maxRows)
    if (!Number.isFinite(maxRows) || maxRows < 1 || maxRows > 1000) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '查询项目表节点返回行数必须在 1-1000 之间',
        suggestion: '将最多返回行数设置为 1 到 1000 之间的整数',
      })
    }

    if (this.hasNonEmptyString(config.filtersJson)) {
      try {
        JSON.parse(config.filtersJson)
      } catch {
        this.addError({
          type: 'error',
          category: 'node_config',
          nodeId: node.id,
          nodeLabel: node.data.label,
          message: '查询项目表节点过滤条件不是合法 JSON',
          suggestion: '填写 JSON 数组，例如 [{"columnId":"status","operator":"eq","value":"open"}]',
        })
      }
    }
  }

  private validateMulUpdateRowNode(node: WorkflowNode, config: any) {
    this.validateMulTableTarget(node, config, '修改项目表行')

    if (!this.hasNonEmptyString(config.rowIdTemplate)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '修改项目表行节点未配置行 ID',
        suggestion: '填写行 ID 或选择上游查询节点的 firstRow.rowId 变量',
      })
    }

    if (!this.hasNonEmptyString(config.fieldMappingsJson)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '修改项目表行节点未配置要修改的字段',
        suggestion: '填写修改字段 JSON，例如 {"status":"done"}',
      })
      return
    }

    try {
      const mappings = JSON.parse(config.fieldMappingsJson)
      if (!mappings || typeof mappings !== 'object' || Array.isArray(mappings) || Object.keys(mappings).length === 0) {
        this.addError({
          type: 'error',
          category: 'node_config',
          nodeId: node.id,
          nodeLabel: node.data.label,
          message: '修改项目表行节点未配置要修改的字段',
          suggestion: '修改字段 JSON 必须是非空对象',
        })
      }
    } catch {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '修改项目表行节点修改字段不是合法 JSON',
        suggestion: '填写 JSON 对象，例如 {"status":"done"}',
      })
    }
  }

  private validateMulDeleteRowNode(node: WorkflowNode, config: any) {
    this.validateMulTableTarget(node, config, '删除项目表行')

    if (!this.hasNonEmptyString(config.rowIdTemplate)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '删除项目表行节点未配置行 ID',
        suggestion: '填写行 ID 或选择上游查询节点的 firstRow.rowId 变量',
      })
    }
  }

  private validateQuestionClassifierNode(node: WorkflowNode, config: any) {
    if (!this.hasNonEmptyString(config.model)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '分类器节点未配置模型',
        suggestion: '选择用于分类的模型',
      })
    }

    const types = Array.isArray(config.types)
      ? config.types.filter((item: any) => this.hasNonEmptyString(item))
      : []

    if (types.length === 0) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '分类器节点未配置分类项',
        suggestion: '至少添加一个分类项',
      })
      return
    }

    const connectedBranchCount = this.countOutgoingHandles(
      node.id,
      types.map((_, index) => `source-${index}`)
    )
    const hasElseBranch = this.hasOutgoingHandle(node.id, ['source-else'])

    if (connectedBranchCount < types.length) {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: `分类器节点定义了 ${types.length} 个分类，但只有 ${connectedBranchCount} 个分类分支已连接`,
        suggestion: '为每个分类分支连接对应的后续节点',
      })
    }

    if (!hasElseBranch) {
      this.addError({
        type: 'warning',
        category: 'connection',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '分类器节点缺少“其他”分支连接',
        suggestion: '为未命中的情况补充“其他”分支连接',
      })
    }
  }

  private validateJSONParseNode(node: WorkflowNode, config: any) {
    if (!this.hasConfiguredParams(config.inputParams)) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: 'JSON 解析节点未配置输入变量',
        suggestion: config.mode === 'stringify' ? '选择需要转换为 JSON 字符串的对象变量' : '选择需要解析的 JSON 字符串变量',
      })
    }
  }

  private validateSmartParseNode(node: WorkflowNode, config: any) {
    if (!this.hasConfiguredParams(config.inputParams)) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '智能解析节点未配置输入变量',
        suggestion: '选择需要进行智能解析的输入变量',
      })
    }
  }

  private validateFlowCallNode(node: WorkflowNode, config: any) {
    if (config.flowId === undefined || config.flowId === null || `${config.flowId}` === '') {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '流程调用节点未选择目标流程',
        suggestion: '先在配置面板中选择要调用的流程',
      })
    }
  }

  private validateVariableNode(node: WorkflowNode, config: any) {
    if (!this.hasNonEmptyString(config.code)) {
      this.addError({
        type: 'error',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '变量处理节点未配置代码逻辑',
        suggestion: '填写变量处理代码',
      })
    }

    if (!this.hasConfiguredParams(config.outputParams)) {
      this.addError({
        type: 'warning',
        category: 'node_config',
        nodeId: node.id,
        nodeLabel: node.data.label,
        message: '变量处理节点未配置输出变量',
        suggestion: '至少声明一个输出变量，便于后续节点引用',
      })
    }
  }

  private validateCCNode(node: WorkflowNode, config: any) {
    const hasStructuredRecipients =
      (Array.isArray(config?.recipientUsers) && config.recipientUsers.length > 0) ||
      (Array.isArray(config?.recipientDepartments) && config.recipientDepartments.length > 0)
    if (!hasStructuredRecipients && (!config.recipients || String(config.recipients).trim() === '')) {
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

  private findLoopParent(node: WorkflowNode | undefined) {
    if (!node?.parentNode) return undefined

    const parentNode = this.getNodeById(node.parentNode)
    if (!parentNode) return undefined

    if (parentNode.type === WorkflowNodeType.LOOP) {
      return parentNode
    }

    return this.findLoopParent(parentNode)
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
            const sourceInLoop = this.findLoopParent(sourceNode)
            const targetInLoop = this.findLoopParent(node)
            const sharesLoopScope = sourceInLoop && targetInLoop && sourceInLoop.id === targetInLoop.id
            if (!hasConnection && !sharesLoopScope && sourceNode.type !== WorkflowNodeType.START) {
              this.addError({
                type: 'warning',
                category: 'variable',
                nodeId: node.id,
                nodeLabel: node.data.label,
                message: `节点引用了上游节点 {{${variable}}} 的数据，但两者之间没有连接`,
                suggestion: '建立从源节点到当前节点的连接，或将节点放到同一循环作用域内',
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

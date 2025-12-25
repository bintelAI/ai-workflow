# 项目开发规则与规范

本文件定义了 **ai-工作流** 项目的核心开发规则，旨在指导 Trae IDE 在辅助开发时保持代码风格一致、逻辑严谨，并特别规范节点开发、变量处理及 UI 交互。

## **1. 核心技术栈**

- **框架**: React 18+ (TypeScript)
- **流程引擎**: ReactFlow
- **图标库**: Lucide-React
- **样式**: Tailwind CSS + CSS Modules
- **状态管理**: Zustand (在 `components/Workflow/store/useWorkflowStore.ts` 定义)

---

## **2. 节点开发规则 (Node Development)**

所有新节点的开发必须遵循以下结构，以确保工作流的可扩展性和一致性。

### **2.1 基础结构**

- **节点组件**: 必须继承或包装 `BaseNode` (`components/Workflow/nodes/BaseNode.tsx`)。
- **配置面板**: 节点对应的配置组件应放置在 `components/Workflow/configs/` 目录下，命名为 `[NodeName]Config.tsx`。
- **类型定义**: 节点类型必须在 `types.ts` 的 `WorkflowNodeType` 枚举中定义。

### **2.2 现有节点类型**

项目已实现的节点类型（在 `types.ts` 中定义）：

| 节点类型 | 枚举值 | 中文名称 | 配置文件 | 说明 |
|---------|--------|---------|---------|------|
| 开始节点 | START | 开始节点 | StartConfig.tsx | 流程起点，定义全局参数 |
| 结束节点 | END | 结束节点 | EndConfig.tsx | 流程终点，定义输出 |
| 审批节点 | APPROVAL | 审批节点 | ApprovalConfig.tsx | 人工审批流程 |
| 抄送节点 | CC | 抄送节点 | CCConfig.tsx | 抄送通知 |
| 条件节点 | CONDITION | 条件节点 | ConditionConfig.tsx | 条件判断分支 |
| 并行节点 | PARALLEL | 并行节点 | - | 并行执行多个分支 |
| API调用 | API_CALL | API 调用 | APICallConfig.tsx | 调用外部 API |
| 消息通知 | NOTIFICATION | 消息通知 | NotificationConfig.tsx | 发送通知消息 |
| 延时等待 | DELAY | 延时等待 | DelayConfig.tsx | 延时等待 |
| 数据操作 | DATA_OP | 数据操作 | DataOpConfig.tsx | 数据转换和处理 |
| 脚本代码 | SCRIPT | 脚本代码 | ScriptConfig.tsx | 执行 JavaScript 代码 |
| LLM模型 | LLM | LLM 模型 | LLMConfig.tsx | 调用大语言模型 |
| 循环节点 | LOOP | 循环节点 | LoopConfig.tsx | 循环遍历数组 |
| SQL节点 | SQL | SQL 节点 | SQLConfig.tsx | 执行 SQL 查询 |
| 知识库检索 | KNOWLEDGE_RETRIEVAL | 知识库检索 | KnowledgeRetrievalConfig.tsx | 检索知识库 |
| 文档提取器 | DOCUMENT_EXTRACTOR | 文档提取器 | DocumentExtractorConfig.tsx | 提取文档内容 |

### **2.3 变量绑定与复用**

项目中存在统一的变量绑定机制，开发新节点配置时**严禁重复实现**变量选择逻辑。

#### **VariableBindModal（变量绑定弹窗）**

核心变量选择弹窗，支持从上游节点、开始节点、全局变量和系统变量中检索。

- **位置**: `components/Workflow/configs/VariableBindModal.tsx`
- **功能**:
  - 显示上游节点输出（nodes）
  - 显示全局参数（payload）
  - 显示系统变量（system）
  - 显示循环变量（loop，仅在循环节点内）
  - 支持搜索和过滤
  - 支持复制变量路径

#### **VariableSelector（单变量选择）**

适用于需要选择单个变量的场景（如下拉框样式）。

- **位置**: `components/Workflow/configs/common.tsx`
- **用法**: `import { VariableSelector } from './common';`
- **Props**:
  - `value`: 当前选中的变量路径
  - `onChange`: 变量变化回调
  - `scope`: 作用域（upstream/internal/all）
  - `placeholder`: 占位符文本
- **适用场景**:
  - API 调用的 URL 参数
  - SQL 节点的数据库 ID
  - 条件节点的变量字段

#### **VariableInput（混合文本与变量）**

适用于需要混合输入文本和变量的场景（如 API URL、提示词）。

- **位置**: `components/Workflow/configs/common.tsx`
- **功能**: 支持在光标位置插入 `{{variable.path}}`
- **Props**:
  - `value`: 输入框的值（可能包含变量占位符）
  - `onChange`: 输入变化回调
  - `placeholder`: 占位符文本
  - `onVariableSelect`: 变量选择回调
- **适用场景**:
  - API 调用的完整 URL
  - LLM 节点的提示词
  - 通知节点的消息内容

#### **VariableTextArea（多行文本与变量）**

适用于需要多行文本和变量混合的场景（如脚本代码、SQL 语句）。

- **位置**: `components/Workflow/configs/common.tsx`
- **功能**: 支持在光标位置插入 `{{variable.path}}`
- **Props**:
  - `value`: 文本框的值（可能包含变量占位符）
  - `onChange`: 文本变化回调
  - `placeholder`: 占位符文本
  - `onVariableSelect`: 变量选择回调
  - `rows`: 显示的行数
- **适用场景**:
  - SQL 节点的 SQL 语句
  - 脚本节点的代码
  - 复杂的提示词模板

### **2.4 节点 UI 规范**

#### **图标配置（getNodeIcon）**

在 `BaseNode.tsx` 的 `getNodeIcon` 函数中为新节点分配图标。

```typescript
function getNodeIcon(type: WorkflowNodeType): React.ReactNode {
  const iconMap: Record<WorkflowNodeType, React.ReactNode> = {
    START: <Play className="w-4 h-4" />,
    END: <Square className="w-4 h-4" />,
    API_CALL: <Globe className="w-4 h-4" />,
    LLM: <Bot className="w-4 h-4" />,
    // ... 其他节点
  }
  return iconMap[type] || <Box className="w-4 h-4" />
}
```

#### **颜色配置（getNodeColor）**

在 `BaseNode.tsx` 的 `getNodeColor` 函数中定义节点的状态颜色（成功、失败、运行中、选中）。

```typescript
function getNodeColor(status: 'success' | 'failed' | 'running' | 'idle'): string {
  const colorMap = {
    success: 'text-green-500',
    failed: 'text-red-500',
    running: 'text-blue-500',
    idle: 'text-gray-500'
  }
  return colorMap[status]
}
```

#### **标签配置（getNodeTypeLabel）**

在 `BaseNode.tsx` 的 `getNodeTypeLabel` 函数中定义中文友好名称。

```typescript
function getNodeTypeLabel(type: WorkflowNodeType): string {
  const labelMap: Record<WorkflowNodeType, string> = {
    START: '开始节点',
    END: '结束节点',
    API_CALL: 'API 调用',
    LLM: 'LLM 模型',
    // ... 其他节点
  }
  return labelMap[type] || type
}
```

#### **背景色配置（getNodeIconBgColor）**

在 `BaseNode.tsx` 的 `getNodeIconBgColor` 函数中定义节点图标的背景色。

```typescript
function getNodeIconBgColor(type: WorkflowNodeType): string {
  const bgColorMap: Record<WorkflowNodeType, string> = {
    START: 'bg-blue-100',
    END: 'bg-gray-100',
    API_CALL: 'bg-purple-100',
    LLM: 'bg-green-100',
    // ... 其他节点
  }
  return bgColorMap[type] || 'bg-gray-100'
}
```

### **2.5 节点状态管理**

- 节点的执行状态存储在全局 store 的 `nodeExecutionStatus` 中。
- 状态类型: `'success' | 'failed' | 'running' | 'idle'`
- 节点输出数据存储在 `nodeOutputs` 中。
- 状态更新通过 `updateNodeExecutionStatus` 方法进行。

---

## **3. 变量 `{{}}` 处理规则**

本项目采用 Dify 风格的变量引用规范，即使用双大括号包裹变量路径。

### **3.1 引用格式**

- **全局变量**: `{{payload.key}}`
- **上游节点输出**: `{{nodes.[nodeId].output_field}}`
- **系统变量**: `{{system.timestamp}}`
- **循环上下文**: `{{loop.item}}` 或 `{{loop.index}}`

### **3.2 处理原则**

- **存储**: 所有的配置项中，若涉及变量引用，应以字符串形式存储原始路径，并包裹 `{{}}`。
- **运行时替换**: 逻辑执行时，必须调用 `simulationRunner.ts` 中的变量替换逻辑。
  - **简单替换**: `replaceVariables` 函数用于字符串中的变量占位符替换。
  - **深层获取**: `getVariableValue` 函数用于根据路径从上下文对象中获取具体值。
- **条件判断**: 在 `ConditionNode` 中，执行前需通过正则 `replace(/\{\{(.*?)\}\}/g, '$1')` 清理占位符，转化为可执行的 JS 路径。

### **3.3 变量替换函数**

#### **replaceVariables（简单替换）**

```typescript
function replaceVariables(str: string, variables: any): string {
  return str.replace(/\{\{(.*?)\}\}/g, (match, variableName) => {
    const value = getVariableValue(variables, variableName.trim())
    return value !== undefined ? String(value) : match
  })
}
```

#### **getVariableValue（深层获取）**

```typescript
function getVariableValue(obj: any, path: string): any {
  const cleanPath = path.replace(/\{\{(.*?)\}\}/g, '$1').trim()
  const parts = cleanPath.split('.')
  let current = obj
  for (const part of parts) {
    if (current === undefined || current === null) return undefined
    current = current[part]
  }
  return current
}
```

### **3.4 SQL 特殊处理**

SQL 节点支持特殊的模板语法：

1. **IF 逻辑**: `{% if condition %} ... {% else %} ... {% endif %}`
2. **变量替换**: `{{variable}}`

示例：
```sql
SELECT * FROM orders
WHERE status = '{{payload.status}}'
{% if payload.min_amount %} AND amount >= {{payload.min_amount}} {% endif %}
{% if payload.max_amount %} AND amount <= {{payload.max_amount}} {% endif %}
```

**支持的运算符**：
- `==` 等于
- `!=` 不等于
- `>` 大于
- `<` 小于
- `>=` 大于等于
- `<=` 小于等于
- `contains` 包含
- `not_contains` 不包含
- `empty` 为空
- `not_empty` 不为空

---

## **4. 代码风格与架构**

### **4.1 代码简洁之道**

- **单文件限制**: 单个文件代码量尽量控制在 **700 行** 以内。若超过，必须进行逻辑拆分（如将复杂的 Sub-Components 提取到独立文件）。
- **DRY 原则**: 优先复用 `components/Workflow/configs/common.tsx` 中的组件（如 `KeyValueEditor`, `AIButton`, `VariableSelector`）。
- **设计模式**:
  - **策略模式**: 用于不同节点类型的执行逻辑处理（见 `simulationRunner.ts`）。
  - **工厂模式**: 用于根据类型渲染不同的配置面板（见 `ConfigPanel.tsx` 的 `renderAdvancedConfig` 方法）。

### **4.2 依赖管理**

- 使用 **pnpm** 作为唯一包管理器。
- 严禁直接删除文件，需删除的文件必须迁移至项目根目录下的 `backupDel` 目录。

### **4.3 状态管理规范**

- 所有的工作流数据（nodes, edges）必须通过 `useWorkflowStore` 进行操作。
- 严禁在节点内部维护私有的持久化状态，所有配置更新必须调用 `onConfigChange`。
- Store 的 actions 通过模块化管理（见 `store/modules/` 目录）。

### **4.4 Store 模块化**

Store 的 actions 被拆分为多个模块：

| 模块 | 文件 | 功能 |
|------|------|------|
| createNodeActions | `store/modules/nodeActions.ts` | 节点相关操作（添加、删除、更新） |
| createEdgeActions | `store/modules/edgeActions.ts` | 边相关操作（添加、删除、更新） |
| createMenuActions | `store/modules/menuActions.ts` | 菜单相关操作（上下文菜单） |
| createSimulationActions | `store/modules/simulationActions.ts` | 模拟运行相关操作（执行、停止、重置） |
| createCategoryActions | `store/modules/categoryActions.ts` | 分类相关操作（增删改查） |
| createNodeOutputActions | `store/modules/nodeOutputActions.ts` | 节点输出相关操作（存储、获取） |
| createAIActions | `store/modules/aiActions.ts` | AI 功能相关操作（生成、补全） |

### **4.5 设计模式应用**

#### **策略模式（Strategy Pattern）**

在 `simulationRunner.ts` 中，不同节点类型的执行逻辑采用策略模式：

```typescript
const nodeExecutionStrategies: Record<WorkflowNodeType, (node: Node, context: ExecutionContext) => Promise<ExecutionResult>> = {
  START: executeStartNode,
  END: executeEndNode,
  API_CALL: executeAPICallNode,
  LLM: executeLLMNode,
  SQL: executeSQLNode,
  // ... 其他节点
}
```

#### **工厂模式（Factory Pattern）**

在 `ConfigPanel.tsx` 中，配置面板的渲染采用工厂模式：

```typescript
function renderAdvancedConfig(nodeType: WorkflowNodeType) {
  const configMap: Record<WorkflowNodeType, React.ReactNode> = {
    START: <StartConfig />,
    END: <EndConfig />,
    API_CALL: <APICallConfig />,
    LLM: <LLMConfig />,
    // ... 其他节点
  }
  return configMap[nodeType]
}
```

---

## **5. 目录结构规范**

```
components/Workflow/
├── nodes/                      # ReactFlow 自定义节点组件
│   ├── BaseNode.tsx           # 基础节点组件（核心）
│   ├── StartNode.tsx          # 开始节点
│   ├── EndNode.tsx            # 结束节点
│   ├── ApprovalNode.tsx       # 审批节点
│   ├── CCNode.tsx             # 抄送节点
│   ├── ConditionNode.tsx      # 条件节点
│   ├── ParallelNode.tsx       # 并行节点
│   ├── APICallNode.tsx        # API 调用节点
│   ├── NotificationNode.tsx    # 消息通知节点
│   ├── DelayNode.tsx          # 延时等待节点
│   ├── DataOpNode.tsx         # 数据操作节点
│   ├── ScriptNode.tsx         # 脚本代码节点
│   ├── LLMNode.tsx            # LLM 模型节点
│   ├── LoopNode.tsx           # 循环节点
│   ├── SQLNode.tsx            # SQL 节点
│   ├── KnowledgeRetrievalNode.tsx  # 知识库检索节点
│   ├── DocumentExtractorNode.tsx   # 文档提取器节点
│   └── index.tsx              # 节点导出
├── configs/                    # 节点右侧抽屉配置面板
│   ├── common.tsx             # 通用组件（VariableSelector, VariableInput, VariableTextArea, KeyValueEditor, AIButton）
│   ├── VariableBindModal.tsx  # 变量绑定弹窗
│   ├── StartConfig.tsx        # 开始节点配置
│   ├── EndConfig.tsx          # 结束节点配置
│   ├── ApprovalConfig.tsx     # 审批节点配置
│   ├── CCConfig.tsx           # 抄送节点配置
│   ├── ConditionConfig.tsx    # 条件节点配置
│   ├── APICallConfig.tsx      # API 调用节点配置
│   ├── NotificationConfig.tsx # 消息通知节点配置
│   ├── DelayConfig.tsx        # 延时等待节点配置
│   ├── DataOpConfig.tsx       # 数据操作节点配置
│   ├── ScriptConfig.tsx       # 脚本代码节点配置
│   ├── LLMConfig.tsx          # LLM 模型节点配置
│   ├── LoopConfig.tsx        # 循环节点配置
│   ├── SQLConfig.tsx         # SQL 节点配置
│   ├── KnowledgeRetrievalConfig.tsx  # 知识库检索节点配置
│   ├── DocumentExtractorConfig.tsx   # 文档提取器节点配置
│   └── NodeOutputPreview.tsx  # 节点输出预览
├── edges/                      # 自定义边组件
│   └── CustomEdge.tsx         # 自定义边组件
├── store/                      # Zustand Store 及仿真运行器
│   ├── useWorkflowStore.ts   # 主 Store
│   ├── simulationRunner.ts   # 模拟运行逻辑
│   └── modules/               # Store actions 模块
│       ├── nodeActions.ts     # 节点相关操作
│       ├── edgeActions.ts     # 边相关操作
│       ├── menuActions.ts     # 菜单相关操作
│       ├── simulationActions.ts  # 模拟运行相关操作
│       ├── categoryActions.ts # 分类相关操作
│       ├── nodeOutputActions.ts  # 节点输出相关操作
│       └── aiActions.ts       # AI 功能相关操作
├── utils/                      # 工具函数
│   ├── flattenObject.ts       # JSON 扁平化工具
│   └── ...
├── validators/                 # 验证器
│   └── workflowValidator.ts   # 工作流验证器
├── WorkflowApp.tsx            # 工作流应用主组件
├── WorkflowCanvas.tsx         # 工作流画布
├── ConfigPanel.tsx            # 配置面板（工厂模式）
├── DataDrawer.tsx             # 数据抽屉
├── Sidebar.tsx                # 侧边栏
├── AICommandCenter.tsx        # AI 命令中心
└── ...
```

---

## **6. 样式管理**

- 节点开发请参考开始节点样式进行节点样式处理
- 使用 Tailwind CSS 进行样式开发
- 复杂样式使用 CSS Modules（如 `ConfigPanel.module.css`）
- 节点状态颜色通过 `getNodeColor` 函数统一管理
- 节点图标背景色通过 `getNodeIconBgColor` 函数统一管理

### **6.1 节点样式规范**

- **节点容器**: 使用统一的边框、圆角、阴影样式
- **节点头部**: 显示节点类型标签和图标
- **节点内容**: 显示节点名称和描述
- **节点状态**: 通过颜色和图标显示执行状态
- **节点交互**: 支持拖拽、选中、右键菜单等操作

### **6.2 响应式设计**

- 配置面板支持响应式布局
- 在小屏幕上自动调整布局
- 使用 Tailwind 的响应式工具类（如 `md:flex`, `lg:w-1/2`）

---

## **7. 工作流分类系统**

项目支持工作流节点分类管理，通过 `categories` 实现：

### **7.1 默认分类**

- **general**（通用）: 开始、结束、条件、并行、延时等通用节点
- **integration**（集成）: API 调用、消息通知等集成节点
- **ai**（AI）: LLM 模型、知识库检索、文档提取器等 AI 节点
- **data**（数据）: 数据操作、脚本代码、SQL 节点等数据处理节点

### **7.2 分类管理**

- 通过设置面板进行分类的增删改查
- 每个节点可以属于多个分类
- 分类支持图标和描述

### **7.3 分类过滤**

- 侧边栏根据选中的分类显示对应节点
- 支持搜索和过滤节点
- 支持自定义分类显示顺序

---

## **8. AI 功能集成**

项目集成了 AI 辅助功能：

### **8.1 AI 自动补全**

- 在配置面板中，点击 AI 按钮可自动生成配置内容
- 支持根据上下文智能生成配置
- 支持多种配置类型的自动生成

### **8.2 AI 命令中心**

- 提供自然语言创建工作流的功能
- 支持通过自然语言描述生成节点和连接
- 支持通过自然语言修改节点配置

### **8.3 AI 状态管理**

- 通过 `isAIGenerating` 状态管理 AI 生成过程
- 显示 AI 生成进度和状态
- 支持 AI 生成结果的预览和确认

---

## **9. 开发注意事项**

### **9.1 新增节点时**

1. **在 `types.ts` 中添加节点类型**:
   ```typescript
   export enum WorkflowNodeType {
     // ... 现有类型
     NEW_NODE = 'NEW_NODE'
   }
   ```

2. **在 `BaseNode.tsx` 中添加 UI 配置**:
   - 在 `getNodeIcon` 中添加图标
   - 在 `getNodeTypeLabel` 中添加标签
   - 在 `getNodeIconBgColor` 中添加背景色

3. **创建节点组件**:
   - 在 `components/Workflow/nodes/` 目录下创建 `NewNode.tsx`
   - 继承或包装 `BaseNode` 组件

4. **创建配置组件**:
   - 在 `components/Workflow/configs/` 目录下创建 `NewNodeConfig.tsx`
   - 使用 `VariableSelector`、`VariableInput`、`VariableTextArea` 等通用组件
   - 通过 `onConfigChange` 回调更新配置

5. **在 `ConfigPanel.tsx` 中添加渲染逻辑**:
   ```typescript
   case WorkflowNodeType.NEW_NODE:
     return <NewNodeConfig />
   ```

6. **在 `simulationRunner.ts` 中添加执行逻辑**:
   - 实现节点执行函数
   - 处理变量替换
   - 返回执行结果

### **9.2 使用变量时**

- 优先使用 `VariableSelector`、`VariableInput`、`VariableTextArea` 组件
- 确保变量路径正确（payload、nodes、system、loop）
- 在 `simulationRunner.ts` 中实现对应的变量替换逻辑
- 注意变量类型转换（字符串、数字、布尔值、对象、数组）

### **9.3 状态更新时**

- 使用 `updateNodeData` 方法更新节点数据
- 使用 `onConfigChange` 回调更新配置
- 避免直接修改 store 中的数据
- 使用 immer 进行不可变更新

### **9.4 样式开发时**

- 优先使用 Tailwind CSS 工具类
- 保持与现有节点样式一致
- 注意响应式设计和交互反馈
- 使用统一的颜色和间距规范

### **9.5 错误处理时**

- 在节点执行时捕获异常
- 返回详细的错误信息
- 在 UI 中显示错误状态
- 提供错误恢复机制

### **9.6 性能优化时**

- 避免不必要的重新渲染
- 使用 React.memo 和 useMemo 优化性能
- 在循环节点中避免重复计算
- 合理使用并发模式提高处理效率

### **9.7 测试时**

- 为新节点编写单元测试
- 测试变量替换逻辑
- 测试边界情况和错误处理
- 测试 UI 交互和响应式布局

---

## **10. 常见问题与解决方案**

### **10.1 变量替换失败**

**症状**: 变量未被替换，显示为 `{{variable.path}}`

**可能原因**:
- 变量路径拼写错误
- 上游节点未正确执行
- 变量不在当前作用域内

**解决方案**:
- 检查变量路径是否正确
- 确保上游节点已成功执行
- 使用数据抽屉查看实际变量值

### **10.2 节点配置不生效**

**症状**: 修改节点配置后，执行结果未更新

**可能原因**:
- 未调用 `onConfigChange` 回调
- 配置未正确保存到 store
- 配置格式不正确

**解决方案**:
- 确保调用 `onConfigChange` 回调
- 检查配置是否正确保存
- 验证配置格式是否符合要求

### **10.3 样式不一致**

**症状**: 新节点的样式与现有节点不一致

**可能原因**:
- 未参考现有节点的样式
- 使用了不同的样式工具类
- 未遵循统一的样式规范

**解决方案**:
- 参考开始节点的样式
- 使用统一的 Tailwind 工具类
- 遵循项目样式规范

---

## **11. 最佳实践**

### **11.1 代码组织**

- 将复杂的逻辑拆分为多个函数
- 使用清晰的命名和注释
- 遵循单一职责原则
- 保持代码简洁和可读性

### **11.2 性能优化**

- 避免不必要的重新渲染
- 使用 React.memo 和 useMemo
- 优化大数据处理
- 合理使用异步操作

### **11.3 用户体验**

- 提供清晰的错误提示
- 支持撤销和重做操作
- 提供快捷键支持
- 优化加载和响应速度

### **11.4 可维护性**

- 编写清晰的文档
- 使用类型检查
- 编写单元测试
- 定期重构和优化代码

---

## **12. 总结**

本规范文档定义了 ai-工作流项目的核心开发规则，包括：

1. **核心技术栈**: React 18+、ReactFlow、Lucide-React、Tailwind CSS、Zustand
2. **节点开发规则**: 基础结构、现有节点类型、变量绑定、UI 规范、状态管理
3. **变量处理规则**: 引用格式、处理原则、SQL 特殊处理
4. **代码风格与架构**: 代码简洁之道、依赖管理、状态管理、设计模式
5. **目录结构规范**: 清晰的目录结构和文件组织
6. **样式管理**: 统一的样式规范和响应式设计
7. **工作流分类系统**: 节点分类管理和过滤
8. **AI 功能集成**: AI 自动补全、AI 命令中心、AI 状态管理
9. **开发注意事项**: 新增节点、使用变量、状态更新、样式开发、错误处理、性能优化、测试
10. **常见问题与解决方案**: 变量替换失败、节点配置不生效、样式不一致
11. **最佳实践**: 代码组织、性能优化、用户体验、可维护性

遵循本规范可以确保代码风格一致、逻辑严谨，提高开发效率和代码质量。

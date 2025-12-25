import React, { useState, useEffect } from 'react'
import {
  X,
  Search,
  FileText,
  Hash,
  ToggleLeft,
  Calendar,
  Box,
  LayoutList,
  PlayCircle,
  Database,
  Server,
  Code,
  MessageSquare,
  Repeat,
  GitBranch,
  Clock,
} from 'lucide-react'
import { useWorkflowStore, DEFAULT_DEV_INPUT } from '../store/useWorkflowStore'
import { WorkflowNodeType } from '../types'
import { flattenObject } from './common'

interface VariableBindModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (variable: string) => void
  currentValue?: string
  /**
   * Optional filter for nodes.
   * 'upstream' - show only upstream nodes (default)
   * 'internal' - show only child nodes of the current node (useful for Loop output)
   * 'all' - show all nodes
   */
  scope?: 'upstream' | 'internal' | 'all'
}

export const VariableBindModal: React.FC<VariableBindModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  scope = 'upstream',
}) => {
  const { nodes, edges, selectedNodeId, globalVariables } = useWorkflowStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'upstream' | 'global' | 'system'>('all')

  if (!isOpen) return null

  // --- Data Gathering Logic ---

  // 1. Start Node Variables
  const startNode = nodes.find(n => n.type === WorkflowNodeType.START)
  const getStartNodeVariables = () => {
    let vars: any[] = []
    
    // Get variables from devInput (backward compatibility)
    const devInput = (startNode?.data.config as any)?.devInput || DEFAULT_DEV_INPUT
    try {
      const parsed = JSON.parse(devInput)
      vars = flattenObject(parsed)
    } catch (e) {
      // If JSON parse fails, don't add error variable
    }
    
    // Get variables from new variables config
    const variablesConfig = (startNode?.data.config as any)?.variables || []
    variablesConfig.forEach((variable: any) => {
      const displayPath = `payload.${variable.name}`
      vars.push({
        label: variable.displayName || variable.name,
        path: displayPath,
        type: variable.type,
        source: 'global',
        nodeLabel: 'Start Node',
        required: variable.required,
        hidden: variable.hidden
      })
      
      // If it's a dropdown type, add options as subvariables (for reference)
      if (variable.type === 'dropdown' && variable.options) {
        variable.options.forEach((option: any, index: number) => {
          vars.push({
            label: `${variable.displayName || variable.name} - ${option.label}`,
            path: `${displayPath}.options.${index}`,
            type: 'string',
            value: option.value,
            source: 'global',
            nodeLabel: 'Start Node'
          })
        })
      }
    })
    
    // Get variables from global configuration
    globalVariables.forEach((variable: any) => {
      const displayPath = `global.${variable.name}`
      vars.push({
        label: variable.displayName || variable.name,
        path: displayPath,
        type: variable.type,
        source: 'global',
        nodeLabel: 'Global Config',
        required: variable.required,
        hidden: variable.hidden
      })
      
      // If it's a dropdown type, add options as subvariables (for reference)
      if (variable.type === 'dropdown' && variable.options) {
        variable.options.forEach((option: any, index: number) => {
          vars.push({
            label: `${variable.displayName || variable.name} - ${option.label}`,
            path: `${displayPath}.options.${index}`,
            type: 'string',
            value: option.value,
            source: 'global',
            nodeLabel: 'Global Config'
          })
        })
      }
    })
    
    // If no variables, add a placeholder
    if (vars.length === 0) {
      vars.push({ label: 'No global variables defined', path: 'payload', type: 'object', source: 'global', nodeLabel: 'Start Node' })
    }
    
    return vars.map(v => ({ ...v, source: 'global', nodeLabel: v.nodeLabel || 'Start Node' }))
  }

  // 2. Upstream or Internal Node Variables
  const getNodeVariables = () => {
    if (!selectedNodeId) return []

    let targetNodes: any[] = []

    if (scope === 'internal') {
      // Find all child nodes of the current node
      targetNodes = nodes.filter(n => n.parentNode === selectedNodeId)
    } else if (scope === 'upstream') {
      // Backward traversal to find all upstream nodes
      const visited = new Set<string>()
      const queue = [selectedNodeId]

      while (queue.length > 0) {
        const curr = queue.shift()!
        const incomingEdges = edges.filter(e => e.target === curr)
        for (const edge of incomingEdges) {
          if (!visited.has(edge.source)) {
            visited.add(edge.source)
            queue.push(edge.source)
            const sourceNode = nodes.find(n => n.id === edge.source)
            if (sourceNode) targetNodes.push(sourceNode)
          }
        }
      }
    } else {
      // All other nodes
      targetNodes = nodes.filter(n => n.id !== selectedNodeId)
    }

    const nodeVars: any[] = []

    targetNodes.forEach(node => {
      const nodeLabel = node.data.label || node.type
      let outputVars: any[] = []

      // Define standard outputs for each node type
      switch (node.type) {
        case WorkflowNodeType.API_CALL:
          outputVars = [
            { label: '响应体 (Body)', path: `nodes.${node.id}.data`, type: 'object' },
            { label: '状态码 (Status)', path: `nodes.${node.id}.status`, type: 'number' },
            { label: '响应头 (Headers)', path: `nodes.${node.id}.headers`, type: 'object' },
          ]
          break
        case WorkflowNodeType.LLM:
          outputVars = [
            { label: 'AI 回复 (Text)', path: `nodes.${node.id}.text`, type: 'string' },
            { label: '完整响应', path: `nodes.${node.id}.response`, type: 'object' },
          ]
          break
        case WorkflowNodeType.SQL:
          outputVars = [
            { label: '查询结果 (Data)', path: `nodes.${node.id}.data`, type: 'array' },
            { label: '受影响行数', path: `nodes.${node.id}.affectedRows`, type: 'number' },
            { label: '完整执行结果', path: `nodes.${node.id}.output`, type: 'object' },
          ]
          break
        case WorkflowNodeType.SCRIPT:
          outputVars = [{ label: '输出结果', path: `nodes.${node.id}.output`, type: 'object' }]
          break
        case WorkflowNodeType.DATA_OP:
          outputVars = [{ label: '处理结果', path: `nodes.${node.id}.result`, type: 'object' }]
          break
        case WorkflowNodeType.CONDITION:
          outputVars = [{ label: '判断结果', path: `nodes.${node.id}.result`, type: 'boolean' }]
          break
        case WorkflowNodeType.LOOP:
          outputVars = [{ label: '聚合结果', path: `nodes.${node.id}.result`, type: 'array' }]
          break
        case WorkflowNodeType.KNOWLEDGE_RETRIEVAL:
          outputVars = [
            { label: '检索结果 (Result)', path: `nodes.${node.id}.result`, type: 'string' },
            { label: '上下文 (Context)', path: `nodes.${node.id}.context`, type: 'string' },
            { label: '引用列表 (References)', path: `nodes.${node.id}.references`, type: 'array' },
          ]
          break
        case WorkflowNodeType.DOCUMENT_EXTRACTOR:
          outputVars = [{ label: '提取文本 (Text)', path: `nodes.${node.id}.text`, type: 'string' }]
          break
        // Add more types as needed
        default:
          outputVars = [{ label: '节点输出', path: `nodes.${node.id}.output`, type: 'object' }]
      }

      // Check if node has custom output config
      // e.g., if APICall has a specific extract path, maybe we can hint it?

      nodeVars.push(
        ...outputVars.map(v => ({
          ...v,
          source: 'upstream',
          nodeId: node.id,
          nodeType: node.type,
          nodeLabel: nodeLabel,
        }))
      )
    })

    return nodeVars
  }

  // 3. System Variables
  const systemVars = [
    { label: '当前时间 (ISO)', path: 'system.timestamp', type: 'date', source: 'system' },
    { label: '工作流 ID', path: 'system.workflow_id', type: 'string', source: 'system' },
    { label: '执行 ID', path: 'system.execution_id', type: 'string', source: 'system' },
  ]

  // 4. Loop Variables (if inside loop or IS a loop)
  const currentNode = nodes.find(n => n.id === selectedNodeId)
  const parentLoopNode = currentNode?.parentNode
    ? nodes.find(n => n.id === currentNode.parentNode && n.type === WorkflowNodeType.LOOP)
    : null
  const isLoopNode = currentNode?.type === WorkflowNodeType.LOOP

  const loopVars =
    parentLoopNode || isLoopNode
      ? [
          { label: '当前项 (Item)', path: 'loop.item', type: 'object', source: 'loop' },
          { label: '当前索引 (Index)', path: 'loop.index', type: 'number', source: 'loop' },
        ]
      : []

  const allVars = [...loopVars, ...getStartNodeVariables(), ...getNodeVariables(), ...systemVars]

  // Filter by search
  const filteredVars = allVars
    .filter(
      v =>
        v.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.path.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(v => {
      if (activeTab === 'all') return true
      if (activeTab === 'upstream') return v.source === 'upstream' || v.source === 'loop'
      if (activeTab === 'global') return v.source === 'global'
      if (activeTab === 'system') return v.source === 'system'
      return true
    })

  // Grouping for display
  const groupedVars = filteredVars.reduce(
    (acc, v) => {
      const key =
        v.nodeLabel ||
        (v.source === 'system'
          ? 'System'
          : v.source === 'global'
            ? 'Global Parameters'
            : 'Loop Context')
      if (!acc[key]) acc[key] = []
      acc[key].push(v)
      return acc
    },
    {} as Record<string, typeof allVars>
  )

  // Helper for icons
  const getIcon = (type: string) => {
    switch (type) {
      case 'string':
        return <FileText size={14} className="text-slate-400" />
      case 'number':
        return <Hash size={14} className="text-blue-400" />
      case 'boolean':
        return <ToggleLeft size={14} className="text-orange-400" />
      case 'date':
        return <Calendar size={14} className="text-purple-400" />
      case 'array':
        return <LayoutList size={14} className="text-teal-400" />
      case 'object':
        return <Box size={14} className="text-indigo-400" />
      default:
        return <Box size={14} className="text-slate-400" />
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case WorkflowNodeType.API_CALL:
        return <Server size={14} className="text-blue-500" />
      case WorkflowNodeType.LLM:
        return <SparklesIcon />
      case WorkflowNodeType.SCRIPT:
        return <Code size={14} className="text-pink-500" />
      case WorkflowNodeType.CONDITION:
        return <GitBranch size={14} className="text-orange-500" />
      case WorkflowNodeType.START:
        return <PlayCircle size={14} className="text-emerald-500" />
      default:
        return <Database size={14} className="text-slate-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">选择变量</h3>
            <p className="text-xs text-slate-500 mt-1">从上游节点或全局上下文中选择变量</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="搜索变量名称或路径..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: '全部' },
              { id: 'upstream', label: '上游节点' },
              { id: 'global', label: '全局变量' },
              { id: 'system', label: '系统变量' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Variable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 bg-slate-50/30">
          {Object.entries(groupedVars).map(([groupName, vars]) => (
            <div
              key={groupName}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {groupName}
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {(vars as any[]).map((v: any, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSelect(`{{${v.path}}}`)
                      onClose()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors group text-left"
                  >
                    <div className="p-1.5 bg-slate-100 rounded group-hover:bg-white transition-colors">
                      {getIcon(v.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {v.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                          {v.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 truncate group-hover:text-indigo-500">
                        {v.path}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filteredVars.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Database size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">未找到匹配的变量</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SparklesIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-indigo-500"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
)

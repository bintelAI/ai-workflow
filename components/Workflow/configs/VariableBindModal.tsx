import React, { useMemo, useState } from 'react'
import {
  X,
  Search,
  FileText,
  Hash,
  ToggleLeft,
  Calendar,
  Box,
  LayoutList,
  Database,
} from 'lucide-react'
import { useWorkflowStore } from '../store/useWorkflowStore'
import { buildVariableCatalog, type WorkflowVariableMeta } from '../utils/workflowVariables'

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

  const allVars = useMemo(
    () =>
      buildVariableCatalog({
        nodes,
        edges,
        currentNodeId: selectedNodeId,
        globalVariables,
        scope,
      }).flatMap(group => group.variables),
    [nodes, edges, selectedNodeId, globalVariables, scope]
  )

  const filteredVars = allVars
    .filter(
      v =>
        v.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.path.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(v => {
      if (activeTab === 'all') return true
      if (activeTab === 'upstream') return v.scope === 'node' || v.scope === 'loop'
      if (activeTab === 'global') return v.scope === 'payload' || v.scope === 'global'
      if (activeTab === 'system') return v.scope === 'system'
      return true
    })

  const groupedVars = filteredVars.reduce(
    (acc, v) => {
      const key =
        v.nodeLabel ||
        (v.scope === 'system' ? 'System' : v.scope === 'global' || v.scope === 'payload' ? 'Global Parameters' : 'Loop Context')
      if (!acc[key]) acc[key] = []
      acc[key].push(v)
      return acc
    },
    {} as Record<string, WorkflowVariableMeta[]>
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

  const getNodeIcon = (_type: string) => {
    return <Database size={14} className="text-slate-500" />
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
                      onSelect(v.template)
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


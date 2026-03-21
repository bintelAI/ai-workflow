import React from 'react'
import { WorkflowNode } from '../types'
import { Box, Braces, FileText, ToggleLeft, Hash, List, Globe } from 'lucide-react'
import { getNodeOutputSchema } from '../utils/workflowVariables'

interface NodeOutputPreviewProps {
  node: WorkflowNode
}

interface OutputVariable {
  name: string
  type: string
  description: string
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'string':
      return <FileText size={14} className="text-slate-400" />
    case 'number':
      return <Hash size={14} className="text-blue-400" />
    case 'boolean':
      return <ToggleLeft size={14} className="text-orange-400" />
    case 'array':
      return <List size={14} className="text-teal-400" />
    case 'object':
      return <Box size={14} className="text-indigo-400" />
    case 'json':
      return <Braces size={14} className="text-yellow-500" />
    default:
      return <Box size={14} className="text-slate-400" />
  }
}

export const NodeOutputPreview: React.FC<NodeOutputPreviewProps> = ({ node }) => {
  const outputs = getNodeOutputSchema(node).map(item => ({
    name: item.field,
    type: item.type,
    description: item.description,
  }))

  if (outputs.length === 0) return null

  return (
    <div className="mt-6 pt-4 border-t border-slate-200">
      <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5 uppercase">
        <Globe size={12} className="text-indigo-500" />
        输出变量 (Output Variables)
      </h4>
      <div className="space-y-3 pl-1">
        {outputs.map((out, i) => (
          <div key={i} className="flex items-start gap-3 group">
            <div className="mt-0.5 p-1 bg-slate-50 rounded border border-slate-100 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors shrink-0">
              {getIconForType(out.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono font-bold text-slate-700">{out.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-medium">
                  {out.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{out.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

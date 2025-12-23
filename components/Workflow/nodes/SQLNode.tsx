import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { NodeData, SQLConfig } from '../../../types';
import { BaseNode } from './BaseNode';
import { Database, Code } from 'lucide-react';

const SQLNode = (props: NodeProps<NodeData>) => {
  const { data } = props;
  const config = (data.config || {}) as SQLConfig;
  const sql = config.sql || '';
  const databaseId = config.databaseId || 'default';

  const preview = (
    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <Database size={12} className="text-indigo-500" />
        <span className="font-medium uppercase tracking-wider">{databaseId}</span>
      </div>
      
      {sql ? (
        <div className="bg-slate-900 rounded-md p-2 flex gap-2 overflow-hidden border border-slate-800 shadow-inner">
          <Code size={12} className="text-indigo-400 shrink-0 mt-0.5" />
          <pre className="text-[10px] font-mono text-indigo-100 line-clamp-3 whitespace-pre-wrap leading-relaxed">
            {sql.trim()}
          </pre>
        </div>
      ) : (
        <div className="text-[10px] text-slate-400 italic py-1">
          未配置 SQL 语句
        </div>
      )}
    </div>
  );

  return (
    <BaseNode
      {...props}
    >
      {preview}
    </BaseNode>
  );
};

export default memo(SQLNode);

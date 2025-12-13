
import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { Repeat, PlayCircle, StopCircle } from 'lucide-react';
import { NodeData } from '../../../types';
import { useWorkflowStore } from '../store/useWorkflowStore';

const LoopNode = ({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  const { nodeExecutionStatus } = useWorkflowStore();
  const status = nodeExecutionStatus ? nodeExecutionStatus[id] : undefined;

  const getNodeColor = (status?: string) => {
      if (status === 'success') return 'border-emerald-500 bg-emerald-50/30';
      if (status === 'failed') return 'border-rose-500 bg-rose-50/30';
      if (status === 'running') return 'border-blue-400 bg-blue-50/30';
      return 'border-indigo-200 bg-slate-50/50';
  };

  return (
    <div className={`
      relative min-w-[300px] min-h-[200px] rounded-xl border-2 border-dashed transition-all duration-200 group flex flex-col
      ${getNodeColor(status)}
      ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
    `}
    style={{ width: '100%', height: '100%' }}
    >
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={300} 
        minHeight={200} 
        handleStyle={{ width: 8, height: 8, borderRadius: 4 }}
      />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-indigo-500 !w-4 !h-4 !-top-2.5 z-50 border-2 border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-indigo-100/80 backdrop-blur-sm rounded-t-lg border-b border-indigo-200">
        <div className="p-1.5 bg-indigo-500 rounded text-white shadow-sm">
            <Repeat size={16} />
        </div>
        <div className="flex-1">
            <h3 className="text-sm font-bold text-indigo-900">{data.label}</h3>
            <p className="text-[10px] text-indigo-700/70 truncate max-w-[200px]">
                {data.config?.targetArray ? `循环对象: ${data.config.targetArray}` : '请配置循环数组'}
            </p>
        </div>
      </div>

      {/* Body Area (Visual Guide) */}
      <div className="flex-1 relative p-4">
          <div className="absolute top-4 left-4 flex items-center gap-2 opacity-30 pointer-events-none">
             <PlayCircle size={14} className="text-slate-500"/>
             <span className="text-[10px] font-mono text-slate-500">Loop Start</span>
          </div>
          
          <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-30 pointer-events-none">
             <span className="text-[10px] font-mono text-slate-500">Loop End</span>
             <StopCircle size={14} className="text-slate-500"/>
          </div>

          {!data.config?.targetArray && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-indigo-300 font-medium">拖入节点至此区域</span>
              </div>
          )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-indigo-500 !w-4 !h-4 !-bottom-2.5 z-50 border-2 border-white"
      />
    </div>
  );
};

export default memo(LoopNode);


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  PlayCircle, 
  StopCircle, 
  CheckSquare, 
  GitFork, 
  Globe, 
  Bell,
  Clock,
  Database,
  Code,
  Send,
  GripVertical,
  GitMerge,
  Bot,
  Repeat
} from 'lucide-react';
import { WorkflowNodeType } from '../../types';
import { useWorkflowStore } from './store/useWorkflowStore';
import { SidebarProps } from './Workflow.types';

const DraggableNode = ({ type, label, icon: Icon, color }: { type: WorkflowNodeType, label: string, icon: any, color: string }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:shadow-md hover:border-indigo-300 transition-all active:cursor-grabbing group aspect-square"
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className={`p-2.5 rounded-lg bg-opacity-10 transition-transform group-hover:scale-110 ${color.replace('text-', 'bg-')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = () => {
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Get store data for filtering
  const { categories, activeCategoryId } = useWorkflowStore();
  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const allowedNodes = new Set(activeCategory?.allowedNodeTypes || Object.values(WorkflowNodeType));

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth > 180 && newWidth < 480) {
            setWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Helper to render only if allowed
  const RenderNode = ({ type, label, icon, color }: { type: WorkflowNodeType, label: string, icon: any, color: string }) => {
      if (!allowedNodes.has(type)) return null;
      return <DraggableNode type={type} label={label} icon={icon} color={color} />;
  };

  // Helper to check if a group has any visible children
  const hasVisibleNodes = (types: WorkflowNodeType[]) => {
      return types.some(t => allowedNodes.has(t));
  };

  return (
    <aside 
        ref={sidebarRef}
        className="bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 relative group"
        style={{ width: width }}
    >
      <div className="p-5 border-b border-slate-200 bg-white">
        <h2 className="font-bold text-slate-800">组件库</h2>
        <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">拖拽节点到画布</p>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[100px]">
                {activeCategory?.name || 'General'}
            </span>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* Basic Nodes Group */}
        {hasVisibleNodes([WorkflowNodeType.START, WorkflowNodeType.END]) && (
            <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">基础节点</h3>
            <div className="grid grid-cols-2 gap-3">
                <RenderNode 
                    type={WorkflowNodeType.START} 
                    label="开始" 
                    icon={PlayCircle} 
                    color="text-emerald-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.END} 
                    label="结束" 
                    icon={StopCircle} 
                    color="text-rose-500" 
                />
            </div>
            </div>
        )}

        {/* Logic Nodes Group */}
        {hasVisibleNodes([
            WorkflowNodeType.CONDITION, WorkflowNodeType.PARALLEL, 
            WorkflowNodeType.APPROVAL, WorkflowNodeType.CC, WorkflowNodeType.DELAY,
            WorkflowNodeType.LOOP
        ]) && (
            <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">逻辑控制</h3>
            <div className="grid grid-cols-2 gap-3">
                <RenderNode 
                    type={WorkflowNodeType.LOOP} 
                    label="循环执行" 
                    icon={Repeat} 
                    color="text-indigo-600" 
                />
                <RenderNode 
                    type={WorkflowNodeType.CONDITION} 
                    label="条件分支" 
                    icon={GitFork} 
                    color="text-amber-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.PARALLEL} 
                    label="并行分支" 
                    icon={GitMerge} 
                    color="text-teal-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.APPROVAL} 
                    label="审批节点" 
                    icon={CheckSquare} 
                    color="text-blue-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.CC} 
                    label="抄送节点" 
                    icon={Send} 
                    color="text-indigo-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.DELAY} 
                    label="延时等待" 
                    icon={Clock} 
                    color="text-yellow-500" 
                />
            </div>
            </div>
        )}

        {/* Extension Nodes Group */}
        {hasVisibleNodes([
            WorkflowNodeType.LLM, WorkflowNodeType.DATA_OP, 
            WorkflowNodeType.API_CALL, WorkflowNodeType.NOTIFICATION, WorkflowNodeType.SCRIPT
        ]) && (
            <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">功能扩展</h3>
            <div className="grid grid-cols-2 gap-3">
                <RenderNode 
                    type={WorkflowNodeType.LLM} 
                    label="LLM 模型" 
                    icon={Bot} 
                    color="text-fuchsia-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.DATA_OP} 
                    label="数据操作" 
                    icon={Database} 
                    color="text-cyan-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.API_CALL} 
                    label="API 调用" 
                    icon={Globe} 
                    color="text-violet-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.NOTIFICATION} 
                    label="消息通知" 
                    icon={Bell} 
                    color="text-orange-500" 
                />
                <RenderNode 
                    type={WorkflowNodeType.SCRIPT} 
                    label="脚本代码" 
                    icon={Code} 
                    color="text-slate-700" 
                />
            </div>
            </div>
        )}

        {!hasVisibleNodes(Object.values(WorkflowNodeType)) && (
            <div className="text-center p-4 text-slate-400 text-xs">
                当前模式未配置任何可用节点
            </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
         <p className="text-xs text-slate-400">FlowMaster v1.3</p>
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100"
        onMouseDown={startResizing}
      >
      </div>
    </aside>
  );
};



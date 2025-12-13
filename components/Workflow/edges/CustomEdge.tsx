
import React from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  EdgeProps, 
  getSmoothStepPath,
  useReactFlow
} from 'reactflow';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { Plus } from 'lucide-react';

export const CustomEdge: React.FC<EdgeProps> = ({ 
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
}) => {
  const { openEdgeMenu } = useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    // Get the exact position of the click in the flow coordinate system
    // This ensures the menu opens right next to the cursor/button
    const position = screenToFlowPosition({
        x: evt.clientX,
        y: evt.clientY
    });
    
    // Add offset to position the menu at bottom-right of the click point
    const menuPosition = {
        x: position.x + 15, 
        y: position.y + 15  
    };

    openEdgeMenu(id, menuPosition, source, target);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
            zIndex: 10,
          }}
          className="nodrag nopan"
        >
          {/* Wrapper with larger hit area (48x48px) */}
          <div 
             onClick={onEdgeClick}
             className="w-12 h-12 flex items-center justify-center cursor-pointer group"
          >
            <button
              className="w-5 h-5 bg-white border border-slate-300 group-hover:border-indigo-500 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 pointer-events-none"
              title="在此处插入节点"
            >
              <Plus className="w-3 h-3 transition-transform group-hover:scale-110" strokeWidth={3} />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

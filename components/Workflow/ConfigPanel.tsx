import React, { useState, useEffect, useCallback } from 'react';
import { useWorkflowStore } from "./store/useWorkflowStore";
import { WorkflowNodeType } from '../../types';
import { 
    X, Save, Trash2, Wand2
} from 'lucide-react';

// Import configuration components
import { LoopConfig } from './configs/LoopConfig';
import { StartConfig } from './configs/StartConfig';
import { EndConfig } from './configs/EndConfig';
import { ScriptConfig } from './configs/ScriptConfig';
import { LLMConfig } from './configs/LLMConfig';
import { APICallConfig } from './configs/APICallConfig';
import { ConditionConfig } from './configs/ConditionConfig';
import { DelayConfig } from './configs/DelayConfig';
import { NotificationConfig } from './configs/NotificationConfig';
import { ApprovalConfig } from './configs/ApprovalConfig';
import { DataOpConfig } from './configs/DataOpConfig';
import { CCConfig } from './configs/CCConfig';
import { NodeOutputPreview } from './configs/NodeOutputPreview';

// Import common components from configs/common.tsx
import { AIButton } from './configs/common';

const ConfigPanel: React.FC = () => {
  const { nodes, selectedNodeId, updateNodeData, setSelectedNode, deleteNode, aiAutocompleteConfig } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  // ... (Resizing logic)
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
      if (isResizing) {
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth > 300 && newWidth < 800) setPanelWidth(newWidth);
      }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  if (!selectedNode) return null; // Or empty state

  const handleChange = (field: string, value: any) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  const handleConfigChange = (key: string, value: any) => {
    const currentConfig = selectedNode.data.config || {};
    updateNodeData(selectedNode.id, {
      config: { ...currentConfig, [key]: value }
    });
  };

  const renderAdvancedConfig = () => {
      const config = selectedNode.data.config || {};
      
      switch (selectedNode.type) {
          case WorkflowNodeType.LOOP:
              return <LoopConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.START:
              return <StartConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.END:
              return <EndConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.SCRIPT:
              return <ScriptConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.LLM:
              return <LLMConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.API_CALL:
              return <APICallConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.CONDITION:
              return <ConditionConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.DELAY:
              return <DelayConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.NOTIFICATION:
              return <NotificationConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.APPROVAL:
              return <ApprovalConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.DATA_OP:
              return <DataOpConfig config={config} onConfigChange={handleConfigChange} />;
          case WorkflowNodeType.CC:
              return <CCConfig config={config} onConfigChange={handleConfigChange} />;
          default:
              return (
                 <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                     当前节点类型 ({selectedNode.type}) 暂无特定高级配置。
                 </div>
              );
      }
  };

  return (
    <aside 
        className="bg-white border-l border-slate-200 h-full flex flex-col shadow-xl z-20 relative group"
        style={{ width: panelWidth }}
    >
      <div 
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-30 flex items-center justify-center opacity-0 group-hover:opacity-100"
        onMouseDown={startResizing}
      />

      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
        <div>
           <h2 className="font-bold text-slate-800 flex items-center gap-2">
               节点配置
           </h2>
           <p className="text-xs text-slate-500">Type: {selectedNode.type}</p>
        </div>
        <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-5 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">节点名称</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => handleChange('label', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">描述</label>
                    <AIButton 
                        field="description" 
                        onGenerate={async (field) => {
                            setLoadingField(field);
                            try {
                                const context = selectedNode.data.label || selectedNode.type || 'generic';
                                const result = await aiAutocompleteConfig(field, context);
                                handleChange(field, result);
                            } finally { setLoadingField(null); }
                        }}
                        loadingField={loadingField}
                    />
                </div>
                <textarea
                  rows={2}
                  value={selectedNode.data.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="h-px bg-slate-200 my-2"></div>

            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                 <Wand2 size={14} className="text-indigo-500" /> 高级设置
               </h3>
               {renderAdvancedConfig()}

               <NodeOutputPreview node={selectedNode} />
            </div>
         </div>
      </div>

      <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
        <button 
            onClick={() => setSelectedNode(null)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
        >
            <Save size={16} /> 完成
        </button>
        <button 
            onClick={() => deleteNode(selectedNode.id)}
            className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
            <Trash2 size={16} />
        </button>
      </div>
    </aside>
  );
};

export default ConfigPanel;

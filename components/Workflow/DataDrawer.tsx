
import React, { useState, useEffect } from 'react';
import { useWorkflowStore, DEFAULT_DEV_INPUT } from './store/useWorkflowStore';
import { 
  X, Activity, CheckCircle2, XCircle, Code, ArrowRight, PlayCircle, Lightbulb, Eye, Bug, AlertTriangle, FileJson
} from 'lucide-react';
import { WorkflowNodeType } from '../../types';

export const DataDrawer: React.FC = () => {
  const { isDrawerOpen, toggleDrawer, simulationLogs, runSimulation, setSelectedNode, nodes } = useWorkflowStore();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'ai' | 'input'>('logs');
  
  // State for Input JSON editing
  const [inputJson, setInputJson] = useState(DEFAULT_DEV_INPUT);

  // Sync default input from Start Node when drawer opens or nodes change
  useEffect(() => {
    const startNode = nodes.find(n => n.type === WorkflowNodeType.START);
    if (startNode?.data.config?.devInput) {
        setInputJson(startNode.data.config.devInput);
    }
  }, [nodes, isDrawerOpen]);

  useEffect(() => {
    if (simulationLogs.length > 0) {
        setSelectedLogId(simulationLogs[0].stepId);
        // Auto-switch to AI tab if there's a failure
        const hasFailure = simulationLogs.some(l => l.status === 'failed');
        if (hasFailure) setActiveTab('ai');
    }
  }, [simulationLogs]);

  const selectedLog = simulationLogs.find(l => l.stepId === selectedLogId);
  const failedLogs = simulationLogs.filter(l => l.status === 'failed');

  const handleRun = () => {
      runSimulation(inputJson);
      if (activeTab === 'input') setActiveTab('logs');
  };

  const handleViewNode = (nodeId: string) => {
      if (nodeId) {
          setSelectedNode(nodeId);
      }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out z-30 flex flex-col ${isDrawerOpen ? 'h-[400px]' : 'h-0'}`}>
      {/* Header */}
      <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50 shrink-0">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <Activity className="text-indigo-600 w-5 h-5" />
                <h3 className="font-semibold text-slate-800">流程透视镜</h3>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-slate-200/50 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('logs')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'logs' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    运行日志
                </button>
                <button 
                    onClick={() => setActiveTab('input')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'input' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    模拟数据
                </button>
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'ai' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <SparklesIcon /> AI 洞察
                    {failedLogs.length > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">{failedLogs.length}</span>}
                </button>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <button onClick={handleRun} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
                <PlayCircle size={14} /> 重新模拟
             </button>
            <button onClick={() => { toggleDrawer(false); }} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 ml-2">
                <X size={18} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'logs' && (
            <>
                {/* Left: Timeline */}
                <div className="w-1/4 border-r border-slate-200 overflow-y-auto bg-white p-2">
                    {simulationLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Activity size={24} className="mb-2 opacity-50" />
                            <p className="text-xs">暂无数据，请运行模拟</p>
                        </div>
                    ) : (
                        <div className="relative pl-3 space-y-2 before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {simulationLogs.map((log) => (
                                <div 
                                    key={log.stepId} 
                                    onClick={() => setSelectedLogId(log.stepId)}
                                    className={`relative cursor-pointer group pl-6 transition-colors rounded-lg p-2 -ml-2 ${selectedLogId === log.stepId ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                >
                                    <div className={`absolute left-[5px] top-3.5 w-2.5 h-2.5 rounded-full border-2 bg-white z-10 ${log.status === 'success' ? 'border-emerald-500' : 'border-red-500'}`}></div>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`font-medium text-xs truncate max-w-[120px] ${log.status === 'failed' ? 'text-red-600' : 'text-slate-800'}`}>{log.nodeLabel}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <span className={`flex items-center gap-0.5 ${log.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {log.status === 'success' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                            {log.status === 'success' ? '成功' : '失败'}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span>{log.duration}ms</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Right: Data (Side by Side) */}
                <div className="flex-1 bg-slate-50 p-3 overflow-hidden flex gap-3">
                    {selectedLog ? (
                        <>
                            {/* Input Panel */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden h-full">
                                <div className="h-8 border-b border-slate-100 flex items-center px-3 gap-2 bg-slate-50/50 text-xs font-semibold text-slate-600 shrink-0">
                                    <ArrowRight size={14} className="text-indigo-500" /> 输入数据 (Input)
                                </div>
                                <div className="flex-1 p-3 overflow-auto">
                                    <pre className="text-xs font-mono text-slate-600">{JSON.stringify(selectedLog.input, null, 2)}</pre>
                                </div>
                            </div>
                            
                            {/* Output Panel */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden h-full">
                                <div className="h-8 border-b border-slate-100 flex items-center px-3 gap-2 bg-slate-50/50 text-xs font-semibold text-slate-600 shrink-0">
                                    <Code size={14} className={selectedLog.status === 'success' ? 'text-emerald-500' : 'text-red-500'} /> 
                                    {selectedLog.status === 'success' ? '输出结果 (Output)' : '错误详情 (Error Detail)'}
                                </div>
                                <div className="flex-1 p-3 overflow-auto">
                                    <pre className={`text-xs font-mono ${selectedLog.status === 'failed' ? 'text-red-600' : 'text-slate-600'}`}>
                                        {selectedLog.errorMessage 
                                            ? JSON.stringify({ error: selectedLog.errorMessage, ...selectedLog.output }, null, 2)
                                            : JSON.stringify(selectedLog.output, null, 2)
                                        }
                                    </pre>
                                </div>
                            </div>
                        </>
                    ) : <div className="w-full h-full flex items-center justify-center text-slate-400"><p>选择左侧步骤查看详情</p></div>}
                </div>
            </>
        )}

        {activeTab === 'input' && (
             <div className="flex-1 flex gap-4 p-4 bg-slate-50 overflow-hidden">
                <div className="w-64 shrink-0 pt-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <FileJson size={16} className="text-indigo-500"/> 全局变量注入
                    </h4>
                    <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
                        <p>在此修改 Start 节点的输入数据 (JSON 格式)。</p>
                        <p>点击上方 <span className="font-bold text-indigo-600">重新模拟</span> 后，该 JSON 将作为 <code>payload</code> 传递给流程中的所有节点。</p>
                        <div className="bg-white border border-slate-200 p-2 rounded text-[10px] text-slate-400 mt-4">
                            提示: 您可以在流程配置面板中，通过“模拟数据”开关永久保存此配置。
                        </div>
                    </div>
                </div>
                <div className="flex-1 h-full">
                     <textarea
                         className="w-full h-full bg-white border border-slate-300 rounded-lg p-4 text-xs font-mono text-slate-700 resize-none focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                         value={inputJson}
                         onChange={(e) => setInputJson(e.target.value)}
                         spellCheck={false}
                         placeholder="{ ... }"
                    />
                </div>
             </div>
        )}

        {activeTab === 'ai' && (
            // AI Analysis Tab
            <div className="flex-1 p-6 bg-slate-50 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Summary Card */}
                    <div className={`bg-white rounded-xl p-4 shadow-sm border flex gap-4 ${failedLogs.length > 0 ? 'border-red-100' : 'border-slate-200'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${failedLogs.length > 0 ? 'bg-gradient-to-br from-red-500 to-orange-600 shadow-red-200' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'}`}>
                            {failedLogs.length > 0 ? <Bug size={24} /> : <CheckCircle2 size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                                AI 全局诊断报告 
                                {failedLogs.length > 0 
                                    ? <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full border border-red-200">发现异常</span>
                                    : <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">运行正常</span>
                                }
                            </h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                {failedLogs.length > 0 
                                    ? `本次模拟运行共 ${simulationLogs.length} 个步骤，其中 ${failedLogs.length} 个步骤发生错误。AI 已分析错误日志，并定位到具体节点。`
                                    : `基于本次 ${simulationLogs.length} 个步骤的模拟运行，流程整体健康度为 100%。逻辑通顺，未发现阻断性错误。`
                                }
                            </p>
                        </div>
                    </div>

                    {/* Error Analysis Section */}
                    {failedLogs.length > 0 && (
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                             <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-500" /> 故障根因分析
                            </h4>
                            <div className="space-y-3">
                                {failedLogs.map((log, i) => (
                                    <div key={i} className="flex flex-col gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                                <span className="text-xs font-bold text-slate-700">{log.nodeLabel}</span>
                                                <span className="text-[10px] text-slate-400">({log.nodeType})</span>
                                            </div>
                                            <button 
                                                onClick={() => handleViewNode(log.nodeId)}
                                                className="text-indigo-600 hover:text-indigo-800 text-[10px] flex items-center gap-1 hover:underline"
                                            >
                                                <Eye size={12} /> 定位节点
                                            </button>
                                        </div>
                                        <div className="text-[10px] text-red-700 font-mono ml-3.5 bg-white/50 p-2 rounded border border-red-100/50">
                                            {log.errorMessage || 'Unknown Error'}
                                        </div>
                                        <div className="ml-3.5 flex items-start gap-1.5">
                                            <Lightbulb size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                            <span className="text-xs text-slate-600">
                                                <strong>AI 建议：</strong>
                                                {log.nodeType === 'api_call' && "检查目标 API URL 是否可访问，或增加超时重试配置。"}
                                                {log.nodeType === 'approval' && "检查审批条件设置，确保金额或参数未超出自动处理阈值。"}
                                                {!['api_call', 'approval'].includes(log.nodeType) && "检查该节点的输入参数映射是否正确。"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                                <Lightbulb size={16} className="text-amber-500" /> 性能优化建议
                            </h4>
                            <ul className="space-y-2">
                                {simulationLogs.filter(l => l.duration > 300).slice(0, 3).map((l, i) => (
                                    <li key={i} className="flex items-start justify-between gap-3 text-xs text-slate-600 bg-slate-50 p-2 rounded hover:bg-slate-100 transition-colors">
                                        <div className="flex gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                                            <span>节点 "{l.nodeLabel}" 耗时较长 ({l.duration}ms)。</span>
                                        </div>
                                    </li>
                                ))}
                                {simulationLogs.filter(l => l.duration > 300).length === 0 && (
                                    <li className="text-xs text-slate-500 italic">暂无明显的性能瓶颈。</li>
                                )}
                            </ul>
                        </div>
                        
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                                <Activity size={16} className="text-blue-500" /> 执行耗时分布
                            </h4>
                             <div className="h-24 flex items-end justify-between gap-1 px-2">
                                 {simulationLogs.map((log, i) => (
                                     <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                         <div 
                                            className={`w-full rounded-t transition-colors ${log.status === 'failed' ? 'bg-red-400 hover:bg-red-500' : 'bg-indigo-200 hover:bg-indigo-400'}`}
                                            style={{ height: `${Math.min(log.duration / 5, 100)}%` }}
                                         ></div>
                                         {/* Tooltip */}
                                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none shadow-lg">
                                             {log.nodeLabel}: {log.duration}ms
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const SparklesIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);



import React from 'react';
import { WorkflowNode, WorkflowNodeType } from '../../../types';
import { Box, Braces, FileText, ToggleLeft, Hash, List, Globe } from 'lucide-react';

interface NodeOutputPreviewProps {
    node: WorkflowNode;
}

interface OutputVariable {
    name: string;
    type: string;
    description: string;
}

const getIconForType = (type: string) => {
    switch (type) {
        case 'string': return <FileText size={14} className="text-slate-400" />;
        case 'number': return <Hash size={14} className="text-blue-400" />;
        case 'boolean': return <ToggleLeft size={14} className="text-orange-400" />;
        case 'array': return <List size={14} className="text-teal-400" />;
        case 'object': return <Box size={14} className="text-indigo-400" />;
        case 'json': return <Braces size={14} className="text-yellow-500" />;
        default: return <Box size={14} className="text-slate-400" />;
    }
}

export const NodeOutputPreview: React.FC<NodeOutputPreviewProps> = ({ node }) => {
    // Determine outputs based on node type
    const getOutputs = (): OutputVariable[] => {
        const config = node.data.config || {};
        
        switch (node.type) {
            case WorkflowNodeType.START:
                // Parse devInput for Start Node
                try {
                    const devInput = config.devInput || '{}';
                    const parsed = JSON.parse(devInput);
                    return Object.keys(parsed).map(key => ({
                        name: key,
                        type: Array.isArray(parsed[key]) ? 'array' : typeof parsed[key],
                        description: '全局输入变量 (Global Input)'
                    }));
                } catch (e) {
                    return [{ name: 'payload', type: 'object', description: 'Root Payload Object' }];
                }
            
            case WorkflowNodeType.LLM:
                return [
                    { name: 'text', type: 'string', description: '生成内容 (Generated Content)' },
                    { name: 'reasoning_content', type: 'string', description: '推理内容 (Chain of Thought)' },
                    { name: 'usage', type: 'object', description: '模型用量信息 (Token Usage)' }
                ];
                
            case WorkflowNodeType.API_CALL:
                return [
                    { name: 'status', type: 'number', description: 'HTTP 状态码 (Status Code)' },
                    { name: 'data', type: 'any', description: '响应数据 (Response Body)' },
                    { name: 'headers', type: 'object', description: '响应头 (Response Headers)' },
                    { name: 'raw_data', type: 'any', description: '原始响应 (Raw Data)' }
                ];
                
            case WorkflowNodeType.CONDITION:
                return [
                    { name: 'result', type: 'boolean', description: '条件执行结果' },
                    { name: 'next_path', type: 'string', description: '执行分支路径 (true/false)' }
                ];
                
            case WorkflowNodeType.LOOP:
                const outputs = [
                    { name: 'loop_results', type: 'array', description: '聚合所有迭代结果 (All Results)' },
                    { name: 'count', type: 'number', description: '迭代总次数 (Total Count)' }
                ];
                if (config.exportOutput) {
                     outputs.push({ name: 'export_value', type: 'array', description: `指定变量聚合: ${config.exportOutput}` });
                }
                return outputs;
                
            case WorkflowNodeType.SCRIPT:
                return [
                    { name: 'result', type: 'any', description: '脚本执行结果 (Execution Result)' }
                ];
                
            case WorkflowNodeType.APPROVAL:
                return [
                    { name: 'approved', type: 'boolean', description: '审批结果 (Status)' },
                    { name: 'comment', type: 'string', description: '审批意见 (Comments)' },
                    { name: 'approver', type: 'string', description: '审批人 (Approver)' },
                    { name: 'approval_time', type: 'string', description: '审批时间 (Time)' }
                ];

            case WorkflowNodeType.DATA_OP:
                return [
                    { name: 'result', type: 'any', description: '操作结果 (Operation Result)' }
                ];
            
            case WorkflowNodeType.DELAY:
                return [{ name: 'processed', type: 'boolean', description: '延迟完成状态' }];
                
            case WorkflowNodeType.NOTIFICATION:
                return [{ name: 'status', type: 'string', description: '通知发送状态' }];
                
            case WorkflowNodeType.CC:
                 return [{ name: 'status', type: 'string', description: '抄送状态' }];
                 
            case WorkflowNodeType.END:
                return []; // End nodes don't produce outputs for other nodes

            default:
                return [{ name: 'processed', type: 'boolean', description: '节点执行状态' }];
        }
    };

    const outputs = getOutputs();

    if (outputs.length === 0) return null;

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
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                                {out.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

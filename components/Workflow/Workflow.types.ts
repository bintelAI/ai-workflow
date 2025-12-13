import { NodeProps, Edge } from 'reactflow';
import { WorkflowNodeType } from '../../../types';

/**
 * 节点数据类型
 */
export interface NodeData {
  label: string;
  description?: string;
  config?: Record<string, any>;
  icon?: string;
  status?: 'idle' | 'running' | 'completed' | 'error';
}

/**
 * 工作流节点类型
 */
export type WorkflowNode = NodeProps<NodeData>;

/**
 * 工作流边类型
 */
export type WorkflowEdge = Edge;

/**
 * 配置面板Props
 */
export interface ConfigPanelProps {
  selectedNodeId: string | null;
  nodeType: WorkflowNodeType | null;
  config: Record<string, any> | undefined;
  onConfigChange: (key: string, value: any) => void;
}

/**
 * 侧边栏Props
 */
export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * AI命令中心Props
 */
export interface AICommandCenterProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * 数据抽屉Props
 */
export interface DataDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * 设置模态框Props
 */
export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 节点配置通用Props
 */
export interface NodeConfigProps {
  config: Record<string, any>;
  onConfigChange: (key: string, value: any) => void;
}

/**
 * 工作流画布Props
 */
export interface WorkflowCanvasProps {
  // 可以根据实际需求添加Props
}

import {
  WorkflowStoreState,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,
} from "../../types";
import { flowInfoApi } from "@ai-flow/src/api/flow";
import {
  exportToBackend,
  importFromBackend,
} from "../../adapters/backendAdapter";
import type { FlowInfoEntity } from "@ai-flow/src/types/flow";
import {
  getPluginMode,
  getPluginModeByCategoryId,
  getPluginModeByFlowType,
  type WorkflowPluginModeType,
} from "../../config/pluginModeRegistry";
import { getUnsupportedPublishNodeTypes } from "../../config/nodeCapabilities";

export interface FlowState {
  flowInfo: FlowInfoEntity | null;
  flowList: FlowInfoEntity[];
  isFlowLoading: boolean;
  isFlowSaving: boolean;
  isExecuting: boolean;
  executionResult: any;
  teamId: string | null;
  flowSchemaVersion: 2 | null;
  flowLoadGeneration: number;
}

export interface FlowActions {
  loadFlow: (flowId: number, teamId?: string) => Promise<void>;
  saveFlow: () => Promise<void>;
  upgradeLegacyFlow: () => Promise<void>;
  loadFlowList: (params?: {
    page?: number;
    size?: number;
    teamId?: string;
  }) => Promise<void>;
  createFlow: (
    data: Partial<FlowInfoEntity> & { teamId?: string },
  ) => Promise<FlowInfoEntity>;
  updateFlow: (
    data: Partial<FlowInfoEntity> & { teamId?: string },
  ) => Promise<void>;
  deleteFlow: (id: number, teamId?: string) => Promise<void>;
  releaseFlow: (pluginModeType?: WorkflowPluginModeType) => Promise<void>;
  setFlowInfo: (info: FlowInfoEntity | null) => void;
  setExecuting: (isExecuting: boolean) => void;
  setExecutionResult: (result: any) => void;
  setTeamId: (teamId: string | null) => void;
  setFlowSchemaVersion: (version: 2 | null) => void;
  replaceWithPreview: (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    schemaVersion: 2 | null,
  ) => void;
}

export type FlowStore = FlowState & FlowActions;

const initialFlowState: FlowState = {
  flowInfo: null,
  flowList: [],
  isFlowLoading: false,
  isFlowSaving: false,
  isExecuting: false,
  executionResult: null,
  teamId: null,
  flowSchemaVersion: 2,
  flowLoadGeneration: 0,
};

const assertNodesPublishable = (
  state: any,
  pluginModeType?: WorkflowPluginModeType,
) => {
  const pluginMode = pluginModeType
    ? getPluginMode(pluginModeType)
    : getPluginModeByCategoryId(state.activeCategoryId) ||
      getPluginModeByFlowType(state.flowInfo?.type);
  const unsupportedNodeTypes = getUnsupportedPublishNodeTypes(
    (state.nodes as WorkflowNode[]).map(
      (node) => node.type as WorkflowNodeType,
    ),
    pluginMode.type,
  );
  if (unsupportedNodeTypes.length > 0) {
    throw new Error(
      `当前流程包含不可发布节点: ${unsupportedNodeTypes.join(", ")}`,
    );
  }
};

const getUsageTypeForPluginMode = (
  pluginModeType: ReturnType<typeof getPluginModeByFlowType>["type"],
  currentUsageType?: FlowInfoEntity["usageType"],
): NonNullable<FlowInfoEntity["usageType"]> => {
  if (pluginModeType === "approval") return "approval";
  if (pluginModeType === "automation") return "automation";
  if (pluginModeType === "ai") return "ai_analysis";
  return currentUsageType || "general";
};

export const createFlowActions = (set: any, get: any): FlowStore => ({
  ...initialFlowState,

  loadFlow: async (flowId: number, teamId?: string) => {
    const currentTeamId = teamId || get().teamId;
    const loadGeneration = Number(get().flowLoadGeneration || 0) + 1;
    set({
      isFlowLoading: true,
      flowInfo: null,
      flowSchemaVersion: null,
      flowLoadGeneration: loadGeneration,
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
    try {
      const res = await flowInfoApi.info(currentTeamId || "", flowId);
      if (get().flowLoadGeneration !== loadGeneration) return;
      const flowInfo = res.data;

      if (!flowInfo) {
        // 当检查不到数据的时候 直接给他一个开始和结束节点
        const defaultNodes: WorkflowNode[] = [
          {
            id: "1",
            type: WorkflowNodeType.START,
            position: { x: 250, y: 50 },
            data: {
              label: "流程开始",
              description: "Webhook 触发",
              config: {
                devMode: true,
                devInput: '{\n  "content": ""\n}',
                variables: [
                  {
                    name: "content",
                    displayName: "输入的内容",
                    type: "text",
                    required: false,
                    hidden: false,
                  },
                ],
              },
            },
          },
          {
            id: "2",
            type: WorkflowNodeType.END,
            position: { x: 250, y: 250 },
            data: {
              label: "流程结束",
              description: "流程执行完成",
            },
          },
        ];
        const defaultEdges: WorkflowEdge[] = [
          {
            id: "e1-2",
            source: "1",
            target: "2",
            type: "custom",
          },
        ];
        get().setWorkflow(defaultNodes, defaultEdges);
        set({ isFlowLoading: false, flowSchemaVersion: 2 });
        return;
      }

      const pluginMode = getPluginModeByFlowType(flowInfo?.type);
      set({ flowInfo, activeCategoryId: pluginMode.categoryId });

      const hasStoredDraft =
        flowInfo?.draft && Object.keys(flowInfo.draft).length > 0;
      if (hasStoredDraft) {
        const { nodes, edges, flowSchemaVersion } = importFromBackend(
          flowInfo.draft,
        );
        get().setWorkflow(nodes as WorkflowNode[], edges as WorkflowEdge[]);
        set({ flowSchemaVersion });
      } else {
        // 如果有 flowInfo 但没有 draft，也给默认节点
        const defaultNodes: WorkflowNode[] = [
          {
            id: "1",
            type: WorkflowNodeType.START,
            position: { x: 250, y: 50 },
            data: {
              label: "流程开始",
              description: "Webhook 触发",
              config: {
                devMode: true,
                devInput: '{\n  "content": ""\n}',
                variables: [
                  {
                    name: "content",
                    displayName: "输入的内容",
                    type: "text",
                    required: false,
                    hidden: false,
                  },
                ],
              },
            },
          },
          {
            id: "2",
            type: WorkflowNodeType.END,
            position: { x: 250, y: 250 },
            data: {
              label: "流程结束",
              description: "流程执行完成",
            },
          },
        ];
        const defaultEdges: WorkflowEdge[] = [
          {
            id: "e1-2",
            source: "1",
            target: "2",
            type: "custom",
          },
        ];
        get().setWorkflow(defaultNodes, defaultEdges);
        set({ flowSchemaVersion: 2 });
      }
    } catch (error) {
      console.error("Failed to load flow:", error);
      if (get().flowLoadGeneration === loadGeneration) {
        set({
          flowInfo: null,
          flowSchemaVersion: null,
          nodes: [],
          edges: [],
          selectedNodeId: null,
        });
      }
      throw error;
    } finally {
      if (get().flowLoadGeneration === loadGeneration) {
        set({ isFlowLoading: false });
      }
    }
  },

  saveFlow: async () => {
    const { flowInfo, nodes, edges, teamId, flowSchemaVersion } = get();
    if (!flowInfo?.id || !teamId) return;
    if (flowSchemaVersion !== 2) {
      throw new Error("旧版工作流仅支持只读查看，不能直接保存为 V2");
    }
    assertNodesPublishable(get());

    set({ isFlowSaving: true });
    try {
      const draft = exportToBackend({ nodes, edges } as any);
      await flowInfoApi.save(teamId, flowInfo.id, draft);
    } catch (error) {
      console.error("Failed to save flow:", error);
      throw error;
    } finally {
      set({ isFlowSaving: false });
    }
  },

  upgradeLegacyFlow: async () => {
    const { flowInfo, nodes, edges, teamId, flowSchemaVersion } = get();
    if (!flowInfo?.id || !teamId || flowSchemaVersion === 2) return;
    assertNodesPublishable(get());

    set({ isFlowSaving: true });
    try {
      const draft = exportToBackend({ nodes, edges } as any);
      await flowInfoApi.save(teamId, flowInfo.id, draft);
      set({
        flowInfo: { ...flowInfo, draft },
        flowSchemaVersion: 2,
      });
    } catch (error) {
      console.error("Failed to upgrade legacy flow:", error);
      throw error;
    } finally {
      set({ isFlowSaving: false });
    }
  },

  loadFlowList: async (params = { page: 1, size: 20 }) => {
    const teamId = params.teamId || get().teamId;
    if (!teamId) return;
    set({ isFlowLoading: true });
    try {
      const res = await flowInfoApi.page(teamId, params);
      set({ flowList: res.data.list || [] });
    } catch (error) {
      console.error("Failed to load flow list:", error);
      throw error;
    } finally {
      set({ isFlowLoading: false });
    }
  },

  createFlow: async (data: Partial<FlowInfoEntity> & { teamId?: string }) => {
    const teamId = data.teamId || get().teamId;
    if (!teamId) {
      throw new Error("团队ID不能为空");
    }
    try {
      const { teamId: _teamId, ...payload } = data;
      const res = await flowInfoApi.add(teamId, payload);
      const newFlow = res.data;
      set((state: any) => ({ flowList: [...state.flowList, newFlow] }));
      return newFlow;
    } catch (error) {
      console.error("Failed to create flow:", error);
      throw error;
    }
  },

  updateFlow: async (data: Partial<FlowInfoEntity> & { teamId?: string }) => {
    const teamId = data.teamId || get().teamId;
    if (!teamId) {
      throw new Error("团队ID不能为空");
    }
    try {
      const { teamId: _teamId, ...payload } = data;
      await flowInfoApi.update(teamId, payload);
      set((state: any) => ({
        flowInfo:
          state.flowInfo?.id === data.id
            ? { ...state.flowInfo, ...data }
            : state.flowInfo,
        flowList: state.flowList.map((f: any) =>
          f.id === data.id ? { ...f, ...data } : f,
        ),
      }));
    } catch (error) {
      console.error("Failed to update flow:", error);
      throw error;
    }
  },

  deleteFlow: async (id: number, teamId?: string) => {
    const currentTeamId = teamId || get().teamId;
    if (!currentTeamId) {
      throw new Error("团队ID不能为空");
    }
    try {
      await flowInfoApi.delete(currentTeamId, id);
      set((state: any) => ({
        flowList: state.flowList.filter((f: any) => f.id !== id),
        flowInfo: state.flowInfo?.id === id ? null : state.flowInfo,
      }));
    } catch (error) {
      console.error("Failed to delete flow:", error);
      throw error;
    }
  },

  releaseFlow: async (pluginModeType) => {
    const { flowInfo, teamId, flowSchemaVersion } = get();
    if (!flowInfo?.id || !teamId) return;
    if (flowSchemaVersion !== 2) {
      throw new Error("旧版工作流仅支持只读查看，不能作为 V2 发布");
    }

    assertNodesPublishable(get(), pluginModeType);

    try {
      const pluginMode = pluginModeType
        ? getPluginMode(pluginModeType)
        : getPluginModeByCategoryId(get().activeCategoryId) ||
          getPluginModeByFlowType(flowInfo.type);
      const usageType = getUsageTypeForPluginMode(
        pluginMode.type,
        flowInfo.usageType,
      );
      if (usageType !== flowInfo.usageType) {
        const usageTypeRes = await flowInfoApi.setUsageType(
          teamId,
          flowInfo.id,
          usageType,
        );
        set((state: any) => ({
          flowInfo: state.flowInfo
            ? {
                ...state.flowInfo,
                ...(usageTypeRes.data || {}),
                usageType,
              }
            : null,
        }));
      }
      const res = await flowInfoApi.release(teamId, flowInfo.id);
      set((state: any) => ({
        flowInfo: state.flowInfo
          ? {
              ...state.flowInfo,
              ...(res.data || {}),
              status: 1,
              version: res.data?.version || state.flowInfo.version,
              releaseTime: res.data?.releaseTime || new Date().toISOString(),
            }
          : null,
      }));
    } catch (error) {
      console.error("Failed to release flow:", error);
      throw error;
    }
  },

  setFlowInfo: (info) => set({ flowInfo: info }),
  setExecuting: (isExecuting) => set({ isExecuting }),
  setExecutionResult: (result) => set({ executionResult: result }),
  setTeamId: (teamId) => set({ teamId }),
  setFlowSchemaVersion: (flowSchemaVersion) => set({ flowSchemaVersion }),
  replaceWithPreview: (nodes, edges, flowSchemaVersion) => {
    const flowLoadGeneration = Number(get().flowLoadGeneration || 0) + 1;
    set({
      nodes,
      edges,
      flowSchemaVersion,
      flowLoadGeneration,
      flowInfo: null,
      selectedNodeId: null,
      isFlowLoading: false,
    });
  },
});

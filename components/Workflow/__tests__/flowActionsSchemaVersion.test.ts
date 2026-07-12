import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFlowActions } from "../store/modules/flowActions";
import { WorkflowNodeType } from "../types";

const flowInfoApiMocks = vi.hoisted(() => ({
  info: vi.fn(),
  save: vi.fn(),
  setUsageType: vi.fn(),
  release: vi.fn(),
}));

vi.mock("@ai-flow/src/api/flow", () => ({
  flowInfoApi: flowInfoApiMocks,
}));

const createActions = (overrides: Record<string, any> = {}) => {
  let state = {
    flowInfo: { id: 11, type: 1 },
    teamId: "team-1",
    nodes: [],
    edges: [],
    flowSchemaVersion: 2,
    activeCategoryId: "general",
    selectedNodeId: "old-selected",
    ...overrides,
  };
  const set = (update: any) => {
    state = {
      ...state,
      ...(typeof update === "function" ? update(state) : update),
    };
  };
  const get = () => state;

  state = {
    ...state,
    setWorkflow: vi.fn((nodes, edges) => {
      state = { ...state, nodes, edges };
    }),
  } as any;

  return { actions: createFlowActions(set, get), getState: get };
};

describe("flow actions V2 publication guards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not save a legacy graph without schemaVersion", async () => {
    const { actions } = createActions({ flowSchemaVersion: null });

    await expect(actions.saveFlow()).rejects.toThrow(
      "旧版工作流仅支持只读查看",
    );
    expect(flowInfoApiMocks.save).not.toHaveBeenCalled();
  });

  it("does not release a legacy graph without schemaVersion", async () => {
    const { actions } = createActions({ flowSchemaVersion: null });

    await expect(actions.releaseFlow()).rejects.toThrow(
      "旧版工作流仅支持只读查看",
    );
    expect(flowInfoApiMocks.release).not.toHaveBeenCalled();
  });

  it("explicitly upgrades a loaded legacy graph before enabling edits", async () => {
    flowInfoApiMocks.save.mockResolvedValueOnce({ data: { id: 11 } });
    const { actions, getState } = createActions({
      flowSchemaVersion: null,
      nodes: [
        { id: "start", type: WorkflowNodeType.START, data: {} },
        { id: "end", type: WorkflowNodeType.END, data: {} },
      ],
      edges: [{ id: "edge", source: "start", target: "end" }],
    });

    await actions.upgradeLegacyFlow();

    expect(flowInfoApiMocks.save).toHaveBeenCalledWith(
      "team-1",
      11,
      expect.objectContaining({ schemaVersion: 2 }),
    );
    expect(getState().flowSchemaVersion).toBe(2);
  });

  it("does not release V2 graphs containing nodes outside the mode publish set", async () => {
    const { actions } = createActions({
      nodes: [{ id: "delay-1", type: WorkflowNodeType.DELAY, data: {} }],
    });

    await expect(actions.releaseFlow()).rejects.toThrow(
      "当前流程包含不可发布节点: delay",
    );
    expect(flowInfoApiMocks.release).not.toHaveBeenCalled();
  });

  it("does not save V2 graphs containing nodes outside the mode publish set", async () => {
    const { actions } = createActions({
      nodes: [{ id: "delay-1", type: WorkflowNodeType.DELAY, data: {} }],
    });

    await expect(actions.saveFlow()).rejects.toThrow(
      "当前流程包含不可发布节点: delay",
    );
    expect(flowInfoApiMocks.save).not.toHaveBeenCalled();
  });

  it("clears flow A and rethrows when loading flow B fails", async () => {
    flowInfoApiMocks.info.mockRejectedValueOnce(new Error("network failed"));
    const { actions, getState } = createActions({
      flowInfo: { id: 1, name: "flow A", type: 1 },
      nodes: [{ id: "start-a", type: WorkflowNodeType.START, data: {} }],
    });

    await expect(actions.loadFlow(2, "team-1")).rejects.toThrow(
      "network failed",
    );

    expect(getState().flowInfo).toBeNull();
    expect(getState().flowSchemaVersion).toBeNull();
    expect(getState().nodes).toEqual([]);
    expect(getState().edges).toEqual([]);
    expect(getState().selectedNodeId).toBeNull();
    await actions.saveFlow();
    expect(flowInfoApiMocks.save).not.toHaveBeenCalled();
  });

  it("does not let a late load response overwrite an atomic preview replacement", async () => {
    let resolveLoad: (value: any) => void = () => undefined;
    flowInfoApiMocks.info.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const { actions, getState } = createActions();

    const pendingLoad = actions.loadFlow(33, "team-1");
    actions.replaceWithPreview(
      [{ id: "preview", type: WorkflowNodeType.START, data: {} }] as any,
      [],
      null,
    );
    resolveLoad({
      data: {
        id: 33,
        type: 1,
        draft: { schemaVersion: 2, nodes: [], edges: [] },
      },
    });
    await pendingLoad;

    expect(getState().flowInfo).toBeNull();
    expect(getState().flowSchemaVersion).toBeNull();
    expect(getState().nodes.map((node: any) => node.id)).toEqual(["preview"]);
  });

  it("treats a newly created flow without draft as V2 and allows save and release", async () => {
    flowInfoApiMocks.info.mockResolvedValueOnce({
      data: { id: 22, type: 1, usageType: "general" },
    });
    flowInfoApiMocks.save.mockResolvedValueOnce({ data: { id: 22 } });
    flowInfoApiMocks.release.mockResolvedValueOnce({ data: { id: 22 } });
    const { actions, getState } = createActions();

    await actions.loadFlow(22, "team-1");
    await actions.saveFlow();
    await actions.releaseFlow();

    expect(getState().flowSchemaVersion).toBe(2);
    expect(flowInfoApiMocks.save).toHaveBeenCalledWith(
      "team-1",
      22,
      expect.objectContaining({ schemaVersion: 2 }),
    );
    expect(flowInfoApiMocks.release).toHaveBeenCalledWith("team-1", 22);
  });

  it("treats an empty draft object from a newly created plugin as a new V2 flow", async () => {
    flowInfoApiMocks.info.mockResolvedValueOnce({
      data: {
        id: 30,
        type: 1,
        usageType: "ai_analysis",
        draft: {},
      },
    });
    const { actions, getState } = createActions();

    await actions.loadFlow(30, "team-1");

    expect(getState().flowSchemaVersion).toBe(2);
    expect(getState().nodes.map((node: any) => node.type)).toEqual([
      WorkflowNodeType.START,
      WorkflowNodeType.END,
    ]);
  });

  it("syncs approval usage type before releasing an approval workflow", async () => {
    flowInfoApiMocks.setUsageType.mockResolvedValueOnce({
      data: { id: 11, type: 3, usageType: "approval" },
    });
    flowInfoApiMocks.release.mockResolvedValueOnce({
      data: { id: 11, type: 3, usageType: "approval" },
    });
    const { actions, getState } = createActions({
      flowInfo: { id: 11, type: 3, usageType: "general" },
      activeCategoryId: "business_approval",
      nodes: [
        { id: "approval-1", type: WorkflowNodeType.APPROVAL, data: {} },
      ],
    });

    await actions.releaseFlow();

    expect(flowInfoApiMocks.setUsageType).toHaveBeenCalledWith(
      "team-1",
      11,
      "approval",
    );
    expect(flowInfoApiMocks.setUsageType.mock.invocationCallOrder[0]).toBeLessThan(
      flowInfoApiMocks.release.mock.invocationCallOrder[0],
    );
    expect((getState().flowInfo as any).usageType).toBe("approval");
  });

  it("prefers the explicit editor mode when persisted category state is stale", async () => {
    flowInfoApiMocks.setUsageType.mockResolvedValueOnce({
      data: { id: 17, type: 1, usageType: "approval" },
    });
    flowInfoApiMocks.release.mockResolvedValueOnce({
      data: { id: 17, type: 1, usageType: "approval" },
    });
    const { actions } = createActions({
      flowInfo: { id: 17, type: 1, usageType: "general" },
      activeCategoryId: "general",
      nodes: [
        { id: "approval-1", type: WorkflowNodeType.APPROVAL, data: {} },
      ],
    });

    await actions.releaseFlow("approval");

    expect(flowInfoApiMocks.setUsageType).toHaveBeenCalledWith(
      "team-1",
      17,
      "approval",
    );
  });
});

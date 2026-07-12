import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/flowChat", () => ({ flowChatApi: {} }));
vi.mock("@ai-flow/utils/runtime", () => ({ getRuntimeTeamId: vi.fn() }));
vi.mock("@ai-flow/src/api/flow", () => ({
  flowInfoApi: {},
  flowRunApi: {},
}));
vi.mock("../store/modules", () => ({
  createNodeActions: () => ({}),
  createEdgeActions: () => ({}),
  createMenuActions: () => ({}),
  createSimulationActions: () => ({}),
  createCategoryActions: () => ({}),
  createNodeOutputActions: () => ({}),
  createAIActions: () => ({}),
  createFlowActions: () => ({ flowSchemaVersion: 2 }),
  createExecutionActions: () => ({}),
  createLayoutActions: () => ({}),
  DEFAULT_CATEGORIES: [],
}));

const storage = new Map<string, string>();

describe("workflow store schema version persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
  });

  const persistGraph = (state: Record<string, any>) => {
    storage.set("workflow-storage", JSON.stringify({ state, version: 0 }));
  };

  it("hydrates persisted graphs without schemaVersion as legacy readonly", async () => {
    persistGraph({ nodes: [], edges: [] });

    const { useWorkflowStore } = await import("../store/useWorkflowStore");

    expect(useWorkflowStore.getState().flowSchemaVersion).toBeNull();
  });

  it("preserves persisted V2 schemaVersion", async () => {
    persistGraph({ flowSchemaVersion: 2, nodes: [], edges: [] });

    const { useWorkflowStore } = await import("../store/useWorkflowStore");

    expect(useWorkflowStore.getState().flowSchemaVersion).toBe(2);
  });
});

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WorkflowEmbedApp, {
  importPreviewDraft,
} from "../../../src/embed/WorkflowEmbedApp";

const workflowAppMock = vi.hoisted(() => vi.fn((_props: any) => <div />));
const importFromBackendMock = vi.hoisted(() =>
  vi.fn((draft: { schemaVersion?: number }) => ({
    nodes: [],
    edges: [],
    flowSchemaVersion: draft.schemaVersion === 2 ? 2 : null,
  })),
);
const loadFlowMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const replaceWithPreviewMock = vi.hoisted(() => vi.fn());
const setRuntimeMock = vi.hoisted(() => vi.fn());

vi.mock("@ai-flow/components/Workflow/WorkflowApp", () => ({
  WorkflowApp: workflowAppMock,
}));
vi.mock("@ai-flow/components/Workflow/store/useWorkflowStore", () => ({
  useWorkflowStore: () => ({
    loadFlow: loadFlowMock,
    replaceWithPreview: replaceWithPreviewMock,
    isFlowLoading: false,
  }),
}));
vi.mock("@ai-flow/utils/runtime", () => ({ setAiFlowRuntime: setRuntimeMock }));
vi.mock("@ai-flow/components/Workflow/adapters/backendAdapter", () => ({
  importFromBackend: importFromBackendMock,
}));

describe("WorkflowEmbedApp schema version", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    workflowAppMock.mockClear();
    importFromBackendMock.mockClear();
    loadFlowMock.mockClear();
    setRuntimeMock.mockClear();
    replaceWithPreviewMock.mockClear();
    workflowAppMock.mockImplementation((props: any) => {
      React.useEffect(() => {
        if (props.initialNodes || props.initialEdges) {
          replaceWithPreviewMock(
            props.initialNodes || [],
            props.initialEdges || [],
            props.initialSchemaVersion === 2 ? 2 : null,
          );
        }
      }, [props.initialNodes, props.initialEdges, props.initialSchemaVersion]);
      return <div />;
    });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
    }
    root = null;
    container = null;
  });

  it("preserves legacy schema metadata in static preview conversion", () => {
    expect(
      importPreviewDraft({ nodes: [{ id: "1", type: "start" }], edges: [] })
        ?.flowSchemaVersion,
    ).toBeNull();
  });

  it("keeps an empty legacy preview read-only", () => {
    expect(
      importPreviewDraft({ nodes: [], edges: [] })?.flowSchemaVersion,
    ).toBeNull();
  });

  it("preserves V2 metadata for an empty preview", () => {
    expect(
      importPreviewDraft({ schemaVersion: 2, nodes: [], edges: [] })
        ?.flowSchemaVersion,
    ).toBe(2);
  });

  it("fails closed when two embed instances mount at the same time", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <>
          <WorkflowEmbedApp workflowId="1" />
          <WorkflowEmbedApp workflowId="2" />
        </>,
      );
    });

    expect(container.textContent).toContain("同一页面只能挂载一个工作流编辑器");
    expect(setRuntimeMock).toHaveBeenCalledTimes(1);
    expect(loadFlowMock).toHaveBeenCalledTimes(1);
  });

  it("switches a loaded embed to preview through atomic replacement", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<WorkflowEmbedApp workflowId="1" />);
    });
    await act(async () => {
      root?.render(
        <WorkflowEmbedApp
          workflowId="1"
          previewDraft={{ schemaVersion: 2, nodes: [], edges: [] }}
        />,
      );
    });

    expect(replaceWithPreviewMock).toHaveBeenCalledWith([], [], 2);
  });

  it("ignores a late load error after switching to preview", async () => {
    let rejectLoad: (error: Error) => void = () => undefined;
    loadFlowMock.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectLoad = reject;
      }),
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<WorkflowEmbedApp workflowId="1" />);
    });
    await act(async () => {
      root?.render(
        <WorkflowEmbedApp
          workflowId="1"
          previewDraft={{ schemaVersion: 2, nodes: [], edges: [] }}
        />,
      );
    });
    await act(async () => rejectLoad(new Error("late failure")));

    expect(container.textContent).not.toContain("加载失败");
    expect(replaceWithPreviewMock).toHaveBeenCalledWith([], [], 2);
  });
});

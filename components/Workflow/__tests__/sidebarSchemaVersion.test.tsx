import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "../Sidebar";
import { useWorkflowStore } from "../store/useWorkflowStore";

vi.mock("reactflow", () => ({
  useReactFlow: () => ({
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    setViewport: vi.fn(),
  }),
}));

vi.mock("../store/useWorkflowStore", () => ({ useWorkflowStore: vi.fn() }));

const importedContent = { current: "" };

class MockFileReader {
  onload: ((event: any) => void) | null = null;

  readAsText() {
    this.onload?.({ target: { result: importedContent.current } });
  }
}

describe("Sidebar local graph schema version", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let replaceWithPreview: ReturnType<typeof vi.fn>;
  let exportedParts: unknown[];

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as any).FileReader = MockFileReader;
    vi.stubGlobal("alert", vi.fn());
    exportedParts = [];
    vi.stubGlobal(
      "Blob",
      class {
        constructor(parts: unknown[]) {
          exportedParts = parts;
        }
      },
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    replaceWithPreview = vi.fn();
    vi.mocked(useWorkflowStore).mockReturnValue({
      categories: [{ id: "general", name: "全功能模式", allowedNodeTypes: [] }],
      activeCategoryId: "general",
      nodes: [],
      edges: [],
      replaceWithPreview,
      globalVariables: [],
    } as any);
    container = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const importGraph = async (graph: Record<string, any>) => {
    importedContent.current = JSON.stringify(graph);
    await act(async () => root.render(<Sidebar pluginType="all" />));
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [{}] });
    await act(async () =>
      input.dispatchEvent(new Event("change", { bubbles: true })),
    );
  };

  it("marks a legacy local import readonly instead of inheriting current V2 state", async () => {
    await importGraph({ nodes: [], edges: [] });
    expect(replaceWithPreview).toHaveBeenCalledWith([], [], null);
  });

  it("marks a V2 local import editable", async () => {
    await importGraph({ schemaVersion: 2, nodes: [], edges: [] });
    expect(replaceWithPreview).toHaveBeenCalledWith([], [], 2);
  });

  it("rejects blocked nodes before replacing the current graph", async () => {
    await importGraph({
      schemaVersion: 2,
      nodes: [{ id: "delay-1", type: "delay", data: {} }],
      edges: [],
    });

    expect(replaceWithPreview).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("导入失败，请检查文件格式");
  });

  it("exports local graphs with schemaVersion 2", async () => {
    await act(async () => root.render(<Sidebar pluginType="all" />));
    const exportButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("导出"),
    );

    await act(async () => exportButton?.click());

    expect(JSON.parse(String(exportedParts[0])).schemaVersion).toBe(2);
  });
});

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CustomEdge } from "../edges/CustomEdge";

const openEdgeMenu = vi.fn();

vi.mock("reactflow", () => ({
  BaseEdge: () => <path data-testid="base-edge" />,
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  getSmoothStepPath: () => ["M0 0", 10, 10],
  useReactFlow: () => ({ screenToFlowPosition: (position: any) => position }),
}));
vi.mock("../store/useWorkflowStore", () => ({
  useWorkflowStore: () => ({ openEdgeMenu }),
}));

const edgeProps = {
  id: "e1",
  source: "a",
  target: "b",
  sourceX: 0,
  sourceY: 0,
  targetX: 10,
  targetY: 10,
  sourcePosition: "bottom",
  targetPosition: "top",
} as any;

describe("CustomEdge readonly", () => {
  it("renders only the line for readonly edges", () => {
    const html = renderToStaticMarkup(
      <CustomEdge {...edgeProps} data={{ readonly: true }} />,
    );

    expect(html).toContain('data-testid="base-edge"');
    expect(html).not.toContain("在此处插入节点");
  });

  it("renders the insert affordance for editable edges", () => {
    const html = renderToStaticMarkup(<CustomEdge {...edgeProps} />);
    expect(html).toContain("在此处插入节点");
  });
});

import { describe, expect, it } from "vitest";

import {
  NODE_CAPABILITIES,
  getConfigurableNodeTypes,
  getPublishableNodeTypes,
  getSingleNodeDebugNodeTypes,
} from "../config/nodeCapabilities";
import {
  PLUGIN_MODE_REGISTRY,
  type WorkflowPluginModeType,
} from "../config/pluginModeRegistry";
import { WorkflowNodeType } from "../types";

const PLUGIN_MODES: WorkflowPluginModeType[] = [
  "all",
  "ai",
  "approval",
  "automation",
];
const UNCONNECTED_NODE_TYPES = [
  WorkflowNodeType.DELAY,
  WorkflowNodeType.DATA_OP,
  WorkflowNodeType.PARALLEL,
  WorkflowNodeType.DOCUMENT_EXTRACTOR,
  WorkflowNodeType.CLOUD_PHONE,
  WorkflowNodeType.STORAGE,
];

describe("workflow node capability contract", () => {
  it("defines every required capability for every frontend node type", () => {
    expect(Object.keys(NODE_CAPABILITIES).sort()).toEqual(
      Object.values(WorkflowNodeType).sort(),
    );

    Object.values(NODE_CAPABILITIES).forEach((capability) => {
      expect(capability).toEqual(
        expect.objectContaining({
          frontendConfigurable: expect.any(Boolean),
          genericRuntimeSupported: expect.any(Boolean),
          approvalRuntimeSupported: expect.any(Boolean),
          singleNodeDebugSupported: expect.any(Boolean),
          publishSupported: expect.any(Boolean),
          allowedPluginModes: expect.any(Array),
          securityLevel: expect.stringMatching(/^(low|medium|high|blocked)$/),
        }),
      );
    });
  });

  it.each(PLUGIN_MODES)(
    "derives %s display, debug and publish sets from capability predicates",
    (mode) => {
      expect(PLUGIN_MODE_REGISTRY[mode].allowedNodeTypes).toEqual(
        getConfigurableNodeTypes(mode),
      );
      expect(
        getSingleNodeDebugNodeTypes(mode).every((type) =>
          getPublishableNodeTypes(mode).includes(type),
        ),
      ).toBe(true);
      expect(
        getPublishableNodeTypes(mode).every(
          (type) => NODE_CAPABILITIES[type].publishSupported,
        ),
      ).toBe(true);
    },
  );

  it.each(PLUGIN_MODES)(
    "keeps P0-disabled and unconnected nodes out of %s creation and publication",
    (mode) => {
      const prohibited = [
        WorkflowNodeType.SQL,
        WorkflowNodeType.VARIABLE,
        ...UNCONNECTED_NODE_TYPES,
      ];

      expect(getConfigurableNodeTypes(mode)).not.toEqual(
        expect.arrayContaining(prohibited),
      );
      expect(getPublishableNodeTypes(mode)).not.toEqual(
        expect.arrayContaining(prohibited),
      );
      expect(getSingleNodeDebugNodeTypes(mode)).not.toEqual(
        expect.arrayContaining(prohibited),
      );
    },
  );

  it("opens approval only in approval mode and keeps cc disabled until backend support lands", () => {
    expect(getConfigurableNodeTypes("approval")).toContain(
      WorkflowNodeType.APPROVAL,
    );
    expect(getConfigurableNodeTypes("approval")).not.toContain(
      WorkflowNodeType.CC,
    );
    expect(getPublishableNodeTypes("approval")).not.toContain(
      WorkflowNodeType.CC,
    );
    expect(NODE_CAPABILITIES[WorkflowNodeType.CC]).toMatchObject({
      frontendConfigurable: false,
      approvalRuntimeSupported: false,
      publishSupported: false,
    });
    (["all", "ai", "automation"] as const).forEach((mode) => {
      expect(getConfigurableNodeTypes(mode)).not.toEqual(
        expect.arrayContaining([
          WorkflowNodeType.APPROVAL,
          WorkflowNodeType.CC,
        ]),
      );
    });
  });

  it("matches the backend approval publish allowlist", () => {
    expect(new Set(getPublishableNodeTypes("approval"))).toEqual(
      new Set([
        WorkflowNodeType.START,
        WorkflowNodeType.END,
        WorkflowNodeType.APPROVAL,
        WorkflowNodeType.CONDITION,
        WorkflowNodeType.NOTIFICATION,
        WorkflowNodeType.MUL_QUERY,
        WorkflowNodeType.MUL_UPDATE_ROW,
        WorkflowNodeType.MUL_DELETE_ROW,
      ]),
    );
  });
});

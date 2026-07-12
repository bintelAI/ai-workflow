import { WorkflowNodeType } from "../types";
import type { WorkflowPluginModeType } from "./pluginModeRegistry";

export type NodeSecurityLevel = "low" | "medium" | "high" | "blocked";

export interface WorkflowNodeCapability {
  frontendConfigurable: boolean;
  genericRuntimeSupported: boolean;
  approvalRuntimeSupported: boolean;
  singleNodeDebugSupported: boolean;
  publishSupported: boolean;
  allowedPluginModes: readonly WorkflowPluginModeType[];
  securityLevel: NodeSecurityLevel;
}

type CapabilityInput = Pick<WorkflowNodeCapability, "allowedPluginModes"> &
  Partial<Omit<WorkflowNodeCapability, "allowedPluginModes">>;

const capability = ({
  allowedPluginModes,
  frontendConfigurable = true,
  genericRuntimeSupported = true,
  approvalRuntimeSupported = allowedPluginModes.includes("approval"),
  singleNodeDebugSupported = false,
  publishSupported = true,
  securityLevel = "low",
}: CapabilityInput): WorkflowNodeCapability => ({
  frontendConfigurable,
  genericRuntimeSupported,
  approvalRuntimeSupported,
  singleNodeDebugSupported,
  publishSupported,
  allowedPluginModes,
  securityLevel,
});

const ALL_MODES: readonly WorkflowPluginModeType[] = [
  "all",
  "ai",
  "approval",
  "automation",
];
const AI_MODES: readonly WorkflowPluginModeType[] = ["all", "ai"];
const GENERIC_AUTOMATION_MODES: readonly WorkflowPluginModeType[] = [
  "all",
  "ai",
  "automation",
];
const APPROVAL_MODE: readonly WorkflowPluginModeType[] = ["approval"];
const GENERAL_AUTOMATION_MODES: readonly WorkflowPluginModeType[] = [
  "all",
  "approval",
  "automation",
];

const unsupported = (
  allowedPluginModes: readonly WorkflowPluginModeType[],
): WorkflowNodeCapability =>
  capability({
    allowedPluginModes,
    genericRuntimeSupported: false,
    approvalRuntimeSupported: false,
    publishSupported: false,
    securityLevel: "blocked",
  });

export const NODE_CAPABILITIES: Record<
  WorkflowNodeType,
  WorkflowNodeCapability
> = {
  [WorkflowNodeType.START]: capability({ allowedPluginModes: ALL_MODES }),
  [WorkflowNodeType.END]: capability({ allowedPluginModes: ALL_MODES }),
  [WorkflowNodeType.APPROVAL]: capability({
    allowedPluginModes: APPROVAL_MODE,
    genericRuntimeSupported: false,
    approvalRuntimeSupported: true,
    securityLevel: "medium",
  }),
  [WorkflowNodeType.CC]: capability({
    allowedPluginModes: [],
    frontendConfigurable: false,
    genericRuntimeSupported: false,
    approvalRuntimeSupported: false,
    publishSupported: false,
    securityLevel: "blocked",
  }),
  [WorkflowNodeType.CONDITION]: capability({
    allowedPluginModes: ALL_MODES,
    singleNodeDebugSupported: true,
  }),
  [WorkflowNodeType.PARALLEL]: unsupported(GENERAL_AUTOMATION_MODES),
  [WorkflowNodeType.LOOP]: capability({
    allowedPluginModes: GENERIC_AUTOMATION_MODES,
    singleNodeDebugSupported: true,
  }),
  [WorkflowNodeType.DELAY]: unsupported(ALL_MODES),
  [WorkflowNodeType.QUESTION_CLASSIFIER]: capability({
    allowedPluginModes: AI_MODES,
    singleNodeDebugSupported: true,
  }),
  [WorkflowNodeType.API_CALL]: capability({
    allowedPluginModes: GENERIC_AUTOMATION_MODES,
    securityLevel: "high",
  }),
  [WorkflowNodeType.NOTIFICATION]: capability({
    allowedPluginModes: ALL_MODES,
    securityLevel: "medium",
  }),
  [WorkflowNodeType.DATA_OP]: unsupported(ALL_MODES),
  [WorkflowNodeType.SQL]: capability({
    allowedPluginModes: [],
    frontendConfigurable: false,
    genericRuntimeSupported: false,
    approvalRuntimeSupported: false,
    publishSupported: false,
    securityLevel: "blocked",
  }),
  [WorkflowNodeType.MUL_QUERY]: capability({
    allowedPluginModes: ALL_MODES,
    singleNodeDebugSupported: true,
    securityLevel: "medium",
  }),
  [WorkflowNodeType.MUL_UPDATE_ROW]: capability({
    allowedPluginModes: ALL_MODES,
    singleNodeDebugSupported: true,
    securityLevel: "high",
  }),
  [WorkflowNodeType.MUL_DELETE_ROW]: capability({
    allowedPluginModes: ALL_MODES,
    singleNodeDebugSupported: true,
    securityLevel: "high",
  }),
  [WorkflowNodeType.SCRIPT]: capability({
    allowedPluginModes: GENERIC_AUTOMATION_MODES,
    singleNodeDebugSupported: true,
    securityLevel: "high",
  }),
  [WorkflowNodeType.LLM]: capability({
    allowedPluginModes: AI_MODES,
    singleNodeDebugSupported: true,
    securityLevel: "medium",
  }),
  [WorkflowNodeType.KNOWLEDGE_RETRIEVAL]: capability({
    allowedPluginModes: AI_MODES,
    singleNodeDebugSupported: true,
    securityLevel: "medium",
  }),
  [WorkflowNodeType.DOCUMENT_EXTRACTOR]: unsupported(AI_MODES),
  [WorkflowNodeType.JSON_PARSE]: capability({
    allowedPluginModes: AI_MODES,
    singleNodeDebugSupported: true,
  }),
  [WorkflowNodeType.SMART_PARSE]: capability({
    allowedPluginModes: AI_MODES,
    singleNodeDebugSupported: true,
    securityLevel: "medium",
  }),
  [WorkflowNodeType.FLOW_CALL]: capability({
    allowedPluginModes: GENERIC_AUTOMATION_MODES,
    singleNodeDebugSupported: true,
    securityLevel: "medium",
  }),
  [WorkflowNodeType.VARIABLE]: capability({
    allowedPluginModes: [],
    frontendConfigurable: false,
    genericRuntimeSupported: false,
    approvalRuntimeSupported: false,
    publishSupported: false,
    securityLevel: "blocked",
  }),
  [WorkflowNodeType.CLOUD_PHONE]: unsupported(GENERAL_AUTOMATION_MODES),
  [WorkflowNodeType.STORAGE]: unsupported(GENERAL_AUTOMATION_MODES),
};

const isRuntimeSupported = (
  capability: WorkflowNodeCapability,
  mode: WorkflowPluginModeType,
) =>
  mode === "approval"
    ? capability.approvalRuntimeSupported
    : capability.genericRuntimeSupported;

const getNodeTypes = (
  mode: WorkflowPluginModeType,
  predicate: (capability: WorkflowNodeCapability) => boolean,
) =>
  Object.values(WorkflowNodeType).filter((type) => {
    const nodeCapability = NODE_CAPABILITIES[type];
    return (
      nodeCapability.allowedPluginModes.includes(mode) &&
      isRuntimeSupported(nodeCapability, mode) &&
      predicate(nodeCapability)
    );
  });

export const getConfigurableNodeTypes = (
  mode: WorkflowPluginModeType,
): WorkflowNodeType[] =>
  getNodeTypes(mode, (nodeCapability) => nodeCapability.frontendConfigurable);

export const getPublishableNodeTypes = (
  mode: WorkflowPluginModeType,
): WorkflowNodeType[] =>
  getNodeTypes(mode, (nodeCapability) => nodeCapability.publishSupported);

export const getSingleNodeDebugNodeTypes = (
  mode: WorkflowPluginModeType,
): WorkflowNodeType[] =>
  getNodeTypes(
    mode,
    (nodeCapability) =>
      nodeCapability.singleNodeDebugSupported &&
      nodeCapability.publishSupported,
  );

export const isNodeConfigurable = (
  type: WorkflowNodeType,
  mode: WorkflowPluginModeType,
) => getConfigurableNodeTypes(mode).includes(type);

export const isSingleNodeDebugSupported = (
  type: WorkflowNodeType,
  mode: WorkflowPluginModeType,
) => getSingleNodeDebugNodeTypes(mode).includes(type);

export const getUnsupportedPublishNodeTypes = (
  nodeTypes: readonly WorkflowNodeType[],
  mode: WorkflowPluginModeType,
) => {
  const publishableNodeTypes = new Set(getPublishableNodeTypes(mode));
  return Array.from(
    new Set(nodeTypes.filter((type) => !publishableNodeTypes.has(type))),
  );
};

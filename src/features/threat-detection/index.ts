export { useDetectionEngine } from "@features/threat-detection/hooks/use-detection-engine";

export {
  BATCH_SIZE,
  INITIAL_TELEMETRY,
  MAX_ALERTS,
} from "@features/threat-detection/constants/engine";

export type {
  IDetectionEngineActions,
  IDetectionEngineState,
  IUseDetectionEngineReturn,
} from "@features/threat-detection/types/detection-engine.types";

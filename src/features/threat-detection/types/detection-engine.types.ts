import type { ITelemetrySnapshot, IThreatAlert } from "@core/domain/types";

export interface IDetectionEngineState {
  readonly alerts: readonly IThreatAlert[];
  readonly telemetry: ITelemetrySnapshot | null;
  readonly isReady: boolean;
  readonly error: string | null;
}

export interface IDetectionEngineActions {
  readonly ingestLines: (lines: readonly string[], sourceId: string) => void;
  readonly reset: () => void;
  readonly clearAlerts: () => void;
}

export type IUseDetectionEngineReturn = IDetectionEngineState & IDetectionEngineActions;

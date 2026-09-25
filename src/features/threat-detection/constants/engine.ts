import type { ITelemetrySnapshot } from "@core/domain/types";

export const MAX_ALERTS = 10_000;
export const BATCH_SIZE = 500;

export const INITIAL_TELEMETRY: ITelemetrySnapshot = {
  totalEventsIngested: 0,
  eventsPerSecond: 0,
  activeAlerts: 0,
  rulesEvaluated: 0,
  windowPartitions: 0,
  uptimeMs: 0,
};

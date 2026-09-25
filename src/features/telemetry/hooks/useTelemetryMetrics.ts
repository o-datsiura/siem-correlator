import { useMemo } from "react";

import type { ITelemetrySnapshot } from "@core/domain/types";

export interface IUseTelemetryMetricsReturn {
  readonly eps: number;
  readonly totalEvents: number;
  readonly partitions: number;
  readonly uptimeSeconds: number;
}

export const useTelemetryMetrics = (
  telemetry: ITelemetrySnapshot | null,
): IUseTelemetryMetricsReturn => {
  return useMemo(() => {
    const eps = telemetry?.eventsPerSecond ?? 0;
    const totalEvents = telemetry?.totalEventsIngested ?? 0;
    const partitions = telemetry?.windowPartitions ?? 0;
    const uptimeSeconds = Math.floor((telemetry?.uptimeMs ?? 0) / 1000);

    return {
      eps,
      totalEvents,
      partitions,
      uptimeSeconds,
    };
  }, [telemetry]);
};

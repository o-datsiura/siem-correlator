import { useCallback, useEffect, useRef, useState } from "react";

import {
  BATCH_SIZE,
  INITIAL_TELEMETRY,
  MAX_ALERTS,
} from "@features/threat-detection/constants/engine";
import { WORKER_INCOMING_TYPE, WORKER_OUTGOING_TYPE } from "@workers/protocol";

import type { ITelemetrySnapshot, IThreatAlert } from "@core/domain/types";
import type { IUseDetectionEngineReturn } from "@features/threat-detection/types/detection-engine.types";
import type { WorkerIncomingMessage, WorkerOutgoingMessage } from "@workers/protocol";

export function useDetectionEngine(): IUseDetectionEngineReturn {
  const [alerts, setAlerts] = useState<readonly IThreatAlert[]>([]);
  const [telemetry, setTelemetry] = useState<ITelemetrySnapshot | null>(INITIAL_TELEMETRY);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("@workers/detection.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
      const message = event.data;

      switch (message.type) {
        case WORKER_OUTGOING_TYPE.READY:
          setIsReady(true);
          break;

        case WORKER_OUTGOING_TYPE.EMIT_ALERT:
          setAlerts((prev) => {
            const combined = [...prev, ...message.payload.alerts];

            if (combined.length > MAX_ALERTS) {
              return combined.slice(combined.length - MAX_ALERTS);
            }

            return combined;
          });
          break;

        case WORKER_OUTGOING_TYPE.TELEMETRY_UPDATE:
          setTelemetry(message.payload);
          break;

        case WORKER_OUTGOING_TYPE.ERROR:
          setError(message.payload.message);
          break;
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      setError(event.message);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const ingestLines = useCallback(
    (lines: readonly string[], sourceId: string) => {
      const worker = workerRef.current;

      if (!worker || !isReady) return;

      for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);
        const message: WorkerIncomingMessage = {
          type: WORKER_INCOMING_TYPE.INGEST_BATCH,
          payload: { lines: batch, sourceId },
        };

        worker.postMessage(message);
      }
    },
    [isReady],
  );

  const reset = useCallback(() => {
    const worker = workerRef.current;

    if (!worker) return;

    const message: WorkerIncomingMessage = { type: WORKER_INCOMING_TYPE.RESET };

    worker.postMessage(message);
    setAlerts([]);
    setTelemetry(INITIAL_TELEMETRY);
    setError(null);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    telemetry,
    isReady,
    error,
    ingestLines,
    reset,
    clearAlerts,
  };
}

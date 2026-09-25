import type { ITelemetrySnapshot, IThreatAlert } from "@core/domain/types";

export const WORKER_INCOMING_TYPE = {
  INGEST_BATCH: "INGEST_BATCH",
  CONFIGURE: "CONFIGURE",
  RESET: "RESET",
} as const;

export type WorkerIncomingType = (typeof WORKER_INCOMING_TYPE)[keyof typeof WORKER_INCOMING_TYPE];

export const CONFIGURE_ACTION = {
  RESET: "reset",
  ENABLE_RULE: "enable_rule",
  DISABLE_RULE: "disable_rule",
} as const;

export type ConfigureAction = (typeof CONFIGURE_ACTION)[keyof typeof CONFIGURE_ACTION];

export const WORKER_OUTGOING_TYPE = {
  READY: "READY",
  EMIT_ALERT: "EMIT_ALERT",
  TELEMETRY_UPDATE: "TELEMETRY_UPDATE",
  ERROR: "ERROR",
} as const;

export type WorkerOutgoingType = (typeof WORKER_OUTGOING_TYPE)[keyof typeof WORKER_OUTGOING_TYPE];

export interface IngestBatchMessage {
  readonly type: typeof WORKER_INCOMING_TYPE.INGEST_BATCH;
  readonly payload: {
    readonly lines: readonly string[];
    readonly sourceId: string;
  };
}

export interface ConfigureMessage {
  readonly type: typeof WORKER_INCOMING_TYPE.CONFIGURE;
  readonly payload: {
    readonly action: ConfigureAction;
    readonly ruleId?: string;
  };
}

export interface ResetMessage {
  readonly type: typeof WORKER_INCOMING_TYPE.RESET;
}

export type WorkerIncomingMessage = IngestBatchMessage | ConfigureMessage | ResetMessage;

export interface AlertEmitMessage {
  readonly type: typeof WORKER_OUTGOING_TYPE.EMIT_ALERT;
  readonly payload: {
    readonly alerts: readonly IThreatAlert[];
  };
}

export interface TelemetryUpdateMessage {
  readonly type: typeof WORKER_OUTGOING_TYPE.TELEMETRY_UPDATE;
  readonly payload: ITelemetrySnapshot;
}

export interface ReadyMessage {
  readonly type: typeof WORKER_OUTGOING_TYPE.READY;
}

export interface ErrorMessage {
  readonly type: typeof WORKER_OUTGOING_TYPE.ERROR;
  readonly payload: {
    readonly message: string;
  };
}

export type WorkerOutgoingMessage =
  AlertEmitMessage | TelemetryUpdateMessage | ReadyMessage | ErrorMessage;

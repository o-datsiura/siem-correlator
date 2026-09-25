import type {
  LogFormat,
  MitreTactic,
  RuleType,
  ThreatCategory,
  ThreatSeverity,
} from "@core/domain/enums";

export type { ThreatSeverity as Severity };

export interface ILogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly source: string;
  readonly format: LogFormat;
  readonly severity: ThreatSeverity;
  readonly message: string;
  readonly clientIp?: string;
  readonly method?: string;
  readonly path?: string;
  readonly statusCode?: number;
  readonly userAgent?: string;
  readonly rawLine: string;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface IMitreAttackRef {
  readonly techniqueId: string;
  readonly techniqueName: string;
  readonly tactic: MitreTactic;
  readonly url: string;
}

export interface IThreatAlert {
  readonly id: string;
  readonly timestamp: number;
  readonly ruleId: string;
  readonly ruleName: string;
  readonly category: ThreatCategory;
  readonly severity: ThreatSeverity;
  readonly sourceEntry: ILogEntry;
  readonly matchedPatterns: readonly string[];
  readonly mitreRef: IMitreAttackRef;
  readonly context: Readonly<Record<string, string>>;
}

export interface IRuleDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: RuleType;
  readonly category: ThreatCategory;
  readonly severity: ThreatSeverity;
  readonly mitreRef: IMitreAttackRef;
  readonly enabled: boolean;
}

export interface ITelemetrySnapshot {
  readonly totalEventsIngested: number;
  readonly eventsPerSecond: number;
  readonly activeAlerts: number;
  readonly rulesEvaluated: number;
  readonly windowPartitions: number;
  readonly uptimeMs: number;
}

export interface RawLogInput {
  readonly line: string;
  readonly lineNumber: number;
  readonly sourceId: string;
}

export interface AhoCorasickMatch {
  readonly pattern: string;
  readonly position: number;
}

import { isStatefulRule } from "@core/rules/rule";

import type { ILogEntry, ITelemetrySnapshot, IThreatAlert } from "@core/domain/types";
import type { IDetectionRule } from "@core/rules/rule";

const EPS_WINDOW_MS = 1000;

export class DetectionEngine {
  private readonly rules: IDetectionRule[] = [];
  private totalEventsIngested = 0;
  private totalAlerts = 0;
  private readonly startTime: number;
  private readonly recentTimestamps: number[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  registerRule(rule: IDetectionRule): void {
    this.rules.push(rule);
  }

  ingest(entries: readonly ILogEntry[]): IThreatAlert[] {
    const alerts: IThreatAlert[] = [];
    const now = Date.now();

    for (const entry of entries) {
      this.totalEventsIngested++;
      this.recentTimestamps.push(now);

      for (const rule of this.rules) {
        const alert = rule.evaluate(entry);

        if (alert !== null) {
          alerts.push(alert);
          this.totalAlerts++;
        }
      }
    }

    return alerts;
  }

  housekeep(now: number): void {
    for (const rule of this.rules) {
      if (isStatefulRule(rule)) {
        rule.evictExpired(now);
      }
    }

    const cutoff = now - EPS_WINDOW_MS * 10;

    while (this.recentTimestamps.length > 0 && (this.recentTimestamps[0] ?? 0) < cutoff) {
      this.recentTimestamps.shift();
    }
  }

  getTelemetry(): ITelemetrySnapshot {
    const now = Date.now();
    const epsCutoff = now - EPS_WINDOW_MS;
    let epsCount = 0;

    for (let i = this.recentTimestamps.length - 1; i >= 0; i--) {
      if ((this.recentTimestamps[i] ?? 0) >= epsCutoff) {
        epsCount++;
      } else {
        break;
      }
    }

    let windowPartitions = 0;

    for (const rule of this.rules) {
      if (isStatefulRule(rule)) {
        windowPartitions += rule.partitionCount;
      }
    }

    return {
      totalEventsIngested: this.totalEventsIngested,
      eventsPerSecond: epsCount,
      activeAlerts: this.totalAlerts,
      rulesEvaluated: this.rules.length,
      windowPartitions,
      uptimeMs: now - this.startTime,
    };
  }

  get ruleCount(): number {
    return this.rules.length;
  }

  reset(): void {
    for (const rule of this.rules) {
      rule.reset();
    }
    this.totalEventsIngested = 0;
    this.totalAlerts = 0;
    this.recentTimestamps.length = 0;
  }
}

import type { ILogEntry, IRuleDefinition, IThreatAlert } from "@core/domain/types";

export interface IDetectionRule {
  readonly definition: IRuleDefinition;
  evaluate(entry: ILogEntry): IThreatAlert | null;
  reset(): void;
}

export interface IStatefulRule extends IDetectionRule {
  evictExpired(now: number): void;
  readonly partitionCount: number;
}

export function isStatefulRule(rule: IDetectionRule): rule is IStatefulRule {
  return "evictExpired" in rule && "partitionCount" in rule;
}

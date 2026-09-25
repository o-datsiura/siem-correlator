import { THREAT_SEVERITY } from "@core/domain/enums";

import type { ThreatSeverity } from "@core/domain/enums";

export { THREAT_SEVERITY };
export type { ThreatSeverity };

export const FILTER_SEVERITY = {
  ALL: "ALL",
  ...THREAT_SEVERITY,
} as const;

export type FilterSeverity = (typeof FILTER_SEVERITY)[keyof typeof FILTER_SEVERITY];

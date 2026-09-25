import { useMemo } from "react";

import { calculateMitreHitCounts } from "@features/incident-viewer/utils/mitre";

import type { IThreatAlert } from "@core/domain/types";

export interface IUseMitreAttackGridReturn {
  readonly hitCounts: ReadonlyMap<string, number>;
}

export const useMitreAttackGrid = (alerts: readonly IThreatAlert[]): IUseMitreAttackGridReturn => {
  const hitCounts = useMemo(() => calculateMitreHitCounts(alerts), [alerts]);

  return { hitCounts };
};

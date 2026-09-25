import type { IThreatAlert } from "@core/domain/types";

export const calculateMitreHitCounts = (
  alerts: readonly IThreatAlert[],
): ReadonlyMap<string, number> => {
  const map = new Map<string, number>();

  for (const alert of alerts) {
    const techId = alert.mitreRef.techniqueId;

    map.set(techId, (map.get(techId) ?? 0) + 1);
  }

  return map;
};

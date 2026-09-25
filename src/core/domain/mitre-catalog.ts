import { MITRE_TACTIC, THREAT_CATEGORY } from "@core/domain/enums";

import type { ThreatCategory } from "@core/domain/enums";
import type { IMitreAttackRef } from "@core/domain/types";

const MITRE_CATALOG: Readonly<Record<ThreatCategory, IMitreAttackRef>> = {
  [THREAT_CATEGORY.BRUTE_FORCE]: {
    techniqueId: "T1110",
    techniqueName: "Brute Force",
    tactic: MITRE_TACTIC.CREDENTIAL_ACCESS,
    url: "https://attack.mitre.org/techniques/T1110/",
  },
  [THREAT_CATEGORY.SQL_INJECTION]: {
    techniqueId: "T1190",
    techniqueName: "Exploit Public-Facing Application",
    tactic: MITRE_TACTIC.INITIAL_ACCESS,
    url: "https://attack.mitre.org/techniques/T1190/",
  },
  [THREAT_CATEGORY.DIRECTORY_TRAVERSAL]: {
    techniqueId: "T1190",
    techniqueName: "Exploit Public-Facing Application",
    tactic: MITRE_TACTIC.INITIAL_ACCESS,
    url: "https://attack.mitre.org/techniques/T1190/",
  },
  [THREAT_CATEGORY.SCANNER_DETECTION]: {
    techniqueId: "T1595",
    techniqueName: "Active Scanning",
    tactic: MITRE_TACTIC.RECONNAISSANCE,
    url: "https://attack.mitre.org/techniques/T1595/",
  },
  [THREAT_CATEGORY.SHELL_INJECTION]: {
    techniqueId: "T1059",
    techniqueName: "Command and Scripting Interpreter",
    tactic: MITRE_TACTIC.EXECUTION,
    url: "https://attack.mitre.org/techniques/T1059/",
  },
  [THREAT_CATEGORY.ANOMALY]: {
    techniqueId: "T1071",
    techniqueName: "Application Layer Protocol",
    tactic: MITRE_TACTIC.DISCOVERY,
    url: "https://attack.mitre.org/techniques/T1071/",
  },
};

export function getMitreRef(category: ThreatCategory): IMitreAttackRef {
  return MITRE_CATALOG[category];
}

export function getAllMitreRefs(): readonly IMitreAttackRef[] {
  const seen = new Set<string>();
  const refs: IMitreAttackRef[] = [];

  for (const ref of Object.values(MITRE_CATALOG)) {
    if (!seen.has(ref.techniqueId)) {
      seen.add(ref.techniqueId);
      refs.push(ref);
    }
  }

  return refs;
}

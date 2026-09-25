import { MITRE_TACTIC } from "@core/domain/enums";

import type { MitreTactic } from "@core/domain/enums";
import type { ITechniqueCell } from "@features/incident-viewer/types/mitre.types";

export const TECHNIQUES: readonly ITechniqueCell[] = [
  {
    id: "T1190",
    name: "Exploit Public-Facing App (SQLi / Traversal)",
    tactic: MITRE_TACTIC.INITIAL_ACCESS,
    url: "https://attack.mitre.org/techniques/T1190/",
  },
  {
    id: "T1059",
    name: "Command and Scripting Interpreter (Shell)",
    tactic: MITRE_TACTIC.EXECUTION,
    url: "https://attack.mitre.org/techniques/T1059/",
  },
  {
    id: "T1110",
    name: "Brute Force (SSH Credential Access)",
    tactic: MITRE_TACTIC.CREDENTIAL_ACCESS,
    url: "https://attack.mitre.org/techniques/T1110/",
  },
  {
    id: "T1595",
    name: "Active Scanning (Vulnerability Probing)",
    tactic: MITRE_TACTIC.RECONNAISSANCE,
    url: "https://attack.mitre.org/techniques/T1595/",
  },
  {
    id: "T1082",
    name: "System Information Discovery",
    tactic: MITRE_TACTIC.DISCOVERY,
    url: "https://attack.mitre.org/techniques/T1082/",
  },
];

export const TACTICS_ORDER: readonly MitreTactic[] = [
  MITRE_TACTIC.RECONNAISSANCE,
  MITRE_TACTIC.INITIAL_ACCESS,
  MITRE_TACTIC.EXECUTION,
  MITRE_TACTIC.CREDENTIAL_ACCESS,
  MITRE_TACTIC.DISCOVERY,
];

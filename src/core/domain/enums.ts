export const THREAT_SEVERITY = {
  INFO: "INFO",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type ThreatSeverity = (typeof THREAT_SEVERITY)[keyof typeof THREAT_SEVERITY];

export const SEVERITY = THREAT_SEVERITY;
export type Severity = ThreatSeverity;

export const LOG_FORMAT = {
  SYSLOG: "SYSLOG",
  NGINX_ACCESS: "NGINX_ACCESS",
  AUTH_LOG: "AUTH_LOG",
  JSON: "JSON",
  UNKNOWN: "UNKNOWN",
} as const;

export type LogFormat = (typeof LOG_FORMAT)[keyof typeof LOG_FORMAT];

export const THREAT_CATEGORY = {
  BRUTE_FORCE: "BRUTE_FORCE",
  SQL_INJECTION: "SQL_INJECTION",
  DIRECTORY_TRAVERSAL: "DIRECTORY_TRAVERSAL",
  SCANNER_DETECTION: "SCANNER_DETECTION",
  SHELL_INJECTION: "SHELL_INJECTION",
  ANOMALY: "ANOMALY",
} as const;

export type ThreatCategory = (typeof THREAT_CATEGORY)[keyof typeof THREAT_CATEGORY];

export const RULE_TYPE = {
  SIGNATURE: "SIGNATURE",
  SLIDING_WINDOW: "SLIDING_WINDOW",
  COMPOSITE: "COMPOSITE",
} as const;

export type RuleType = (typeof RULE_TYPE)[keyof typeof RULE_TYPE];

export const MITRE_TACTIC = {
  INITIAL_ACCESS: "INITIAL_ACCESS",
  EXECUTION: "EXECUTION",
  CREDENTIAL_ACCESS: "CREDENTIAL_ACCESS",
  RECONNAISSANCE: "RECONNAISSANCE",
  DISCOVERY: "DISCOVERY",
} as const;

export type MitreTactic = (typeof MITRE_TACTIC)[keyof typeof MITRE_TACTIC];

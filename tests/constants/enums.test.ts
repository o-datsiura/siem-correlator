import { describe, expect, it } from "vitest";

import {
  LOG_FORMAT,
  MITRE_TACTIC,
  RULE_TYPE,
  THREAT_CATEGORY,
  THREAT_SEVERITY,
} from "@core/domain/enums";
import { FILTER_SEVERITY } from "@features/incident-viewer";

import type {
  LogFormat,
  MitreTactic,
  RuleType,
  ThreatCategory,
  ThreatSeverity,
} from "@core/domain/enums";
import type { FilterSeverity } from "@features/incident-viewer";

describe("Domain frozen const assertion invariants", () => {
  it("THREAT_SEVERITY contains expected values and satisfies ThreatSeverity", () => {
    expect(THREAT_SEVERITY.INFO).toBe("INFO");
    expect(THREAT_SEVERITY.LOW).toBe("LOW");
    expect(THREAT_SEVERITY.MEDIUM).toBe("MEDIUM");
    expect(THREAT_SEVERITY.HIGH).toBe("HIGH");
    expect(THREAT_SEVERITY.CRITICAL).toBe("CRITICAL");

    const severity: ThreatSeverity = THREAT_SEVERITY.CRITICAL;

    expect(Object.values(THREAT_SEVERITY)).toContain(severity);
  });

  it("LOG_FORMAT contains expected values and satisfies LogFormat", () => {
    expect(LOG_FORMAT.SYSLOG).toBe("SYSLOG");
    expect(LOG_FORMAT.NGINX_ACCESS).toBe("NGINX_ACCESS");
    expect(LOG_FORMAT.AUTH_LOG).toBe("AUTH_LOG");
    expect(LOG_FORMAT.JSON).toBe("JSON");
    expect(LOG_FORMAT.UNKNOWN).toBe("UNKNOWN");

    const format: LogFormat = LOG_FORMAT.JSON;

    expect(Object.values(LOG_FORMAT)).toContain(format);
  });

  it("THREAT_CATEGORY contains expected values and satisfies ThreatCategory", () => {
    expect(THREAT_CATEGORY.BRUTE_FORCE).toBe("BRUTE_FORCE");
    expect(THREAT_CATEGORY.SQL_INJECTION).toBe("SQL_INJECTION");
    expect(THREAT_CATEGORY.DIRECTORY_TRAVERSAL).toBe("DIRECTORY_TRAVERSAL");
    expect(THREAT_CATEGORY.SCANNER_DETECTION).toBe("SCANNER_DETECTION");
    expect(THREAT_CATEGORY.SHELL_INJECTION).toBe("SHELL_INJECTION");
    expect(THREAT_CATEGORY.ANOMALY).toBe("ANOMALY");

    const cat: ThreatCategory = THREAT_CATEGORY.BRUTE_FORCE;

    expect(Object.values(THREAT_CATEGORY)).toContain(cat);
  });

  it("RULE_TYPE contains expected values and satisfies RuleType", () => {
    expect(RULE_TYPE.SIGNATURE).toBe("SIGNATURE");
    expect(RULE_TYPE.SLIDING_WINDOW).toBe("SLIDING_WINDOW");
    expect(RULE_TYPE.COMPOSITE).toBe("COMPOSITE");

    const rType: RuleType = RULE_TYPE.SIGNATURE;

    expect(Object.values(RULE_TYPE)).toContain(rType);
  });

  it("MITRE_TACTIC contains expected values and satisfies MitreTactic", () => {
    expect(MITRE_TACTIC.INITIAL_ACCESS).toBe("INITIAL_ACCESS");
    expect(MITRE_TACTIC.EXECUTION).toBe("EXECUTION");
    expect(MITRE_TACTIC.CREDENTIAL_ACCESS).toBe("CREDENTIAL_ACCESS");
    expect(MITRE_TACTIC.RECONNAISSANCE).toBe("RECONNAISSANCE");
    expect(MITRE_TACTIC.DISCOVERY).toBe("DISCOVERY");

    const tactic: MitreTactic = MITRE_TACTIC.INITIAL_ACCESS;

    expect(Object.values(MITRE_TACTIC)).toContain(tactic);
  });

  it("FILTER_SEVERITY composes THREAT_SEVERITY without duplicate declarations", () => {
    expect(FILTER_SEVERITY.ALL).toBe("ALL");
    expect(FILTER_SEVERITY.CRITICAL).toBe(THREAT_SEVERITY.CRITICAL);
    expect(FILTER_SEVERITY.HIGH).toBe(THREAT_SEVERITY.HIGH);
    expect(FILTER_SEVERITY.MEDIUM).toBe(THREAT_SEVERITY.MEDIUM);
    expect(FILTER_SEVERITY.LOW).toBe(THREAT_SEVERITY.LOW);
    expect(FILTER_SEVERITY.INFO).toBe(THREAT_SEVERITY.INFO);

    const filter: FilterSeverity = FILTER_SEVERITY.ALL;

    expect(Object.values(FILTER_SEVERITY)).toContain(filter);
  });
});

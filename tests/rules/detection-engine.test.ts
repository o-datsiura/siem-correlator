import { describe, expect, it } from "vitest";

import { LOG_FORMAT, RULE_TYPE, THREAT_CATEGORY, THREAT_SEVERITY } from "@core/domain/enums";
import { getMitreRef } from "@core/domain/mitre-catalog";
import { DetectionEngine } from "@core/rules/detection-engine";
import { SignatureRule } from "@core/rules/signature-rule";
import { SlidingWindowRule } from "@core/rules/sliding-window-rule";
import { MessageContainsSpecification } from "@core/specifications/base-specification";

import type { ILogEntry } from "@core/domain/types";

describe("DetectionEngine Threat Correlation", () => {
  it("triggers SignatureRule on known SQL injection pattern", () => {
    const engine = new DetectionEngine();
    const sqlRule = new SignatureRule(
      {
        id: "rule-sqli",
        name: "SQL Injection Detection",
        type: RULE_TYPE.SIGNATURE,
        category: THREAT_CATEGORY.SQL_INJECTION,
        severity: THREAT_SEVERITY.HIGH,
        mitreRef: getMitreRef(THREAT_CATEGORY.SQL_INJECTION),
        enabled: true,
      },
      ["union select"],
    );
    engine.registerRule(sqlRule);

    const maliciousLog: ILogEntry = {
      id: "log-1",
      timestamp: Date.now(),
      source: "nginx",
      format: LOG_FORMAT.NGINX_ACCESS,
      severity: THREAT_SEVERITY.MEDIUM,
      message: "SELECT * FROM users UNION SELECT password FROM admin",
      clientIp: "10.0.0.99",
      rawLine: "SELECT * FROM users UNION SELECT password FROM admin",
      metadata: {},
    };

    const alerts = engine.ingest([maliciousLog]);
    expect(alerts.length).toBe(1);
    expect(alerts[0]?.ruleId).toBe("rule-sqli");
    expect(alerts[0]?.category).toBe(THREAT_CATEGORY.SQL_INJECTION);
  });

  it("triggers SlidingWindowRule on SSH brute force threshold exceedance", () => {
    const engine = new DetectionEngine();
    const bruteForceRule = new SlidingWindowRule(
      {
        id: "rule-ssh-bf",
        name: "SSH Brute Force",
        type: RULE_TYPE.SLIDING_WINDOW,
        category: THREAT_CATEGORY.BRUTE_FORCE,
        severity: THREAT_SEVERITY.HIGH,
        mitreRef: getMitreRef(THREAT_CATEGORY.BRUTE_FORCE),
        enabled: true,
      },
      60000,
      3,
      (entry) => entry.clientIp ?? "unknown",
      new MessageContainsSpecification("failed password"),
    );
    engine.registerRule(bruteForceRule);

    const now = Date.now();
    const logs: ILogEntry[] = [
      {
        id: "bf-1",
        timestamp: now,
        source: "syslog",
        format: LOG_FORMAT.SYSLOG,
        severity: THREAT_SEVERITY.LOW,
        message: "Failed password for admin",
        clientIp: "192.168.1.100",
        rawLine: "Failed password for admin",
        metadata: {},
      },
      {
        id: "bf-2",
        timestamp: now + 500,
        source: "syslog",
        format: LOG_FORMAT.SYSLOG,
        severity: THREAT_SEVERITY.LOW,
        message: "Failed password for root",
        clientIp: "192.168.1.100",
        rawLine: "Failed password for root",
        metadata: {},
      },
      {
        id: "bf-3",
        timestamp: now + 1000,
        source: "syslog",
        format: LOG_FORMAT.SYSLOG,
        severity: THREAT_SEVERITY.LOW,
        message: "Failed password for deploy",
        clientIp: "192.168.1.100",
        rawLine: "Failed password for deploy",
        metadata: {},
      },
    ];

    const alerts = engine.ingest(logs);
    expect(alerts.length).toBe(1);
    expect(alerts[0]?.ruleId).toBe("rule-ssh-bf");
    expect(alerts[0]?.category).toBe(THREAT_CATEGORY.BRUTE_FORCE);
  });
});

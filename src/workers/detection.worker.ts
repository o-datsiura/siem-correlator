import { RULE_TYPE, THREAT_CATEGORY, THREAT_SEVERITY } from "@core/domain/enums";
import { getMitreRef } from "@core/domain/mitre-catalog";
import { SanitizationChain } from "@core/pipeline/sanitization-chain";
import { DetectionEngine } from "@core/rules/detection-engine";
import { SignatureRule } from "@core/rules/signature-rule";
import { SlidingWindowRule } from "@core/rules/sliding-window-rule";
import {
  MessageContainsSpecification,
  StatusCodeSpecification,
} from "@core/specifications/base-specification";
import { CONFIGURE_ACTION, WORKER_INCOMING_TYPE, WORKER_OUTGOING_TYPE } from "@workers/protocol";

import type { IRuleDefinition } from "@core/domain/types";
import type { WorkerIncomingMessage, WorkerOutgoingMessage } from "@workers/protocol";

const chain = new SanitizationChain();
const engine = new DetectionEngine();

const SQLI_PATTERNS = [
  "union select",
  "union all select",
  "' or 1=1",
  "' or '1'='1",
  '" or 1=1',
  "' or 'a'='a",
  "1=1--",
  "drop table",
  "drop database",
  "; delete from",
  "insert into",
  "update set",
  "exec(",
  "execute(",
  "xp_cmdshell",
  "sp_executesql",
  "char(0x",
  "concat(0x",
  "benchmark(",
  "sleep(",
  "waitfor delay",
  "load_file(",
  "into outfile",
  "into dumpfile",
  "information_schema",
];

const TRAVERSAL_PATTERNS = [
  "../",
  "..\\",
  "..%2f",
  "..%5c",
  "%2e%2e/",
  "%2e%2e%2f",
  "/etc/passwd",
  "/etc/shadow",
  "/etc/hosts",
  "/proc/self",
  "/var/log",
  "c:\\windows\\",
  "c:/windows/",
  "boot.ini",
  "win.ini",
];

const SCANNER_PATTERNS = [
  "sqlmap",
  "nikto",
  "nmap",
  "masscan",
  "dirbuster",
  "dirb",
  "gobuster",
  "wfuzz",
  "burpsuite",
  "owasp zap",
  "acunetix",
  "nessus",
  "openvas",
  "w3af",
  "skipfish",
  "arachni",
];

const SHELL_PATTERNS = [
  "; ls",
  "| cat ",
  "$(cat ",
  "`cat ",
  "; wget ",
  "; curl ",
  "| bash",
  "; bash",
  "$(bash",
  "; sh -c",
  "| sh -c",
  "; python",
  "; perl",
  "; ruby",
  "/bin/sh",
  "/bin/bash",
  "cmd.exe",
  "powershell",
];

function createDefaultRules(): void {
  const sqliDef: IRuleDefinition = {
    id: "sig-sqli",
    name: "SQL Injection Detection",
    type: RULE_TYPE.SIGNATURE,
    category: THREAT_CATEGORY.SQL_INJECTION,
    severity: THREAT_SEVERITY.HIGH,
    mitreRef: getMitreRef(THREAT_CATEGORY.SQL_INJECTION),
    enabled: true,
  };
  engine.registerRule(new SignatureRule(sqliDef, SQLI_PATTERNS));

  const traversalDef: IRuleDefinition = {
    id: "sig-traversal",
    name: "Directory Traversal Detection",
    type: RULE_TYPE.SIGNATURE,
    category: THREAT_CATEGORY.DIRECTORY_TRAVERSAL,
    severity: THREAT_SEVERITY.HIGH,
    mitreRef: getMitreRef(THREAT_CATEGORY.DIRECTORY_TRAVERSAL),
    enabled: true,
  };
  engine.registerRule(new SignatureRule(traversalDef, TRAVERSAL_PATTERNS));

  const scannerDef: IRuleDefinition = {
    id: "sig-scanner",
    name: "Security Scanner Detection",
    type: RULE_TYPE.SIGNATURE,
    category: THREAT_CATEGORY.SCANNER_DETECTION,
    severity: THREAT_SEVERITY.MEDIUM,
    mitreRef: getMitreRef(THREAT_CATEGORY.SCANNER_DETECTION),
    enabled: true,
  };
  engine.registerRule(new SignatureRule(scannerDef, SCANNER_PATTERNS));

  const shellDef: IRuleDefinition = {
    id: "sig-shell",
    name: "Shell Injection Detection",
    type: RULE_TYPE.SIGNATURE,
    category: THREAT_CATEGORY.SHELL_INJECTION,
    severity: THREAT_SEVERITY.CRITICAL,
    mitreRef: getMitreRef(THREAT_CATEGORY.SHELL_INJECTION),
    enabled: true,
  };
  engine.registerRule(new SignatureRule(shellDef, SHELL_PATTERNS));

  const bruteForceDef: IRuleDefinition = {
    id: "sw-brute-force",
    name: "SSH Brute Force Detection",
    type: RULE_TYPE.SLIDING_WINDOW,
    category: THREAT_CATEGORY.BRUTE_FORCE,
    severity: THREAT_SEVERITY.HIGH,
    mitreRef: getMitreRef(THREAT_CATEGORY.BRUTE_FORCE),
    enabled: true,
  };
  const authFailSpec = new MessageContainsSpecification("failed password")
    .or(new MessageContainsSpecification("authentication failure"))
    .or(new MessageContainsSpecification("invalid user"))
    .or(new MessageContainsSpecification("failed login"));
  engine.registerRule(
    new SlidingWindowRule(
      bruteForceDef,
      60_000,
      5,
      (entry) => entry.clientIp ?? null,
      authFailSpec,
    ),
  );

  const scanSweepDef: IRuleDefinition = {
    id: "sw-http-scan",
    name: "HTTP Scan Sweep Detection",
    type: RULE_TYPE.SLIDING_WINDOW,
    category: THREAT_CATEGORY.SCANNER_DETECTION,
    severity: THREAT_SEVERITY.MEDIUM,
    mitreRef: getMitreRef(THREAT_CATEGORY.SCANNER_DETECTION),
    enabled: true,
  };
  const notFoundSpec = new StatusCodeSpecification(404, 404);
  engine.registerRule(
    new SlidingWindowRule(
      scanSweepDef,
      30_000,
      20,
      (entry) => entry.clientIp ?? null,
      notFoundSpec,
    ),
  );
}

createDefaultRules();

const HOUSEKEEP_INTERVAL_MS = 5_000;
const TELEMETRY_INTERVAL_MS = 1_000;
const MAX_BATCH_SIZE = 500;

setInterval(() => {
  engine.housekeep(Date.now());
}, HOUSEKEEP_INTERVAL_MS);

setInterval(() => {
  const telemetry = engine.getTelemetry();
  const message: WorkerOutgoingMessage = {
    type: WORKER_OUTGOING_TYPE.TELEMETRY_UPDATE,
    payload: telemetry,
  };
  self.postMessage(message);
}, TELEMETRY_INTERVAL_MS);

function handleIngestBatch(lines: readonly string[], sourceId: string): void {
  const entries = [];

  const processLines = lines.slice(0, MAX_BATCH_SIZE);

  for (let i = 0; i < processLines.length; i++) {
    const line = processLines[i];
    if (line === undefined || line.trim().length === 0) {
      continue;
    }
    const entry = chain.process(line, i, sourceId);
    if (entry !== null) {
      entries.push(entry);
    }
  }

  if (entries.length === 0) {
    return;
  }

  const alerts = engine.ingest(entries);

  if (alerts.length > 0) {
    const message: WorkerOutgoingMessage = {
      type: WORKER_OUTGOING_TYPE.EMIT_ALERT,
      payload: { alerts },
    };
    self.postMessage(message);
  }

  if (lines.length > MAX_BATCH_SIZE) {
    const remaining = lines.slice(MAX_BATCH_SIZE);
    setTimeout(() => handleIngestBatch(remaining, sourceId), 0);
  }
}

self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
  try {
    const message = event.data;

    switch (message.type) {
      case WORKER_INCOMING_TYPE.INGEST_BATCH:
        handleIngestBatch(message.payload.lines, message.payload.sourceId);
        break;

      case WORKER_INCOMING_TYPE.CONFIGURE:
        if (message.payload.action === CONFIGURE_ACTION.RESET) {
          engine.reset();
        }
        break;

      case WORKER_INCOMING_TYPE.RESET:
        engine.reset();
        break;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown worker error";
    const outgoing: WorkerOutgoingMessage = {
      type: WORKER_OUTGOING_TYPE.ERROR,
      payload: { message: errorMessage },
    };
    self.postMessage(outgoing);
  }
};

const readyMessage: WorkerOutgoingMessage = { type: WORKER_OUTGOING_TYPE.READY };
self.postMessage(readyMessage);

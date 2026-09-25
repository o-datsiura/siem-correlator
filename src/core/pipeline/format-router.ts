import { LOG_FORMAT, THREAT_SEVERITY } from "@core/domain/enums";
import { AbstractLogHandler } from "@core/pipeline/handler";

import type { LogFormat, ThreatSeverity } from "@core/domain/enums";
import type { ILogEntry, RawLogInput } from "@core/domain/types";

let idCounter = 0;
function generateId(): string {
  idCounter++;

  return `log-${Date.now()}-${idCounter}`;
}

const NGINX_CLF_PATTERN =
  /^(\S{1,256})\s+-\s+\S{1,256}\s+\[([^\]]{1,128})\]\s+(?:"|&quot;)(\S{1,16})\s+(\S{1,2048})\s+\S{1,32}(?:"|&quot;)\s+(\d{1,5})\s+\d{1,16}\s+(?:"|&quot;)[^"]*?(?:"|&quot;)\s+(?:"|&quot;)([^"]*?)(?:"|&quot;)/;

const SYSLOG_PATTERN =
  /^(?:<\d{1,5}>)?(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S{1,256})\s+(\S{1,256})(?:\[(\d{1,10})\])?:\s*(.*)/;

const AUTH_LOG_PATTERN =
  /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S{1,256})\s+sshd\[\d{1,10}\]:\s*(.*)/;

const AUTH_IP_PATTERN = /(?:from|for)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;

function detectFormat(line: string): LogFormat {
  if (line.length > 0 && line[0] === "{") {
    try {
      JSON.parse(line);

      return LOG_FORMAT.JSON;
    } catch {
      // fall through
    }
  }

  if (AUTH_LOG_PATTERN.test(line)) {
    return LOG_FORMAT.AUTH_LOG;
  }

  if (NGINX_CLF_PATTERN.test(line)) {
    return LOG_FORMAT.NGINX_ACCESS;
  }

  if (SYSLOG_PATTERN.test(line)) {
    return LOG_FORMAT.SYSLOG;
  }

  return LOG_FORMAT.UNKNOWN;
}

function parseSyslogTimestamp(raw: string): number {
  const currentYear = new Date().getFullYear();
  const parsed = Date.parse(`${raw} ${currentYear}`);

  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function inferSeverityFromMessage(message: string): ThreatSeverity {
  const lower = message.toLowerCase();

  if (lower.includes("critical") || lower.includes("emergency") || lower.includes("panic")) {
    return THREAT_SEVERITY.CRITICAL;
  }
  if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("failure") ||
    lower.includes("denied") ||
    lower.includes("invalid")
  ) {
    return THREAT_SEVERITY.HIGH;
  }
  if (lower.includes("warning") || lower.includes("warn")) {
    return THREAT_SEVERITY.MEDIUM;
  }
  if (lower.includes("notice") || lower.includes("info")) {
    return THREAT_SEVERITY.LOW;
  }

  return THREAT_SEVERITY.INFO;
}

function inferSeverityFromStatus(statusCode: number): ThreatSeverity {
  if (statusCode >= 500) return THREAT_SEVERITY.HIGH;
  if (statusCode >= 400) return THREAT_SEVERITY.MEDIUM;
  if (statusCode >= 300) return THREAT_SEVERITY.LOW;

  return THREAT_SEVERITY.INFO;
}

function extractJsonEntry(line: string, rawInput: RawLogInput): ILogEntry | null {
  try {
    const parsed: unknown = JSON.parse(line);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const obj = parsed as Record<string, unknown>;

    const message = typeof obj["message"] === "string" ? obj["message"] : line;
    const timestamp =
      typeof obj["timestamp"] === "string"
        ? Date.parse(obj["timestamp"])
        : typeof obj["timestamp"] === "number"
          ? obj["timestamp"]
          : Date.now();

    return {
      id: generateId(),
      timestamp: Number.isNaN(timestamp) ? Date.now() : timestamp,
      source: rawInput.sourceId,
      format: LOG_FORMAT.JSON,
      severity: inferSeverityFromMessage(message),
      message,
      clientIp:
        typeof obj["client_ip"] === "string"
          ? obj["client_ip"]
          : typeof obj["remote_addr"] === "string"
            ? obj["remote_addr"]
            : undefined,
      method: typeof obj["method"] === "string" ? obj["method"] : undefined,
      path: typeof obj["path"] === "string" ? obj["path"] : undefined,
      statusCode: typeof obj["status"] === "number" ? obj["status"] : undefined,
      userAgent: typeof obj["user_agent"] === "string" ? obj["user_agent"] : undefined,
      rawLine: rawInput.line,
      metadata: {},
    };
  } catch {
    return null;
  }
}

function extractNginxEntry(line: string, rawInput: RawLogInput): ILogEntry | null {
  const match = NGINX_CLF_PATTERN.exec(line);

  if (!match) return null;

  const clientIp = match[1] ?? "";
  const timestampRaw = match[2] ?? "";
  const method = match[3] ?? "";
  const path = match[4] ?? "";
  const statusStr = match[5] ?? "0";
  const userAgent = match[6] ?? "";

  const statusCode = parseInt(statusStr, 10);
  const timestamp = Date.parse(timestampRaw.replace(/:/, " ").replaceAll("/", " "));

  return {
    id: generateId(),
    timestamp: Number.isNaN(timestamp) ? Date.now() : timestamp,
    source: rawInput.sourceId,
    format: LOG_FORMAT.NGINX_ACCESS,
    severity: inferSeverityFromStatus(statusCode),
    message: `${method} ${path} ${statusCode}`,
    clientIp,
    method,
    path,
    statusCode,
    userAgent,
    rawLine: rawInput.line,
    metadata: {},
  };
}

function extractAuthLogEntry(line: string, rawInput: RawLogInput): ILogEntry | null {
  const match = AUTH_LOG_PATTERN.exec(line);

  if (!match) return null;

  const timestampRaw = match[1] ?? "";
  const hostname = match[2] ?? "";
  const message = match[3] ?? "";

  const ipMatch = AUTH_IP_PATTERN.exec(message);
  const clientIp = ipMatch?.[1];

  return {
    id: generateId(),
    timestamp: parseSyslogTimestamp(timestampRaw),
    source: rawInput.sourceId,
    format: LOG_FORMAT.AUTH_LOG,
    severity: inferSeverityFromMessage(message),
    message,
    clientIp,
    rawLine: rawInput.line,
    metadata: { hostname },
  };
}

function extractSyslogEntry(line: string, rawInput: RawLogInput): ILogEntry | null {
  const match = SYSLOG_PATTERN.exec(line);

  if (!match) return null;

  const timestampRaw = match[1] ?? "";
  const hostname = match[2] ?? "";
  const appName = match[3] ?? "";
  const message = match[5] ?? "";

  const ipMatch = AUTH_IP_PATTERN.exec(message);
  const clientIp = ipMatch?.[1];

  return {
    id: generateId(),
    timestamp: parseSyslogTimestamp(timestampRaw),
    source: rawInput.sourceId,
    format: LOG_FORMAT.SYSLOG,
    severity: inferSeverityFromMessage(message),
    message,
    clientIp,
    rawLine: rawInput.line,
    metadata: { hostname, appName },
  };
}

function extractUnknownEntry(rawInput: RawLogInput): ILogEntry {
  return {
    id: generateId(),
    timestamp: Date.now(),
    source: rawInput.sourceId,
    format: LOG_FORMAT.UNKNOWN,
    severity: THREAT_SEVERITY.INFO,
    message: rawInput.line,
    rawLine: rawInput.line,
    metadata: {},
  };
}

export class FormatRouterHandler extends AbstractLogHandler {
  protected process(input: RawLogInput): RawLogInput | null {
    return input;
  }

  extractEntry(input: RawLogInput): ILogEntry {
    const format = detectFormat(input.line);

    switch (format) {
      case LOG_FORMAT.JSON: {
        const entry = extractJsonEntry(input.line, input);

        return entry ?? extractUnknownEntry(input);
      }
      case LOG_FORMAT.NGINX_ACCESS: {
        const entry = extractNginxEntry(input.line, input);

        return entry ?? extractUnknownEntry(input);
      }
      case LOG_FORMAT.AUTH_LOG: {
        const entry = extractAuthLogEntry(input.line, input);

        return entry ?? extractUnknownEntry(input);
      }
      case LOG_FORMAT.SYSLOG: {
        const entry = extractSyslogEntry(input.line, input);

        return entry ?? extractUnknownEntry(input);
      }
      case LOG_FORMAT.UNKNOWN:
        return extractUnknownEntry(input);
    }
  }
}

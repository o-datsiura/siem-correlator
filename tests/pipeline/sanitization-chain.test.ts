import { describe, expect, it } from "vitest";

import { SanitizationChain } from "@core/pipeline/sanitization-chain";

describe("Sanitization Pipeline Chain of Responsibility", () => {
  const chain = new SanitizationChain();

  it("strips malicious ANSI escape sequences from logs", () => {
    const raw = "\u001B[31;1mCRITICAL ALERT\u001B[0m Failed password for root";
    const result = chain.process(raw, 1, "syslog-1");

    expect(result).not.toBeNull();
    expect(result?.message).not.toContain("\u001B[31;1m");
    expect(result?.message).toContain("CRITICAL ALERT");
  });

  it("strips dangerous non-printable ASCII control characters during worker ingestion", () => {
    const raw = "MALICIOUS\u0007LOG\u0008PAYLOAD\u0000WITH\u001FCONTROL\u007FCHARS";
    const result = chain.process(raw, 5, "syslog-control");

    expect(result).not.toBeNull();
    expect(result?.message).toBe("MALICIOUSLOGPAYLOADWITHCONTROLCHARS");
  });

  it("escapes dangerous HTML entities to prevent DOM XSS", () => {
    const raw = `<script>alert('xss')</script> "test" & 'quote'`;
    const result = chain.process(raw, 2, "nginx-1");

    expect(result).not.toBeNull();
    expect(result?.message).not.toContain("<script>");
    expect(result?.message).toContain("&lt;script&gt;");
  });

  it("parses Nginx combined log format properly", () => {
    const raw =
      '192.168.1.50 - - [23/Sep/2026:14:00:01 +0000] "GET /admin/dashboard HTTP/1.1" 200 4521 "https://example.com" "Mozilla/5.0"';
    const result = chain.process(raw, 3, "web-server");

    expect(result).not.toBeNull();
    expect(result?.clientIp).toBe("192.168.1.50");
    expect(result?.statusCode).toBe(200);
    expect(result?.method).toBe("GET");
  });

  it("guards against ReDoS with string length limits", () => {
    const longLine = "A".repeat(15000);
    const result = chain.process(longLine, 4, "redos-test");

    expect(result).not.toBeNull();
    expect(result?.rawLine.length).toBeLessThanOrEqual(8192);
  });
});

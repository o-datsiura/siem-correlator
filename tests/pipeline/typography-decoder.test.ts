import { describe, expect, it } from "vitest";

import { decodeTypography } from "@shared/locales/typography-decoder";
import { useTranslation } from "@shared/locales/use-translation";

describe("HTML Entities & Typographic Decoder", () => {
  it("decodes syntax and escaping entities properly", () => {
    expect(decodeTypography("Source &amp; Target")).toBe("Source & Target");
    expect(decodeTypography("A &lt; B &gt; C")).toBe("A < B > C");
    expect(decodeTypography("&quot;quoted&quot; &apos;single&apos;")).toBe("\"quoted\" 'single'");
  });

  it("decodes typographic entities properly", () => {
    expect(decodeTypography("50&nbsp;MB")).toBe("50\u00A0MB");
    expect(decodeTypography("Loading&hellip;")).toBe("Loading\u2026");
    expect(decodeTypography("Break &mdash; text")).toBe("Break \u2014 text");
    expect(decodeTypography("10&ndash;20")).toBe("10\u201320");
    expect(decodeTypography("2 &times; 4")).toBe("2 \u00D7 4");
  });

  it("provides decoded translations via useTranslation()", () => {
    const t = useTranslation();

    expect(t.common.footerTitle).toBe("SIEM Rule Engine & Log Threat Correlator");
    expect(t.tabs.threatOverview).toBe("Threat Correlator & MITRE Matrix");
    expect(t.telemetry.workerInitializing).toBe("Worker Engine: Initializing…");
    expect(t.telemetry.eps(100)).toBe("100\u00A0EPS");
    expect(t.ingestion.fileSizeExceeded).toBe(
      "Security Alert: File size exceeds the 50\u00A0MB security limit.",
    );
  });
});

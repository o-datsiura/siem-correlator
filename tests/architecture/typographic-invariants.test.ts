import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const currentDirPath = import.meta.dirname;
const rootDir = path.resolve(currentDirPath, "../..");
const localesPath = path.resolve(rootDir, "src/shared/locales/en.ts");

describe("HTML Entities & Typographic Architecture Invariants", () => {
  it("enforces .cursorrules has HTML Entities & Typographic Invariants block", () => {
    const cursorrulesPath = path.resolve(rootDir, ".cursorrules");
    expect(fs.existsSync(cursorrulesPath)).toBe(true);

    const content = fs.readFileSync(cursorrulesPath, "utf-8");
    expect(content).toContain("HTML Entities & Typographic Invariants");
    expect(content).toContain("&lt;");
    expect(content).toContain("&gt;");
    expect(content).toContain("&quot;");
    expect(content).toContain("&apos;");
    expect(content).toContain("&amp;");
    expect(content).toContain("&nbsp;");
    expect(content).toContain("&hellip;");
    expect(content).toContain("&mdash;");
    expect(content).toContain("&ndash;");
    expect(content).toContain("&times;");
  });

  it("ensures NO raw triple dots in localization strings (must use &hellip;)", () => {
    const content = fs.readFileSync(localesPath, "utf-8");
    const lines = content.split("\n");

    const violations: { line: number; snippet: string }[] = [];

    lines.forEach((line, index) => {
      // Exclude template literal raw log sample lines if any
      if (line.includes("10.0.0.1") || line.includes("Sep 23")) {
        return;
      }

      if (line.includes("...") && !line.includes("...args")) {
        violations.push({
          line: index + 1,
          snippet: line.trim(),
        });
      }
    });

    expect(violations).toEqual([]);
  });

  it("ensures quantities bound to units use &nbsp; in en.ts", () => {
    const content = fs.readFileSync(localesPath, "utf-8");

    expect(content).toContain("50&nbsp;MB");
    expect(content).toContain("&nbsp;EPS");
    expect(content).toContain("&nbsp;lines");
    expect(content).toContain("&nbsp;Part.");
    expect(content).toContain("&nbsp;s)");
  });

  it("ensures ampersands in titles and matrix mappings use &amp; in en.ts", () => {
    const content = fs.readFileSync(localesPath, "utf-8");

    expect(content).toContain("SIEM Rule Engine &amp; Log Threat Correlator");
    expect(content).toContain("Threat Correlator &amp; MITRE Matrix");
    expect(content).toContain("Log Ingestion &amp; Attack Presets");
    expect(content).toContain("MITRE ATT&amp;CK Matrix Mapping");
    expect(content).toContain("MITRE ATT&amp;CK Matrix Correlation");
  });
});

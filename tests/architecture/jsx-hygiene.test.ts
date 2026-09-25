import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const currentDirPath = import.meta.dirname;
const rootDir = path.resolve(currentDirPath, "../..");
const srcDir = path.resolve(rootDir, "src");

function getTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getTsxFiles(fullPath));
    } else if (entry.name.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("JSX Event Handler Hygiene (Zero Inline Anonymous Callbacks)", () => {
  const tsxFiles = getTsxFiles(srcDir);

  it("finds TSX component files in src", () => {
    expect(tsxFiles.length).toBeGreaterThan(0);
  });

  it("ensures NO inline arrow functions inside JSX event handlers across all TSX files", () => {
    const INLINE_ARROW_PATTERN = /\bon[A-Z]\w*\s*=\s*\{\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/;
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (INLINE_ARROW_PATTERN.test(line)) {
          violations.push({
            file: path.relative(srcDir, file),
            line: index + 1,
            snippet: line.trim(),
          });
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("ensures NO inline anonymous function expressions inside JSX event handlers", () => {
    const INLINE_ANON_FUNCTION_PATTERN = /\bon[A-Z]\w*\s*=\s*\{\s*function\b/;
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (INLINE_ANON_FUNCTION_PATTERN.test(line)) {
          violations.push({
            file: path.relative(srcDir, file),
            line: index + 1,
            snippet: line.trim(),
          });
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("ensures NO direct unpacking of event.target.value inside JSX attributes", () => {
    const INLINE_EVENT_TARGET_PATTERN = /\bon[A-Z]\w*\s*=\s*\{[^}]*\b(?:e|event)\.target\.value\b/;
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (INLINE_EVENT_TARGET_PATTERN.test(line)) {
          violations.push({
            file: path.relative(srcDir, file),
            line: index + 1,
            snippet: line.trim(),
          });
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("ensures Component Hygiene (prohibits complex transformation loops inside .tsx UI files)", () => {
    // .tsx files focus exclusively on declarative rendering and UI layout.
    // Heavy algorithms, imperative data transformations, or raw iteration loops belong in hooks/ or utils/.
    const FORBIDDEN_ALGO_PATTERNS = [
      {
        pattern: /for\s*\(\s*(?:const|let)\s+.*\s+of\s+.*\)\s*\{/,
        rule: "Imperative data transformation loops forbidden inside .tsx UI files. Move to dedicated hooks/ or utils/.",
      },
      {
        pattern: /new\s+Map\s*<.*>\s*\(\s*\)/,
        rule: "Stateful/indexed data structures initialization forbidden in .tsx UI files. Move to hooks/ or utils/.",
      },
    ];

    const violations: { file: string; line: number; rule: string; snippet: string }[] = [];

    for (const file of tsxFiles) {
      // Exclude tests or non-UI files if any were matched
      const relPath = path.relative(rootDir, file);
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        for (const { pattern, rule } of FORBIDDEN_ALGO_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: relPath,
              line: index + 1,
              rule,
              snippet: line.trim(),
            });
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });
});

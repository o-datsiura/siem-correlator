import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const currentFilePath = import.meta.filename;
const currentDirPath = import.meta.dirname;
const rootDir = path.resolve(currentDirPath, "../..");
const srcDir = path.resolve(rootDir, "src");
const testsDir = path.resolve(rootDir, "tests");

function getAllCodeFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...getAllCodeFiles(fullPath));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }

  return results;
}

describe("Strict Import Invariants", () => {
  const allFiles = [...getAllCodeFiles(srcDir), ...getAllCodeFiles(testsDir)];

  it("finds source and test files", () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });

  it("ensures ZERO default or namespace React imports across codebase", () => {
    const REACT_NAMESPACE_PATTERN = /import\s+\*\s+as\s+React\b/;
    const REACT_DEFAULT_PATTERN = /import\s+React\b/;
    const REACT_LOWER_DEFAULT_PATTERN = /import\s+react\b.*from\s+["']react["']/;
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of allFiles) {
      if (file === currentFilePath) {
        continue;
      }

      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (
          REACT_NAMESPACE_PATTERN.test(line) ||
          REACT_DEFAULT_PATTERN.test(line) ||
          REACT_LOWER_DEFAULT_PATTERN.test(line)
        ) {
          violations.push({
            file: path.relative(rootDir, file),
            line: index + 1,
            snippet: line.trim(),
          });
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("ensures ZERO relative imports (100% path aliases enforced)", () => {
    const RELATIVE_IMPORT_PATTERN = /(?:from\s+|import\s*\(?)\s*["'](\.\.?(?:\/[^"']*)?)["']/g;
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        RELATIVE_IMPORT_PATTERN.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = RELATIVE_IMPORT_PATTERN.exec(line)) !== null) {
          violations.push({
            file: path.relative(rootDir, file),
            line: index + 1,
            snippet: match[0],
          });
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("ensures ZERO mixed type and value imports in single import statements", () => {
    const IMPORT_BRACES_PATTERN = /import\s*\{([^}]+)\}\s*from/g;
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      let match: RegExpExecArray | null;

      while ((match = IMPORT_BRACES_PATTERN.exec(content)) !== null) {
        const rawImports = match[1] ?? "";
        const items = rawImports
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const hasTypeItem = items.some((item) => /^type\s+/.test(item));
        const hasValueItem = items.some((item) => !/^type\s+/.test(item));

        if (hasTypeItem && hasValueItem) {
          const lineIndex = content.slice(0, match.index).split("\n").length;

          violations.push({
            file: path.relative(rootDir, file),
            line: lineIndex,
            snippet: match[0].replaceAll(/\s+/g, " ").trim(),
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("ensures Feature Encapsulation (zero cross-importing of internal feature files)", () => {
    const srcFiles = getAllCodeFiles(srcDir);
    const FEATURE_INTERNAL_IMPORT_PATTERN =
      /(?:from\s+|import\s*\(?)\s*["']@features\/([^/"']+)\/([^"']+)["']/g;
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of srcFiles) {
      const relPath = path.relative(rootDir, file);
      const featureMatch = relPath.match(/^src\/features\/([^/]+)\//);
      const currentFeature = featureMatch ? featureMatch[1] : null;

      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        FEATURE_INTERNAL_IMPORT_PATTERN.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = FEATURE_INTERNAL_IMPORT_PATTERN.exec(line)) !== null) {
          const targetFeature = match[1];

          if (currentFeature !== targetFeature) {
            violations.push({
              file: relPath,
              line: index + 1,
              snippet: match[0],
            });
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });
});

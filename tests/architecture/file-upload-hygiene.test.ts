import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { MAX_LOG_FILE_SIZE_BYTES } from "@features/log-ingestion";

const currentDirPath = import.meta.dirname;
const rootDir = path.resolve(currentDirPath, "../..");
const srcDir = path.resolve(rootDir, "src");

function getAllCodeFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

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

describe("File Upload & Ingestion Security Architecture Invariants", () => {
  const allSourceFiles = getAllCodeFiles(srcDir);

  it("strictly forbids FileReader.readAsText() across the entire src directory", () => {
    const FORBIDDEN_PATTERN = /\.readAsText\s*\(/u;
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of allSourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (FORBIDDEN_PATTERN.test(line)) {
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

  it("enforces 50MB file size ceiling constant (50 * 1024 * 1024 bytes)", () => {
    expect(MAX_LOG_FILE_SIZE_BYTES).toBe(52428800);
  });

  it("ensures .cursorrules includes File Upload & Ingestion Security Invariants", () => {
    const cursorrulesPath = path.resolve(rootDir, ".cursorrules");
    expect(fs.existsSync(cursorrulesPath)).toBe(true);

    const content = fs.readFileSync(cursorrulesPath, "utf-8");
    expect(content).toContain("File Upload & Ingestion Security Invariants");
    expect(content).toContain("Pre-flight Size Check");
    expect(content).toContain("Stream-Based Chunking");
    expect(content).toContain("Binary & Executable Guard");
    expect(content).toContain("Sanitization");
    expect(content).toContain("Drag-and-Drop Boundaries");
  });
});

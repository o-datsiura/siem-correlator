import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const currentDirPath = import.meta.dirname;
const rootDir = path.resolve(currentDirPath, "../..");

describe("Secrets & Environment Hygiene Standards", () => {
  it("enforces .cursorignore presence with required secret exclusion patterns", () => {
    const cursorignorePath = path.resolve(rootDir, ".cursorignore");
    expect(fs.existsSync(cursorignorePath)).toBe(true);

    const content = fs.readFileSync(cursorignorePath, "utf-8");
    expect(content).toContain(".env");
    expect(content).toContain(".env.*");
    expect(content).toContain("!.env.example");
    expect(content).toContain("*.pem");
    expect(content).toContain("*.key");
    expect(content).toContain("secrets/");
    expect(content).toContain("credentials.json");
  });

  it("enforces .gitignore presence with strict environment and secrets patterns", () => {
    const gitignorePath = path.resolve(rootDir, ".gitignore");
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const content = fs.readFileSync(gitignorePath, "utf-8");
    expect(content).toContain(".env");
    expect(content).toContain(".env.local");
    expect(content).toContain("*.pem");
    expect(content).toContain("*.key");
    expect(content).toContain("*.id_rsa");
  });

  it("enforces .env.example template with safe placeholders and no credentials", () => {
    const envExamplePath = path.resolve(rootDir, ".env.example");
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const content = fs.readFileSync(envExamplePath, "utf-8");
    expect(content).toContain('VITE_APP_ENV="development"');
    expect(content).toContain('VITE_ENABLE_WORKER_LOGS="false"');

    const forbiddenSecretWords = ["password", "secret", "token", "api_key", "bearer"];
    const lowerContent = content.toLowerCase();
    for (const word of forbiddenSecretWords) {
      expect(lowerContent).not.toContain(`${word}=`);
    }
  });

  it("enforces static typing contract in src/shared/types/env.d.ts", () => {
    const envTypesPath = path.resolve(rootDir, "src/shared/types/env.d.ts");
    expect(fs.existsSync(envTypesPath)).toBe(true);

    const content = fs.readFileSync(envTypesPath, "utf-8");
    expect(content).toContain("interface ImportMetaEnv");
    expect(content).toContain("VITE_APP_ENV");
    expect(content).toContain("VITE_ENABLE_WORKER_LOGS");
  });

  it("verifies zero committed .env or .env.local files in the workspace", () => {
    const forbiddenFiles = [".env", ".env.local", ".env.production", ".env.development"];
    for (const fileName of forbiddenFiles) {
      const filePath = path.resolve(rootDir, fileName);
      expect(fs.existsSync(filePath)).toBe(false);
    }
  });
});

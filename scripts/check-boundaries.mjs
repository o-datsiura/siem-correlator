import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.resolve(rootDir, "src");
const testsDir = path.resolve(rootDir, "tests");
const coreDir = path.resolve(rootDir, "src/core");
const workersDir = path.resolve(rootDir, "src/workers");

// 1. Mandatory Path Alias Rule:
// Local file imports MUST use aliases (@/*, @core/*, @features/*, @shared/*, @workers/*).
// Relative paths ('./' or '../') are strictly forbidden.
const RELATIVE_IMPORT_PATTERN = /(?:from\s+|import\s*\(?)\s*["'](\.\.?(?:\/[^"']*)?)["']/g;

// 2. Clean Architecture Layer Boundaries:
const FORBIDDEN_IN_CORE = [
  { pattern: /from\s+["']react["']/, message: "core layer cannot depend on React" },
  { pattern: /from\s+["']react-dom["']/, message: "core layer cannot depend on React DOM" },
  {
    pattern: /from\s+["']@\/features/,
    message: "core layer cannot depend on presentation features",
  },
  { pattern: /from\s+["']@\/components/, message: "core layer cannot depend on UI components" },
  { pattern: /from\s+["']@features\//, message: "core layer cannot depend on @features" },
  { pattern: /window\./, message: "core layer cannot access global window" },
  { pattern: /document\./, message: "core layer cannot access global document" },
];

const FORBIDDEN_IN_WORKERS = [
  { pattern: /from\s+["']react["']/, message: "workers cannot depend on React" },
  { pattern: /from\s+["']react-dom["']/, message: "workers cannot depend on React DOM" },
  { pattern: /from\s+["']@\/features/, message: "workers cannot depend on presentation features" },
  { pattern: /from\s+["']@\/components/, message: "workers cannot depend on UI components" },
  { pattern: /from\s+["']@features\//, message: "workers cannot depend on @features" },
];

const violations = [];

function checkFileForRelativeImports(filePath, relativePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Reset regex state
    RELATIVE_IMPORT_PATTERN.lastIndex = 0;
    let match;
    while ((match = RELATIVE_IMPORT_PATTERN.exec(line)) !== null) {
      violations.push({
        file: relativePath,
        line: index + 1,
        rule: `Relative import forbidden: "${match[1]}". Use path alias instead (@core/*, @features/*, @shared/*, @workers/*, @/*).`,
        snippet: line.trim(),
      });
    }
  });
}

function checkFileForLayerBoundaries(filePath, relativePath, rules) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (const rule of rules) {
    lines.forEach((line, index) => {
      if (rule.pattern.test(line)) {
        violations.push({
          file: relativePath,
          line: index + 1,
          rule: `Boundary violation: ${rule.message}`,
          snippet: line.trim(),
        });
      }
    });
  }
}

// 3. JSX Event Handler Hygiene:
// Strictly FORBIDDEN to use inline arrow functions or anonymous functions in JSX event handlers.
// Never unpack event.target.value inside JSX.
function checkFileForJsxHygiene(filePath, relativePath) {
  if (!filePath.endsWith(".tsx")) return;
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const INLINE_ARROW_HANDLER_PATTERN = /\bon[A-Z]\w*\s*=\s*\{\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/;
  const INLINE_ANON_FUNCTION_PATTERN = /\bon[A-Z]\w*\s*=\s*\{\s*function\b/;
  const INLINE_EVENT_TARGET_PATTERN = /\bon[A-Z]\w*\s*=\s*\{[^}]*\b(?:e|event)\.target\.value\b/;

  lines.forEach((line, index) => {
    if (INLINE_ARROW_HANDLER_PATTERN.test(line)) {
      violations.push({
        file: relativePath,
        line: index + 1,
        rule: "JSX Hygiene Violation: Inline arrow functions inside JSX event handlers are forbidden. Use dedicated named handlers or curried factory functions.",
        snippet: line.trim(),
      });
    }
    if (INLINE_ANON_FUNCTION_PATTERN.test(line)) {
      violations.push({
        file: relativePath,
        line: index + 1,
        rule: "JSX Hygiene Violation: Anonymous function expressions inside JSX event handlers are forbidden.",
        snippet: line.trim(),
      });
    }
    if (INLINE_EVENT_TARGET_PATTERN.test(line)) {
      violations.push({
        file: relativePath,
        line: index + 1,
        rule: "JSX Hygiene Violation: Unpacking event.target.value inside JSX markup is forbidden. Extract and validate inside a designated handler.",
        snippet: line.trim(),
      });
    }
  });
}

// 4. Zero Default/Namespace React Imports:
function checkFileForReactImports(filePath, relativePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const REACT_NAMESPACE_PATTERN = /import\s+\*\s+as\s+React\b/;
  const REACT_DEFAULT_PATTERN = /import\s+React\b/;
  const REACT_LOWER_DEFAULT_PATTERN = /import\s+react\b.*from\s+["']react["']/;

  lines.forEach((line, index) => {
    if (
      REACT_NAMESPACE_PATTERN.test(line) ||
      REACT_DEFAULT_PATTERN.test(line) ||
      REACT_LOWER_DEFAULT_PATTERN.test(line)
    ) {
      violations.push({
        file: relativePath,
        line: index + 1,
        rule: "Zero Default/Namespace React Imports violation: Strictly forbidden to import default or namespace React. Modern JSX runtime is enabled. Import only specific named hooks/utilities consumed.",
        snippet: line.trim(),
      });
    }
  });
}

// 5. Zero Mixed Type/Value Imports:
function checkFileForMixedImports(filePath, relativePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const IMPORT_BRACES_PATTERN = /import\s*\{([^}]+)\}\s*from/g;
  let match;

  while ((match = IMPORT_BRACES_PATTERN.exec(content)) !== null) {
    const rawImports = match[1];
    const items = rawImports
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const hasTypeItem = items.some((item) => /^type\s+/.test(item));
    const hasValueItem = items.some((item) => !/^type\s+/.test(item));

    if (hasTypeItem && hasValueItem) {
      const lineIndex = content.slice(0, match.index).split("\n").length;
      violations.push({
        file: relativePath,
        line: lineIndex,
        rule: "Zero Mixed Imports violation: Strictly forbidden to mix values and types in a single import statement. Use explicit separate 'import type { ... }'.",
        snippet: match[0].replace(/\s+/g, " ").trim(),
      });
    }
  }
}

// 6. Feature Boundary Encapsulation:
// Cross-importing internal files between sibling features or from outside features is strictly forbidden.
// Communication with features must happen exclusively via public index.ts API boundaries (@features/[feature-name]).
function checkFeatureBoundaryEncapsulation(filePath, relativePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const featureMatch = relativePath.match(/^src\/features\/([^/]+)\//);
  const currentFeature = featureMatch ? featureMatch[1] : null;

  const FEATURE_INTERNAL_IMPORT_PATTERN =
    /(?:from\s+|import\s*\(?)\s*["']@features\/([^/"']+)\/([^"']+)["']/g;

  lines.forEach((line, index) => {
    FEATURE_INTERNAL_IMPORT_PATTERN.lastIndex = 0;
    let match;
    while ((match = FEATURE_INTERNAL_IMPORT_PATTERN.exec(line)) !== null) {
      const targetFeature = match[1];
      const internalPath = match[2];

      if (currentFeature !== targetFeature) {
        violations.push({
          file: relativePath,
          line: index + 1,
          rule: `Feature Boundary Encapsulation violation: Direct import of internal feature path "@features/${targetFeature}/${internalPath}". Communication must happen exclusively via public API boundary "@features/${targetFeature}".`,
          snippet: line.trim(),
        });
      }
    }
  });
}

function walkDirectory(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, callback);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      const relPath = path.relative(rootDir, fullPath);
      callback(fullPath, relPath);
    }
  }
}

// Check 1: Enforce path aliases across all source and test files
walkDirectory(srcDir, (fullPath, relPath) => {
  checkFileForRelativeImports(fullPath, relPath);
});
walkDirectory(testsDir, (fullPath, relPath) => {
  checkFileForRelativeImports(fullPath, relPath);
});

// Check 2: Enforce clean architecture layer boundaries
walkDirectory(coreDir, (fullPath, relPath) => {
  checkFileForLayerBoundaries(fullPath, relPath, FORBIDDEN_IN_CORE);
});
walkDirectory(workersDir, (fullPath, relPath) => {
  checkFileForLayerBoundaries(fullPath, relPath, FORBIDDEN_IN_WORKERS);
});

// Check 3: Enforce JSX event handler hygiene
walkDirectory(srcDir, (fullPath, relPath) => {
  checkFileForJsxHygiene(fullPath, relPath);
});

// Check 4 & 5: Enforce zero default/namespace React imports & zero mixed imports
walkDirectory(srcDir, (fullPath, relPath) => {
  checkFileForReactImports(fullPath, relPath);
  checkFileForMixedImports(fullPath, relPath);
});
walkDirectory(testsDir, (fullPath, relPath) => {
  checkFileForReactImports(fullPath, relPath);
  checkFileForMixedImports(fullPath, relPath);
});

// Check 6: Enforce feature boundary encapsulation (zero external/sibling internal feature imports)
walkDirectory(srcDir, (fullPath, relPath) => {
  checkFeatureBoundaryEncapsulation(fullPath, relPath);
});

if (violations.length > 0) {
  console.error("\n❌ Architectural & Import Invariant Violations Detected:\n");
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line}`);
    console.error(`    Rule:    ${v.rule}`);
    console.error(`    Snippet: ${v.snippet}\n`);
  }
  process.exit(1);
} else {
  console.log("✅ All checks passed:");
  console.log(
    "   - 100% Path Aliases (@core/*, @features/*, @shared/*, @workers/*, @/*) enforced; zero relative imports.",
  );
  console.log(
    "   - Clean Architecture boundaries strictly preserved in src/core/ and src/workers/.",
  );
  console.log(
    "   - Zero inline anonymous callbacks in JSX event handlers; 100% named handlers / curried factories enforced.",
  );
  console.log(
    "   - Zero default/namespace React imports enforced; 100% specific named hooks/utilities consumed.",
  );
  console.log(
    "   - Zero mixed type-and-value import statements; explicit separated type imports enforced.",
  );
  console.log("   - Feature Boundary Encapsulation enforced; zero cross-feature internal imports.");
}

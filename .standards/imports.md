# Import Standards & Formatting Invariants

## 1. Import Ordering & Grouping Hierarchy

All imports across the codebase are formatted and enforced via Prettier using `@ianvs/prettier-plugin-sort-imports`.

### Four-Tier Hierarchy

Imports must be structured into exactly four distinct blocks separated by exactly ONE blank line:

1. **React Named Hooks & Utilities**:
   ```typescript
   import { useCallback, useMemo, useState } from "react";
   ```
2. **Third-Party External Packages**:
   ```typescript
   import { clsx } from "clsx";
   import { AlertTriangle, ShieldCheck } from "lucide-react";
   ```
3. **Internal Layered Path Aliases** (Ordered according to Hexagonal boundaries):
   ```typescript
   import { AhoCorasick } from "@core/algorithms/aho-corasick";
   import { Button } from "@shared/components/ui/button";
   import { IncidentTable } from "@features/incident-viewer/components/IncidentTable";
   import { WorkerMessageType } from "@workers/protocol";
   ```
4. **Explicit Type-Only Imports** (Preceded by `<TYPES>` markers in Prettier configuration):
   ```typescript
   import type { ReactNode } from "react";
   import type { LucideIcon } from "lucide-react";
   import type { IThreatAlert } from "@core/domain/types";
   import type { IIncidentTableProps } from "@features/incident-viewer/types";
   ```

### Prettier Configuration (`.prettierrc`)

The exact ordering in `.prettierrc` is defined as:

```json
"importOrder": [
  "^react$",
  "<THIRD_PARTY_MODULES>",
  "",
  "^@core/(.*)$",
  "^@shared/(.*)$",
  "^@features/(.*)$",
  "^@workers/(.*)$",
  "",
  "<TYPES>^react$",
  "<TYPES>",
  "<TYPES>^@core/(.*)$",
  "<TYPES>^@shared/(.*)$",
  "<TYPES>^@features/(.*)$",
  "<TYPES>^@workers/(.*)$"
]
```

## 2. Zero Default or Namespace React Imports

- **Strictly FORBIDDEN**: Default or namespace React imports (`import * as React from "react"`, `import React from "react"`, `import react from "react"`).
- Modern JSX runtime (`@vitejs/plugin-react`) is enabled. React does not need to be in scope for JSX.
- Import ONLY the specific named hooks and utilities actually consumed:
  ```typescript
  // CORRECT:
  // FORBIDDEN:
  import React, { useEffect, useState, useState } from "react";
  import * as React from "react";
  ```

## 3. Zero Mixed Type and Value Imports

- **Strictly FORBIDDEN**: Mixing runtime values and compile-time types within a single import statement:
  ```typescript
  import { Button, Button } from "@shared/components/ui/button";

  import type { ButtonProps, ButtonProps } from "@shared/components/ui/button";

  // FORBIDDEN:

  // CORRECT:
  ```
- All types must be imported using standalone `import type { ... }` statements in the designated fourth import block.

## 4. Statement Spacing Invariants

1. **Blank Line Before `return`**:
   - ALWAYS insert exactly ONE blank line before a `return` statement in any function, hook, or component body (unless the `return` is the sole statement inside a single-line block).
   ```typescript
   // CORRECT:
   const filtered = items.filter(predicate);

   return filtered;
   ```
2. **Blank Line Before Control Flow**:
   - ALWAYS insert a blank line between variable declarations and subsequent control flow logic (`if`, `switch`, `for`, `while`).
   ```typescript
   // CORRECT:
   const target = event.target;

   if (!target) {
     return;
   }
   ```

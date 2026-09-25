# TypeScript Standards & Typing Invariants

## 1. Strict Compiler & Zero `any`

- Strict TypeScript configuration (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).
- **Strictly FORBIDDEN**: Zero usage of `any`.
  - Use `unknown` with explicit type guards, assertion functions, or discriminated unions.
  - Generics must be constrained where applicable.
- Avoid the non-null assertion operator (`!`). Always prefer safe optional chaining (`?.`), nullish coalescing (`??`), or runtime type narrowing.

## 2. Strict Prohibition of `enum`

- TypeScript `enum` is **strictly FORBIDDEN** across the entire codebase.
- Enums produce bloated runtime JavaScript artifacts, break tree-shaking, and suffer from numeric/string reverse-mapping inconsistencies.

## 3. Mandatory Frozen `as const` Objects with Derived Union Types

All discrete sets of options, categories, severities, and formats must be defined using uppercase frozen objects with `as const`, alongside a derived union type:

### Canonical Pattern

```typescript
// 1. Declare frozen const assertion object:
export const THREAT_SEVERITY = {
  INFO: "INFO",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

// 2. Derive union type from object values:
export type ThreatSeverity = (typeof THREAT_SEVERITY)[keyof typeof THREAT_SEVERITY];
```

### Composition Without Duplicate Declarations

When composing filter states or extending base types, compose directly from the source frozen object:

```typescript
export const FILTER_SEVERITY = {
  ALL: "ALL",
  ...THREAT_SEVERITY,
} as const;

export type FilterSeverity = (typeof FILTER_SEVERITY)[keyof typeof FILTER_SEVERITY];
```

## 4. Immutability & `readonly` Enforcers

- All component prop interfaces must mark fields and arrays as `readonly`:
  ```typescript
  export interface IIncidentTableProps {
    readonly incidents: readonly IThreatAlert[];
    readonly selectedIncidentId: string | null;
    readonly onSelectIncident: (id: string) => void;
  }
  ```
- Function arguments in algorithms and pipelines should be marked `readonly` to prevent unintentional mutations:
  ```typescript
  export function processEventStream(
    events: readonly IRawLogEntry[],
    config: Readonly<IEngineConfig>,
  ): readonly IThreatAlert[] {
    // ...
  }
  ```

## 5. Naming Conventions & Contracts

- **Interfaces**: MUST start with capital `I` (`ILogEntry`, `IThreatAlert`, `IDetectionRule`, `IIncidentTableProps`).
- **Type Aliases**: PascalCase (`ThreatSeverity`, `ThreatFilterState`, `SupportedLocale`).
- **Constant Objects**: SCREAMING_SNAKE_CASE keys and values (`RULE_TYPE.SIGNATURE`).
- **Contract Isolation**: Interfaces and types live in dedicated `*.types.ts` or `types.ts` files.

## 6. Zero Explanatory Comments

- Do not write trivial or explanatory comments in production code.
- Express architectural intent through descriptive identifiers, domain-specific terminology, and self-documenting type systems.

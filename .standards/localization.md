# Localization Standards & String Invariants

## 1. Typed Translation Dictionary Architecture

All user-facing copy in the application is centralized in a strictly-typed localization dictionary:

- **Dictionary Source**: `src/shared/locales/en.ts`
- **Type Derivation**: `src/shared/locales/types.ts`
  ```typescript
  import type { en } from "@shared/locales/en";

  export type ILocaleTranslations = typeof en;
  export type SupportedLocale = "en";
  ```
- **Translation Hook**: `src/shared/locales/use-translation.ts`
  ```typescript
  import { useTranslation } from "@shared/locales";

  export const IncidentDashboard = () => {
    const { t } = useTranslation();
    return <h2>{t.incidents.streamTitle}</h2>;
  };
  ```

## 2. Zero Hardcoded Strings in JSX

- **Strictly FORBIDDEN**: Hardcoding raw text strings, titles, button labels, descriptions, or error messages directly in JSX markup.
- Every piece of text displayed to the operator must be extracted to `src/shared/locales/en.ts` and referenced through `t.<namespace>.<key>`.
- **Allowed in JSX**: Purely structural markup, semantic icons, or dynamic values passed into typed translation functions.

## 3. Dynamic Strings & Parameterized Helpers

When text requires dynamic variables (counts, durations, names, IDs), express them as pure functions returning formatted strings within the translation dictionary:

```typescript
// In src/shared/locales/en.ts:
export const en = {
  telemetry: {
    eps: (value: number) => `${value.toLocaleString()}&nbsp;EPS`,
    partitionsSummary: (partitions: number, seconds: number) =>
      `${partitions}&nbsp;Part. (${seconds}&nbsp;s)`,
  },
  incidents: {
    incidentsCount: (filtered: number, total: number) => `${filtered} / ${total}&nbsp;Incidents`,
    drawer: {
      idLabel: (id: string) => `ID: ${id}`,
      ruleLabel: (ruleName: string) => `Rule: ${ruleName}`,
    },
  },
};
```

## 4. Typographic Entity Invariants in Localization

All strings inside `src/shared/locales/en.ts` must adhere to strict HTML typography rules:

- **Ampersands**: Use `&amp;` instead of raw `&` (e.g., `"SIEM Rule Engine &amp; Log Threat Correlator"`).
- **Units & Quantities**: Bind quantities and measurements to their units using `&nbsp;` (e.g., `"50&nbsp;MB"`, `"100&nbsp;EPS"`, `"${count}&nbsp;lines"`).
- **Ellipses**: Use `&hellip;` for loading or continuation states (e.g., `"Worker Engine: Initializing&hellip;"`, `"Search IP, rule&hellip;"`). Never use triple dots `...`.
- **Dashes**: Use `&mdash;` for prose breaks and `&ndash;` for numeric ranges.
- **Quotes**: Escape quotes and apostrophes when necessary (`&quot;`, `&apos;`).

# Claude Code Guide & Repository Standards

This repository is an in-browser SIEM (Security Information and Event Management) log correlation engine written in React 19, TypeScript, Vite, Tailwind CSS v4, and isolated Web Workers.

## 1. Development & Verification Commands

- `pnpm dev`: Start local development Vite server.
- `pnpm build`: Run TypeScript compiler (`tsc -b --noEmit`) and Vite production bundle build.
- `pnpm test`: Run full Vitest test suite.
- `pnpm test:bench`: Run algorithmic performance benchmarks (Aho-Corasick & Ring Buffer Deque).
- `pnpm test:coverage`: Run tests with v8 code coverage reporting.
- `pnpm lint`: Run Oxlint across `src/` and `tests/`.
- `pnpm lint:boundaries`: Run architecture layer boundary and import invariant verification script.
- `pnpm format`: Format files using Prettier.
- `pnpm format:check`: Verify formatting consistency across the repository.
- `pnpm typecheck`: Run TypeScript type-checking without emitting code.
- `pnpm check-all`: Execute all quality gates (`format:check`, `lint`, `typecheck`, `test`).

## 2. Central Architecture & Coding Standards

All code generation, modifications, and refactoring MUST strictly adhere to the single source of truth located in `.standards/`:

| Topic            | Specification File                                       | Key Invariants                                                                                                                                                                                                                                                                                                                                                     |
| :--------------- | :------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture** | [.standards/architecture.md](.standards/architecture.md) | Hexagonal isolation (`src/core`, `src/workers`, `src/shared`, `src/features`), 1:1 file convention, 100% path aliases (`@core/*`, `@shared/*`, `@features/*`, `@workers/*`), zero relative imports, zero inline JSX arrow handlers, fat component prohibition (zero business/state algorithms in `.tsx`), feature encapsulation with public `index.ts` boundaries. |
| **TypeScript**   | [.standards/typescript.md](.standards/typescript.md)     | Strict typing, zero `any`, strict prohibition of `enum`, mandatory frozen `as const` objects with derived union types `(typeof OBJ)[keyof typeof OBJ]`, `readonly` immutability, `I` prefix for interfaces.                                                                                                                                                        |
| **Styling**      | [.standards/styling.md](.standards/styling.md)           | Semantic shadcn/ui tokens (`bg-background`, `text-primary`, `border-border`), zero arbitrary color utilities, Tailwind spacing scale (multiples of 4 / `rem`), "Cyber-Slate & Cyan" theme palette in `src/index.css`.                                                                                                                                              |
| **AppSec**       | [.standards/appsec.md](.standards/appsec.md)             | File upload invariants (50&nbsp;MB limit, chunked `file.stream().getReader()`, binary guard, ANSI sanitization), zero `dangerouslySetInnerHTML`, ReDoS protection, memory caps, strict HTML entities (`&lt;`, `&gt;`, `&quot;`, `&apos;`, `&amp;`, `&nbsp;`, `&hellip;`, `&mdash;`, `&ndash;`, `&times;`).                                                         |
| **Imports**      | [.standards/imports.md](.standards/imports.md)           | 4-tier import ordering with `@ianvs/prettier-plugin-sort-imports`, zero default/namespace React imports (`import React from "react"` forbidden), zero mixed type/value imports, blank line before `return` and control flow.                                                                                                                                       |
| **Localization** | [.standards/localization.md](.standards/localization.md) | Typed translation dictionary in `src/shared/locales/en.ts` consumed via `useTranslation()`, zero hardcoded user-facing strings in JSX markup.                                                                                                                                                                                                                      |

## 3. High-Priority Invariants at a Glance

- Never use relative imports (`./`, `../`). Use designated `@core/*`, `@shared/*`, `@features/*`, `@workers/*` aliases.
- Never place complex business logic, transformation algorithms, or heavy state management in `.tsx` files (strictly declarative rendering; use custom hooks in `hooks/`).
- Feature encapsulation: Every feature must be self-contained in `src/features/[feature-name]/` with standard layout (`components`, `hooks`, `utils`, `constants`, `types`). Sibling cross-imports between internal files are strictly forbidden; communicate exclusively via public `index.ts`.
- Never import default React (`import React from "react"`). Use named hook imports (`import { useState } from "react"`).
- Never use TypeScript `enum`. Use `export const FOO = { ... } as const; export type Foo = (typeof FOO)[keyof typeof FOO];`.
- Never create or edit `.env` files. Reference `src/shared/types/env.d.ts` and use `import.meta.env`.
- Always verify changes with `pnpm lint:boundaries` and `pnpm test`.

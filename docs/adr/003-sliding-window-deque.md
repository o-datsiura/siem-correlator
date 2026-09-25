# ADR-003: Sliding Window with Custom Deque for Frequency Detection

## Status

Accepted

## Context

Certain attack patterns are not detectable from a single log line. Brute-force SSH attacks manifest as multiple authentication failures from the same source IP within a short time window. Port scanning appears as numerous connection attempts across different ports from a single source. These require **stateful, time-windowed frequency analysis**.

### Requirements

- Track event counts per partition key (e.g., source IP) within a configurable time window
- Alert when event count exceeds a threshold within the window
- Evict expired events efficiently as time progresses
- Bound memory usage to prevent unbounded growth from many unique partition keys

### Alternatives Considered

**Array-Based Window**: Store timestamps in a plain array, use `Array.shift()` for eviction.

- `shift()` is O(n) — causes linear-time degradation as window fills
- Frequent allocations from array resizing

**Map with Timestamp Arrays**: `Map<string, number[]>` with periodic filtering.

- Same O(n) shift problem per partition
- Filtering requires full array scan

**Circular Buffer with Fixed Size**: Pre-allocate a fixed-size buffer.

- Wastes memory when partition has few events
- Requires upfront sizing decisions

## Decision

Implement a custom generic `Deque<T>` (double-ended queue) data structure using a **dynamically-resizing circular ring buffer**.

Each sliding window partition (keyed by e.g., source IP) maintains its own `Deque<number>` storing event timestamps. Events are pushed to the back; expired events are popped from the front.

**Operations**:

- `pushBack(timestamp)`: O(1) amortized — append new event
- `popFront()`: O(1) amortized — evict oldest expired event
- `peekFront()`: O(1) — check oldest timestamp without removal
- `size`: O(1) — current event count for threshold comparison

**Memory Bounds**:

- Max 10,000 partitions per `SlidingWindowRule` (LRU eviction of least-active partitions)
- Max 1,000 entries per partition deque (oldest entries dropped on overflow)
- Periodic housekeeping (every 5 seconds) evicts expired entries from all partitions

## Consequences

### Positive

- O(1) amortized for all operations (push, pop, peek, size)
- Dynamic sizing: starts small, grows as needed, never shrinks below initial capacity
- Bounded memory via per-partition and per-rule caps
- Generic implementation reusable for other data structure needs

### Negative

- Slightly more complex than plain array (ring buffer pointer arithmetic)
- Doubling resize copies existing elements (amortized O(1) but occasional O(n) spike)

### Implementation Notes

- Initial capacity: 16 elements
- Growth factor: 2x (doubles when full)
- Ring buffer uses modular arithmetic: `index = (head + offset) % capacity`
- The deque stores only timestamps (numbers), keeping per-element overhead minimal

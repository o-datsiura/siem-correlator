import { Deque } from "@core/algorithms/deque";

import type { ILogEntry, IRuleDefinition, IThreatAlert } from "@core/domain/types";
import type { IStatefulRule } from "@core/rules/rule";
import type { BaseSpecification } from "@core/specifications/base-specification";

const MAX_PARTITIONS = 10_000;
const MAX_ENTRIES_PER_PARTITION = 1_000;

let alertCounter = 0;
function generateAlertId(): string {
  alertCounter++;
  return `sw-alert-${Date.now()}-${alertCounter}`;
}

interface PartitionState {
  readonly deque: Deque<number>;
  lastAccess: number;
}

export class SlidingWindowRule implements IStatefulRule {
  readonly definition: IRuleDefinition;
  private readonly windowDurationMs: number;
  private readonly threshold: number;
  private readonly partitionKeyExtractor: (entry: ILogEntry) => string | null;
  private readonly eventFilter: BaseSpecification<ILogEntry>;
  private readonly partitions: Map<string, PartitionState>;

  constructor(
    definition: IRuleDefinition,
    windowDurationMs: number,
    threshold: number,
    partitionKeyExtractor: (entry: ILogEntry) => string | null,
    eventFilter: BaseSpecification<ILogEntry>,
  ) {
    this.definition = definition;
    this.windowDurationMs = windowDurationMs;
    this.threshold = threshold;
    this.partitionKeyExtractor = partitionKeyExtractor;
    this.eventFilter = eventFilter;
    this.partitions = new Map();
  }

  get partitionCount(): number {
    return this.partitions.size;
  }

  evaluate(entry: ILogEntry): IThreatAlert | null {
    if (!this.definition.enabled) {
      return null;
    }

    if (!this.eventFilter.isSatisfiedBy(entry)) {
      return null;
    }

    const key = this.partitionKeyExtractor(entry);
    if (key === null) {
      return null;
    }

    let partition = this.partitions.get(key);
    if (!partition) {
      if (this.partitions.size >= MAX_PARTITIONS) {
        this.evictLeastRecentPartition();
      }
      partition = {
        deque: new Deque<number>(),
        lastAccess: Date.now(),
      };
      this.partitions.set(key, partition);
    }

    partition.lastAccess = Date.now();

    if (partition.deque.size >= MAX_ENTRIES_PER_PARTITION) {
      partition.deque.popFront();
    }

    const eventTimestamp = entry.timestamp;
    partition.deque.pushBack(eventTimestamp);

    const cutoff = eventTimestamp - this.windowDurationMs;
    while (!partition.deque.isEmpty && (partition.deque.peekFront() ?? 0) < cutoff) {
      partition.deque.popFront();
    }

    if (partition.deque.size >= this.threshold) {
      const alert: IThreatAlert = {
        id: generateAlertId(),
        timestamp: Date.now(),
        ruleId: this.definition.id,
        ruleName: this.definition.name,
        category: this.definition.category,
        severity: this.definition.severity,
        sourceEntry: entry,
        matchedPatterns: [
          `${partition.deque.size} events in ${this.windowDurationMs / 1000}s window`,
        ],
        mitreRef: this.definition.mitreRef,
        context: {
          partitionKey: key,
          windowSize: String(partition.deque.size),
          threshold: String(this.threshold),
          windowDurationMs: String(this.windowDurationMs),
        },
      };

      partition.deque.clear();
      return alert;
    }

    return null;
  }

  evictExpired(now: number): void {
    const cutoff = now - this.windowDurationMs;
    const emptyKeys: string[] = [];

    for (const [key, partition] of this.partitions) {
      while (!partition.deque.isEmpty && (partition.deque.peekFront() ?? 0) < cutoff) {
        partition.deque.popFront();
      }
      if (partition.deque.isEmpty) {
        emptyKeys.push(key);
      }
    }

    for (const key of emptyKeys) {
      this.partitions.delete(key);
    }
  }

  reset(): void {
    this.partitions.clear();
  }

  private evictLeastRecentPartition(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, partition] of this.partitions) {
      if (partition.lastAccess < oldestTime) {
        oldestTime = partition.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.partitions.delete(oldestKey);
    }
  }
}

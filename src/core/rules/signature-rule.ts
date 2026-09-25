import { AhoCorasick } from "@core/algorithms/aho-corasick";

import type { ILogEntry, IRuleDefinition, IThreatAlert } from "@core/domain/types";
import type { IDetectionRule } from "@core/rules/rule";

let alertCounter = 0;
function generateAlertId(): string {
  alertCounter++;
  return `alert-${Date.now()}-${alertCounter}`;
}

export class SignatureRule implements IDetectionRule {
  readonly definition: IRuleDefinition;
  private readonly automaton: AhoCorasick;

  constructor(definition: IRuleDefinition, patterns: readonly string[]) {
    this.definition = definition;
    this.automaton = new AhoCorasick();
    for (const pattern of patterns) {
      this.automaton.addPattern(pattern);
    }
    this.automaton.build();
  }

  evaluate(entry: ILogEntry): IThreatAlert | null {
    if (!this.definition.enabled) {
      return null;
    }

    const searchText = [entry.message, entry.path ?? "", entry.userAgent ?? ""].join(" ");

    const matches = this.automaton.search(searchText);
    if (matches.length === 0) {
      return null;
    }

    const uniquePatterns = [...new Set(matches.map((m) => m.pattern))];

    return {
      id: generateAlertId(),
      timestamp: Date.now(),
      ruleId: this.definition.id,
      ruleName: this.definition.name,
      category: this.definition.category,
      severity: this.definition.severity,
      sourceEntry: entry,
      matchedPatterns: uniquePatterns,
      mitreRef: this.definition.mitreRef,
      context: {
        sourceIp: entry.clientIp ?? "unknown",
        matchCount: String(matches.length),
      },
    };
  }

  reset(): void {
    // stateless — nothing to reset
  }
}

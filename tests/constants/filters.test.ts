import { describe, expect, it } from "vitest";

import { FILTER_SEVERITY } from "@features/incident-viewer";

import type { FilterSeverity } from "@features/incident-viewer";

describe("FILTER_SEVERITY constant invariant", () => {
  it("contains expected severity filters including ALL and domain severities", () => {
    expect(FILTER_SEVERITY.ALL).toBe("ALL");
    expect(FILTER_SEVERITY.CRITICAL).toBe("CRITICAL");
    expect(FILTER_SEVERITY.HIGH).toBe("HIGH");
    expect(FILTER_SEVERITY.MEDIUM).toBe("MEDIUM");
    expect(FILTER_SEVERITY.LOW).toBe("LOW");
    expect(FILTER_SEVERITY.INFO).toBe("INFO");
  });

  it("satisfies the FilterSeverity type", () => {
    const activeFilter: FilterSeverity = FILTER_SEVERITY.ALL;

    expect(Object.values(FILTER_SEVERITY)).toContain(activeFilter);
  });
});

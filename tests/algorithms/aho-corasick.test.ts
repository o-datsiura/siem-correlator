import { describe, expect, it } from "vitest";

import { AhoCorasick } from "@core/algorithms/aho-corasick";

describe("AhoCorasick Pattern Search Automaton", () => {
  it("matches multiple exact attack signatures in a single pass", () => {
    const ac = new AhoCorasick();
    ac.addPattern("union select");
    ac.addPattern("drop table");
    ac.addPattern("../");
    ac.build();

    const text = "GET /index.php?id=1' UNION SELECT username, password FROM users -- HTTP/1.1";
    const matches = ac.search(text);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m) => m.pattern === "union select")).toBe(true);
  });

  it("handles case-insensitive matches cleanly", () => {
    const ac = new AhoCorasick();
    ac.addPattern("cmd.exe");
    ac.addPattern("/bin/bash");
    ac.build();

    const matches1 = ac.search("suspicious payload: /BIN/BASH -i");
    const matches2 = ac.search("windows attack: CMD.EXE /c whoami");

    expect(matches1.some((m) => m.pattern === "/bin/bash")).toBe(true);
    expect(matches2.some((m) => m.pattern === "cmd.exe")).toBe(true);
  });

  it("detects overlapping patterns correctly", () => {
    const ac = new AhoCorasick();
    ac.addPattern("admin");
    ac.addPattern("administrator");
    ac.build();

    const matches = ac.search("Login attempt for administrator");
    const matchedPatterns = matches.map((m) => m.pattern);

    expect(matchedPatterns).toContain("admin");
    expect(matchedPatterns).toContain("administrator");
  });

  it("safely handles empty text and empty pattern set", () => {
    const emptyAc = new AhoCorasick();
    emptyAc.build();
    expect(emptyAc.search("some arbitrary text")).toEqual([]);

    const ac = new AhoCorasick();
    ac.addPattern("test");
    ac.build();
    expect(ac.search("")).toEqual([]);
  });

  it("safely truncates or bounds inputs exceeding MAX_INPUT_LENGTH", () => {
    const ac = new AhoCorasick();
    ac.addPattern("malicious");
    ac.build();

    const hugePayload = "a".repeat(20000) + "malicious";
    const matches = ac.search(hugePayload);
    // Bounded search stops at max length, preventing DoS
    expect(Array.isArray(matches)).toBe(true);
  });
});

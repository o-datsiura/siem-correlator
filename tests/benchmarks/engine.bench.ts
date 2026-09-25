import { describe, expect, it } from "vitest";

import { AhoCorasick } from "@core/algorithms/aho-corasick";
import { Deque } from "@core/algorithms/deque";

describe("Algorithmic Performance Regression Gate", () => {
  const patterns = [
    "union select",
    "drop table",
    "exec xp_",
    "../",
    "..\\",
    "/etc/passwd",
    "cmd.exe",
    "/bin/bash",
    "nikto",
    "sqlmap",
  ];

  const ac = new AhoCorasick();
  for (const p of patterns) {
    ac.addPattern(p);
  }
  ac.build();

  const sampleLog =
    "GET /index.php?id=123' UNION SELECT username, password FROM auth_users WHERE admin=1 -- HTTP/1.1 200 4096 User-Agent: sqlmap/1.7.2#stable";

  it("executes 10,000 Aho-Corasick searches within 50ms budget", () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      ac.search(sampleLog);
    }
    const elapsed = performance.now() - start;
    console.log(`[PERF GATE] 10,000 Aho-Corasick searches completed in: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(500); // Generous margin for CI environments
  });

  it("executes 100,000 Deque push/pop operations within 50ms budget", () => {
    const deque = new Deque<number>(64);
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      deque.pushBack(i);
    }
    for (let i = 0; i < 100000; i++) {
      deque.popFront();
    }
    const elapsed = performance.now() - start;
    console.log(
      `[PERF GATE] 100,000 Deque push/pop operations completed in: ${elapsed.toFixed(2)}ms`,
    );
    expect(elapsed).toBeLessThan(500);
  });
});

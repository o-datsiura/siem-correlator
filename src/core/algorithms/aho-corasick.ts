import type { AhoCorasickMatch } from "@core/domain/types";

const DEFAULT_MAX_INPUT_LENGTH = 8192;

interface TrieNode {
  readonly children: Map<string, TrieNode>;
  failureLink: TrieNode | null;
  readonly outputs: string[];
  readonly depth: number;
}

function createTrieNode(depth: number): TrieNode {
  return {
    children: new Map(),
    failureLink: null,
    outputs: [],
    depth,
  };
}

export class AhoCorasick {
  private readonly root: TrieNode;
  private built: boolean;
  private readonly maxInputLength: number;

  constructor(maxInputLength: number = DEFAULT_MAX_INPUT_LENGTH) {
    this.root = createTrieNode(0);
    this.built = false;
    this.maxInputLength = maxInputLength;
  }

  addPattern(pattern: string): void {
    if (pattern.length === 0) {
      return;
    }
    this.built = false;
    const normalizedPattern = pattern.toLowerCase();
    let current = this.root;

    for (let i = 0; i < normalizedPattern.length; i++) {
      const char = normalizedPattern[i]!;
      let child = current.children.get(char);
      if (!child) {
        child = createTrieNode(current.depth + 1);
        current.children.set(char, child);
      }
      current = child;
    }

    current.outputs.push(pattern);
  }

  build(): void {
    const queue: TrieNode[] = [];

    for (const child of this.root.children.values()) {
      child.failureLink = this.root;
      queue.push(child);
    }

    let head = 0;
    while (head < queue.length) {
      const current = queue[head]!;
      head++;

      for (const [char, child] of current.children) {
        queue.push(child);

        let fallback = current.failureLink;
        while (fallback !== null && !fallback.children.has(char)) {
          fallback = fallback.failureLink;
        }

        child.failureLink = fallback?.children.get(char) ?? this.root;

        if (child.failureLink === child) {
          child.failureLink = this.root;
        }

        if (child.failureLink.outputs.length > 0) {
          child.outputs.push(...child.failureLink.outputs);
        }
      }
    }

    this.built = true;
  }

  search(text: string): AhoCorasickMatch[] {
    if (!this.built) {
      this.build();
    }

    const searchText =
      text.length > this.maxInputLength ? text.slice(0, this.maxInputLength) : text;

    const normalizedText = searchText.toLowerCase();
    const matches: AhoCorasickMatch[] = [];
    let current = this.root;

    for (let i = 0; i < normalizedText.length; i++) {
      const char = normalizedText[i]!;

      while (current !== this.root && !current.children.has(char)) {
        current = current.failureLink ?? this.root;
      }

      const next = current.children.get(char);
      if (next) {
        current = next;
      }

      if (current.outputs.length > 0) {
        for (const pattern of current.outputs) {
          matches.push({
            pattern,
            position: i - pattern.length + 1,
          });
        }
      }
    }

    return matches;
  }

  get patternCount(): number {
    let count = 0;
    const stack: TrieNode[] = [this.root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.depth > 0 && node.outputs.length > 0) {
        count += node.outputs.filter(
          (_, idx) => idx === 0 || node.outputs[idx] !== node.outputs[idx - 1],
        ).length;
      }
      for (const child of node.children.values()) {
        stack.push(child);
      }
    }
    return count;
  }

  get isBuilt(): boolean {
    return this.built;
  }
}

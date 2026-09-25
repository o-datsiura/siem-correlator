const DEFAULT_INITIAL_CAPACITY = 16;

export class Deque<T> {
  private buffer: Array<T | undefined>;
  private head: number;
  private tail: number;
  private count: number;
  private readonly initialCapacity: number;

  constructor(initialCapacity: number = DEFAULT_INITIAL_CAPACITY) {
    const capacity = Math.max(initialCapacity, 4);
    this.buffer = new Array<T | undefined>(capacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.initialCapacity = capacity;
  }

  get size(): number {
    return this.count;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  get capacity(): number {
    return this.buffer.length;
  }

  pushBack(item: T): void {
    if (this.count === this.buffer.length) {
      this.resize(this.buffer.length * 2);
    }
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.buffer.length;
    this.count++;
  }

  pushFront(item: T): void {
    if (this.count === this.buffer.length) {
      this.resize(this.buffer.length * 2);
    }
    this.head = (this.head - 1 + this.buffer.length) % this.buffer.length;
    this.buffer[this.head] = item;
    this.count++;
  }

  popBack(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    this.tail = (this.tail - 1 + this.buffer.length) % this.buffer.length;
    const item = this.buffer[this.tail];
    this.buffer[this.tail] = undefined;
    this.count--;
    return item;
  }

  popFront(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.buffer.length;
    this.count--;
    return item;
  }

  peekFront(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    return this.buffer[this.head];
  }

  peekBack(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    const index = (this.tail - 1 + this.buffer.length) % this.buffer.length;
    return this.buffer[index];
  }

  at(index: number): T | undefined {
    if (index < 0 || index >= this.count) {
      return undefined;
    }
    return this.buffer[(this.head + index) % this.buffer.length];
  }

  clear(): void {
    this.buffer = new Array<T | undefined>(this.initialCapacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.buffer[(this.head + i) % this.buffer.length];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  private resize(newCapacity: number): void {
    const newBuffer = new Array<T | undefined>(newCapacity);
    for (let i = 0; i < this.count; i++) {
      newBuffer[i] = this.buffer[(this.head + i) % this.buffer.length];
    }
    this.buffer = newBuffer;
    this.head = 0;
    this.tail = this.count;
  }
}

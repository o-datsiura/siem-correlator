import { describe, expect, it } from "vitest";

import { Deque } from "@core/algorithms/deque";

describe("Deque Circular Buffer Data Structure", () => {
  it("pushes and pops items in FIFO order", () => {
    const deque = new Deque<number>();
    deque.pushBack(10);
    deque.pushBack(20);
    deque.pushBack(30);

    expect(deque.size).toBe(3);
    expect(deque.peekFront()).toBe(10);
    expect(deque.peekBack()).toBe(30);

    expect(deque.popFront()).toBe(10);
    expect(deque.popFront()).toBe(20);
    expect(deque.popFront()).toBe(30);
    expect(deque.isEmpty).toBe(true);
  });

  it("handles circular buffer wrap-around correctly", () => {
    const deque = new Deque<number>(4);
    deque.pushBack(1);
    deque.pushBack(2);
    expect(deque.popFront()).toBe(1); // head advances
    deque.pushBack(3);
    deque.pushBack(4);
    deque.pushBack(5);

    expect(deque.size).toBe(4);
    expect(deque.popFront()).toBe(2);
    expect(deque.popFront()).toBe(3);
    expect(deque.popFront()).toBe(4);
    expect(deque.popFront()).toBe(5);
  });

  it("dynamically doubles capacity when exceeding initial limit", () => {
    const deque = new Deque<number>(2);
    for (let i = 0; i < 1000; i++) {
      deque.pushBack(i);
    }
    expect(deque.size).toBe(1000);
    for (let i = 0; i < 1000; i++) {
      expect(deque.popFront()).toBe(i);
    }
    expect(deque.isEmpty).toBe(true);
  });

  it("handles empty operations gracefully", () => {
    const deque = new Deque<string>();
    expect(deque.popFront()).toBeUndefined();
    expect(deque.popBack()).toBeUndefined();
    expect(deque.peekFront()).toBeUndefined();
    expect(deque.peekBack()).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { RejectedTokenCache } from "../negcache.js";

describe("RejectedTokenCache", () => {
  it("misses, then hits, then expires", () => {
    const cache = new RejectedTokenCache(1000, 5);
    expect(cache.isRejected("t", 0)).toBe(false); // miss
    cache.mark("t", 0);
    expect(cache.isRejected("t", 500)).toBe(true); // within TTL
    expect(cache.isRejected("t", 1000)).toBe(false); // expired → deleted
    expect(cache.isRejected("t", 1500)).toBe(false); // gone
  });

  it("evicts the oldest entry when full", () => {
    const cache = new RejectedTokenCache(1000, 2);
    cache.mark("a", 0);
    cache.mark("b", 0);
    cache.mark("c", 0); // over capacity → evicts "a"
    expect(cache.isRejected("a", 0)).toBe(false);
    expect(cache.isRejected("c", 0)).toBe(true);
  });
});

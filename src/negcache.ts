import { createHash } from "node:crypto";

// Negative cache of recently-rejected token fingerprints. A repeated bad token gets
// a fast local reject without re-hitting core /v1/me, bounding amplification. Tokens
// are hashed (never stored raw); entries expire and the map is size-capped.
export class RejectedTokenCache {
  private readonly entries = new Map<string, number>();

  constructor(
    private readonly ttlMs = 60_000,
    private readonly maxSize = 10_000
  ) {}

  private static fingerprint(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  isRejected(token: string, now: number): boolean {
    const fp = RejectedTokenCache.fingerprint(token);
    const exp = this.entries.get(fp);
    if (exp === undefined) return false;
    if (now >= exp) {
      this.entries.delete(fp);
      return false;
    }
    return true;
  }

  mark(token: string, now: number): void {
    if (this.entries.size >= this.maxSize) {
      // Eviction only runs when at least one entry exists, so keys() is non-empty.
      const oldest = this.entries.keys().next().value as string;
      this.entries.delete(oldest);
    }
    this.entries.set(RejectedTokenCache.fingerprint(token), now + this.ttlMs);
  }
}

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// The HTTP transport runs with enableJsonResponse, which drops progress
// notifications (verified in the SDK source). No tool may rely on them, or its
// progress would silently vanish over HTTP. This guards against a future tool
// wiring up sendNotification / sendProgress.
const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "tools");
const FORBIDDEN = /sendNotification|sendProgress|notifications\/progress/;

describe("tools emit no progress notifications", () => {
  const files = readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".ts"));

  it("has tool files to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file} does not call a progress API`, () => {
      const source = readFileSync(join(TOOLS_DIR, file), "utf8");
      expect(FORBIDDEN.test(source)).toBe(false);
    });
  }
});

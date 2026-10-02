import { describe, expect, it } from "vitest";
import { hasResourceFileSignature } from "./hasResourceFileSignature";
describe("resource file signatures", () => {
  it.each([
    ["pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]],
    ["jpg", [0xff, 0xd8, 0xff]], ["jpeg", [0xff, 0xd8, 0xff]],
    ["png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ["webp", [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]],
  ] as const)("accepts the %s file header", (extension, bytes) => {
    expect(hasResourceFileSignature(new Uint8Array(bytes), extension)).toBe(true);
  });
  it.each(["pdf", "jpg", "jpeg", "png", "webp", "xlsx"])("rejects HTML disguised as %s", extension => {
    expect(hasResourceFileSignature(new TextEncoder().encode("<html>bad</html>"), extension)).toBe(false);
    expect(hasResourceFileSignature(new Uint8Array(), extension)).toBe(false);
  });
  it("requires WEBP as well as RIFF", () => {
    expect(hasResourceFileSignature(new TextEncoder().encode("RIFF0000WAVE"), "webp")).toBe(false);
  });
});

import { expect, it } from "vitest";
import { resourceLinkUrlSchema } from "./resourceLink";

it('rejects link addresses larger than the repository payload limit', () => {
  expect(resourceLinkUrlSchema.safeParse('https://example.edu/' + 'x'.repeat(4096)).success).toBe(false);
});

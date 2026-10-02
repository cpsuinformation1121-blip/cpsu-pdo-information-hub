import { expect, it } from "vitest";
import { getR2ErrorStatus, isR2NotFound, isR2PreconditionFailed } from "./r2Errors";
it.each([null, {}, { $metadata: null }, { $metadata: "invalid" }, { $metadata: { httpStatusCode: "404" } }])("handles malformed provider error metadata safely: %j", error => {
  expect(getR2ErrorStatus(error)).toBeUndefined();
  expect(isR2NotFound(error)).toBe(false);
  expect(isR2PreconditionFailed(error)).toBe(false);
});

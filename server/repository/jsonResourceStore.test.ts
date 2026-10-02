import { describe, expect, it } from "vitest";
import { createR2JsonResourceStore } from "./jsonResourceStore";
const store = createR2JsonResourceStore({ key: "_system/test.json", defaults: { value: "" }, schema: { parse: (value: unknown) => value as { value: string } }, invalidBodyMessage: "Invalid" });
describe("conditional report writes", () => {
  it("requires the exact revision when updating a report", () => {
    const command = store.createWriteCommand("bucket", { value: "report" }, '"revision-one"');
    expect(command.input.IfMatch).toBe('"revision-one"');
    expect(command.input.IfNoneMatch).toBeUndefined();
  });
  it("prevents a second administrator from replacing a concurrently created report", () => {
    const command = store.createWriteCommand("bucket", { value: "report" }, "missing");
    expect(command.input.IfNoneMatch).toBe("*");
    expect(command.input.IfMatch).toBeUndefined();
  });
});

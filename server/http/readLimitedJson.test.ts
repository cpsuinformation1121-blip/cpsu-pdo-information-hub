import { describe, expect, it } from "vitest";
import { InvalidJsonBodyError, readLimitedJson, RequestBodyTooLargeError } from "./readLimitedJson.ts";

describe("readLimitedJson", () => {
  it("parses a bounded JSON request", async () => {
    await expect(readLimitedJson(new Request("https://example.edu", {
      method: "POST",
      body: JSON.stringify({ value: "ok" }),
    }), 100)).resolves.toEqual({ value: "ok" });
  });

  it("rejects an oversized body even if the declared length is false", async () => {
    await expect(readLimitedJson(new Request("https://example.edu", {
      method: "POST",
      headers: { "content-length": "0" },
      body: JSON.stringify({ value: "too long" }),
    }), 10)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("rejects malformed JSON", async () => {
    await expect(readLimitedJson(new Request("https://example.edu", {
      method: "POST",
      body: "{",
    }), 100)).rejects.toBeInstanceOf(InvalidJsonBodyError);
  });
});

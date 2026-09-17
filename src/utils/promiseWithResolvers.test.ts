import { afterEach, describe, expect, it } from "vitest";
import { installPromiseWithResolversPolyfill } from "./promiseWithResolvers";

const originalDescriptor = Object.getOwnPropertyDescriptor(
  Promise,
  "withResolvers",
);

type PromiseConstructorWithResolvers = PromiseConstructor & {
  withResolvers: <T>() => {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
};

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(Promise, "withResolvers", originalDescriptor);
  } else {
    Reflect.deleteProperty(Promise, "withResolvers");
  }
});

describe("installPromiseWithResolversPolyfill", () => {
  it("installs a working compatibility implementation when the browser lacks it", async () => {
    Reflect.deleteProperty(Promise, "withResolvers");

    installPromiseWithResolversPolyfill();

    const { promise, resolve } = (
      Promise as PromiseConstructorWithResolvers
    ).withResolvers<number>();
    resolve(42);
    await expect(promise).resolves.toBe(42);
  });
});
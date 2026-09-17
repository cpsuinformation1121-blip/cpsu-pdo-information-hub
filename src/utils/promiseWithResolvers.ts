type PromiseResolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

type CompatiblePromiseConstructor = PromiseConstructor & {
  withResolvers?: <T>() => PromiseResolvers<T>;
};

export function installPromiseWithResolversPolyfill() {
  const promiseConstructor = Promise as CompatiblePromiseConstructor;
  if (typeof promiseConstructor.withResolvers === "function") return;

  Object.defineProperty(promiseConstructor, "withResolvers", {
    configurable: true,
    writable: true,
    value: <T>(): PromiseResolvers<T> => {
      let resolve!: PromiseResolvers<T>["resolve"];
      let reject!: PromiseResolvers<T>["reject"];
      const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
      });
      return { promise, resolve, reject };
    },
  });
}
/**
 * Drop-in for the ES2024 `Promise.withResolvers` builtin, which is missing on
 * iOS Safari < 17.4 (and Chrome < 119 / Firefox < 121). Implemented via the
 * `Promise` executor so it works on every browser the app supports; the
 * native `resolve`/`reject` handed out by the executor are idempotent, so
 * settling twice is a safe no-op, exactly like the builtin.
 */
export function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let resolve!: PromiseWithResolvers<T>["resolve"];
  let reject!: PromiseWithResolvers<T>["reject"];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

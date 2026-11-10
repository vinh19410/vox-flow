/**
 * Simulates a browser without the ES2024 `Promise.withResolvers` builtin
 * (iOS Safari < 17.4) so tests can prove our compat helper still works.
 * Returns a restore function — call it in a `finally` block.
 */
export function withoutPromiseWithResolvers(): () => void {
  const PromiseCtor = Promise as unknown as { withResolvers?: unknown };
  const original = Promise.withResolvers;
  delete PromiseCtor.withResolvers;
  return () => {
    PromiseCtor.withResolvers = original;
  };
}

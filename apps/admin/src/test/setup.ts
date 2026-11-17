import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
});

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "cloudflare:workers": path.resolve(import.meta.dirname, "./src/test/cloudflare-workers-mock.ts"),
    },
  },
});

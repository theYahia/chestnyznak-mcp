import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 15_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      // Reported in CI for visibility; not a hard gate (the HTTP bootstrap in
      // index.ts is covered by manual integration checks, not unit tests).
    },
  },
});

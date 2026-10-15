import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/main.ts",
        "src/**/*.module.ts",
      ],
      // Medição activa; subir limiar à medida que a suite cresce (meta VH: 70%).
      thresholds: {
        lines: 8,
        functions: 8,
        statements: 8,
      },
    },
  },
});

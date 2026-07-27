import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    /*
      Firebase's web config is public by design, but the SDK still refuses to
      initialise without one. These are throwaway values so `src/config/env.ts`
      validates cleanly and tests never touch a real project.
    */
    env: {
      VITE_FIREBASE_API_KEY: "test-api-key",
      VITE_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "test-project",
      VITE_FIREBASE_STORAGE_BUCKET: "test.appspot.com",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
      VITE_FIREBASE_APP_ID: "1:000000000000:web:test",
    },

    /*
      Call history is cleared between tests so counts never leak.

      `restoreMocks` is deliberately off: it strips the implementation from
      every `vi.fn()`, including the ones inside the shared Firebase module
      mock, which would leave later tests calling a hollow SDK.
    */
    clearMocks: true,
    restoreMocks: false,
    mockReset: false,
    unstubEnvs: true,
    unstubGlobals: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",

      /*
        Only the code that encodes decisions is measured.

        Presentational pages, the vendored shadcn primitives and pure type
        modules are excluded deliberately: including them would inflate the
        percentage while telling nobody whether the booking rules work.
      */
      include: [
        "src/domain/**/*.ts",
        "src/services/**/*.ts",
        "src/contexts/**/*.tsx",
        "src/components/**/*.tsx",
      ],
      exclude: [
        "src/components/ui/**",
        "src/**/*.d.ts",
        "src/domain/ticket/types.ts",
        "src/**/*.test.{ts,tsx}",
      ],

      /*
        Thresholds are a ratchet, not a target. They sit just below what the
        suite currently achieves so a regression fails CI, and are raised
        deliberately rather than chased.
      */
      thresholds: {
        lines: 75,
        functions: 73,
        branches: 80,
        statements: 75,
      },
    },
  },

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

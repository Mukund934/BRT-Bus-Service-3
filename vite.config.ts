import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: true,
    port: 8080,
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  build: {
    /*
      Keep the deferred SDKs out of the initial critical path.

      Vite emits <link rel="modulepreload"> for chunks it discovers from the
      entry, and a modulepreload is a real download. Without this filter the
      browser fetched firebase-firestore (~395 kB) and firebase-database
      (~192 kB) on every page load, which would have quietly undone the
      on-demand loading in `src/firebase.ts` while the module graph still
      looked correct.

      Both are still fetched the moment something awaits them; they are just
      no longer paid for up front.
    */
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter(
          (dep) =>
            !dep.includes("firebase-firestore") && !dep.includes("firebase-database")
        ),
    },

    /*
      Vendor chunking.

      The point is cache longevity, not raw size: application code changes on
      every deploy while React and Firebase change a few times a year.
      Splitting them means a normal release only invalidates the small app
      chunk, and returning visitors re-download almost nothing.

      Firebase is split by product because the app loads them at different
      times - auth is needed immediately, Firestore only once a session is
      being resolved, and the Realtime Database only on the tracking pages.
    */
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;

          const path = id.replace(/\\/g, "/");

          /*
            Both spellings must be matched.

            `firebase/firestore` is a thin wrapper module that statically
            re-exports the real SDK in `@firebase/firestore`. Matching only
            the scoped package left that wrapper unassigned, so it landed in
            the eager shared chunk and pulled the 395 kB SDK back into the
            initial load as a static dependency - the dynamic import in
            `src/firebase.ts` looked correct while the bytes shipped anyway.
          */
          if (/(?:@firebase|firebase)\/firestore/.test(path)) return "firebase-firestore";
          if (/(?:@firebase|firebase)\/database/.test(path)) return "firebase-database";
          if (/(?:@firebase|firebase)\/auth/.test(path)) return "firebase-auth";
          if (path.includes("@firebase/") || path.includes("/firebase/")) {
            return "firebase-core";
          }

          if (path.includes("/react-dom/") || path.includes("/react/") || path.includes("/scheduler/")) {
            return "react";
          }

          if (path.includes("react-router") || path.includes("@remix-run")) return "router";

          /*
            Everything else is left to Rollup.

            A catch-all `return "vendor"` here is tempting and wrong: it
            forces every dependency into one chunk that the entry always
            loads, including packages only ever reached from a lazy route.
            qrcode.react is the clearest example - it is used solely by the
            ticket and payment screens, and the catch-all was dragging it
            into the first page load. Rollup's own grouping keeps such
            packages with the routes that actually import them.
          */
          return undefined;
        },
      },
    },

    // The remaining warning should mean something, so the threshold is set
    // just above the largest chunk we intend to ship.
    chunkSizeWarningLimit: 600,
  },
});

import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "node:fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    maxWorkers: 4,
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    include: ["**/*.test.js"],
    // Don't scan into git worktrees nested under .claude/ — they carry their
    // own copies of the test files but lack an installed node_modules (open-sse,
    // etc.), which makes provider imports fail during collection.
    // The optional Cloudflare source was removed upstream; run its tests only
    // in checkouts that actually include that component.
    exclude: ["**/node_modules/**", "**/.claude/**", "**/dist/**",
      ...(!existsSync(resolve(__dirname, "../cloud/src/handlers/embeddings.js"))
        ? ["**/embeddings.cloud.test.js"] : [])],
    // Allow many it.concurrent cases (real provider smoke runs ~50 providers in parallel)
    maxConcurrency: 60,
    // Suppress noisy console output from handlers under test
    silent: false,
  },
  resolve: {
    // Use array form so subpath aliases (e.g. "@/lib/db/index.js") resolve correctly.
    alias: [
      { find: /^open-sse\//, replacement: resolve(__dirname, "../open-sse") + "/" },
      { find: "open-sse", replacement: resolve(__dirname, "../open-sse") },
      { find: /^@\//, replacement: resolve(__dirname, "../src") + "/" },
    ],
  },
});

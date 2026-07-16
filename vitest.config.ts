import {defineConfig} from "vitest/config";
import {fileURLToPath} from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    // Vercel sets NODE_ENV=production for builds, and `build:vercel` runs the
    // tests inside one. React's entry branches on NODE_ENV and serves its
    // production bundle, which omits `act` — a development-only API that
    // @testing-library/react needs, so every renderHook test dies on
    // "React.act is not a function". Tests are not a production environment.
    // (cast: @types/node marks NODE_ENV readonly, which is right for app code
    // and wrong for the one place whose job is to set it.)
    env: {NODE_ENV: "test"} as Record<string, string>,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});

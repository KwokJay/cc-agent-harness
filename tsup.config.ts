import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    target: "node22",
  },
  {
    entry: ["bin/harness.ts"],
    format: ["esm"],
    sourcemap: true,
    minify: false,
    target: "node22",
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);

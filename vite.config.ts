import { defineConfig } from "vite";
export default defineConfig({
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    minify: "terser",
    terserOptions: {
      ecma: 2022,
      module: true,
      compress: {
        ecma: 2022,
        module: true,
        passes: 3,
        toplevel: true,
        defaults: true,
        inline: 1,
        drop_console: true,
        drop_debugger: true,
        pure_getters: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        hoist_funs: true,
      },
      mangle: {
        toplevel: true,
        module: true,
        properties: { keep_quoted: "strict" },
      },
      format: { comments: false, ecma: 2022 },
    },
  },
  test: { globals: true },
} as never);

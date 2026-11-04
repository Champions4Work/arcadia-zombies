import js from "@eslint/js";
import tseslint from "typescript-eslint";
const noComments = {
  meta: { type: "suggestion", messages: { c: "Comments are banned. Encode intent in names, types, and tests." } },
  create(ctx) { return { Program() { for (const c of ctx.sourceCode.getAllComments()) ctx.report({ loc: c.loc, messageId: "c" }); } }; },
};
const noHotAlloc = {
  meta: { type: "problem", messages: { a: "No allocation in *.hot.ts: reuse preallocated buffers." } },
  create(ctx) {
    const r = (node) => ctx.report({ node, messageId: "a" });
    return { NewExpression: r, ArrayExpression: r, ObjectExpression: r, ArrowFunctionExpression: r, FunctionExpression: r };
  },
};
export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { plugins: { local: { rules: { "no-comments": noComments, "no-hot-alloc": noHotAlloc } } }, rules: { "local/no-comments": "error" } },
  { files: ["**/*.hot.ts"], rules: { "local/no-hot-alloc": "error" } },
  {
    files: ["src/render/horde-draw.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "./ground-atlas",
          importNames: ["copyGroundWindow"],
          message: "Horde sprites overlay the cached yard. Do not snap ground into the blit.",
        }],
      }],
    },
  },
  {
    files: ["src/render/horde-draw.ts", "src/render/blit.hot.ts", "src/render/ground-atlas.ts", "src/render/actors.ts"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "MemberExpression[property.name='getImageData']",
        message: "No GPU readback on the horde or ground path.",
      }, {
        selector: "MemberExpression[property.name='shadowBlur']",
        message: "shadowBlur is banned on the live render path.",
      }, {
        selector: "AssignmentExpression[left.property.name='filter']",
        message: "Canvas filters are banned on the live render path.",
      }],
    },
  },
  { files: ["scripts/**", "*.config.*"], languageOptions: { globals: { process: "readonly", console: "readonly" } } },
  { files: ["scripts/ui-shots.mjs"], languageOptions: { globals: { localStorage: "readonly" } } },
);

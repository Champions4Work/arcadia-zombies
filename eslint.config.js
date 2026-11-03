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
  { files: ["scripts/**", "*.config.*"], languageOptions: { globals: { process: "readonly", console: "readonly" } } },
);

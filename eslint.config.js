import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  { ignores: ["build/", "node_modules/", "src/__tests__/", "vitest.config.ts"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Warn on console.log (corrupts STDIO JSON-RPC), allow console.error/warn
      "no-console": ["warn", { allow: ["error", "warn"] }],
      // Catch missing await on promises
      "@typescript-eslint/no-floating-promises": "error",
      // Catch unused vars, allow _prefixed intentional ignores
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  }
);

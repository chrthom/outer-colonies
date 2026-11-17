import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  {
    ignores: ["projects/**/*"]
  },
  ...compat
    .extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:@angular-eslint/recommended",
      "plugin:@angular-eslint/template/process-inline-templates"
    )
    .map(config => ({
      ...config,
      files: ["**/*.ts"]
    })),
  {
    files: ["**/*.ts"],

    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase"
        }
      ],

      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case"
        }
      ],

      "linebreak-style": ["error", "unix"],
      quotes: ["error", "single"],
      semi: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/server/src/**"],
              message:
                "Use the @shared/* path alias instead of a relative import that crosses a subproject root (see README.md, Shared Code Boundary)"
            }
          ]
        }
      ]
    }
  },
  {
    // Test files may use partial fixtures and mocks (see #909)
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  ...compat
    .extends("plugin:@angular-eslint/template/recommended", "plugin:@angular-eslint/template/accessibility")
    .map(config => ({
      ...config,
      files: ["**/*.html"]
    })),
  {
    files: ["**/*.html"],
    rules: {}
  }
];

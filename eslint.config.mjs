import typescriptEslint from "@typescript-eslint/eslint-plugin";
import _import from "eslint-plugin-import";
import { fixupPluginRules } from "@eslint/compat";
import tsParser from "@typescript-eslint/parser";
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
    ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
            import: fixupPluginRules(_import),
        },

        languageOptions: {
            parser: tsParser,
        },

        settings: {
            "import/resolver": {
                alias: {
                    map: [
                        ["#tables", "./src/tables"],
                        ["#buttons", "./src/buttons"],
                        ["#src", "./src"]
                    ],
                    extensions: [".ts", ".js", ".jsx", ".tsx"],
                },

                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx"],
                    moduleDirectory: ["node_modules", "src/"],
                },
            },
        },

        rules: {
            "import/extensions": ["error", "ignorePackages", {
                js: "always",
                ts: "always",
                mjs: "never",
                jsx: "never",
                tsx: "never",
            }],

            "import/no-unresolved": ["error", {
                ignore: ["^#app$", "^#config$", "^#env$", "^#client$", "^#logger$", "^#database$"],
            }],

            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            "no-prototype-builtins": "off",
            "no-control-regex": "off",
            "no-misleading-character-class": "off",
            "no-empty": "off",
        },
    },
];
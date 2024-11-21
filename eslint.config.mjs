import { fixupPluginRules } from "@eslint/compat"
import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import _import from "eslint-plugin-import"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ),
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
            ["#core", "./src/core"],
            ["#tables", "./src/tables"],
            ["#buttons", "./src/buttons"],
            ["#namespaces", "./src/namespaces"],
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
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          js: "always",
          ts: "never",
          mjs: "never",
          jsx: "never",
          tsx: "never",
        },
      ],

      "import/no-unresolved": [
        "error",
        {
          ignore: ["^#config$", "^#types$", "^@ghom/orm$", "^#all$"],
        },
      ],

      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "no-prototype-builtins": "off",
      "no-control-regex": "off",
      "no-misleading-character-class": "off",
      "no-empty": "off",

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "util",
            "v8",
            "fs",
            "path",
            "url",
            "os",
            "http",
            "https",
            "stream",
            "crypto",
            "zlib",
            "events",
            "assert",
            "buffer",
            "child_process",
            "cluster",
            "dgram",
            "dns",
            "domain",
            "net",
            "readline",
            "repl",
            "tls",
            "tty",
            "vm",
            "worker_threads",
            "!discord-api-types/v8",
            "!#core/util",
          ],
        },
      ],
    },
  },
]

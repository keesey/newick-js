import eslint from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
    { ignores: ["dist/**", "node_modules/**"] },
    {
        files: ["**/*.ts"],
        extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.node,
            parserOptions: {
                project: "./tsconfig.eslint.json",
                sourceType: "module",
            },
        },
    },
    eslintConfigPrettier,
)

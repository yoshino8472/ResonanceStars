import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    plugins: { js }, 
    extends: ["js/recommended"],
    rules: {
      // 行の長さ制限
      "max-len": ["error", { 
        "code": 120,
        "tabWidth": 2,
        "ignoreUrls": true,
        "ignoreStrings": true,
        "ignoreTemplateLiterals": true,
        "ignoreComments": true
      }],
      
      // インデントとスペース
      "indent": ["error", 2, { "SwitchCase": 1 }],
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1 }],
      "eol-last": ["error", "always"],
      
      // セミコロンとカンマ
      "semi": ["error", "always"],
      "comma-dangle": ["error", "never"],
      "comma-spacing": ["error", { "before": false, "after": true }],
      
      // 引用符とブラケット
      "quotes": ["error", "double", { "avoidEscape": true }],
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      
      // 変数と関数
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      "camelcase": ["error", { "properties": "always" }],
      
      // ベストプラクティス
      "eqeqeq": ["error", "always"],
      "no-console": ['error', { allow: ['error'] }],
      "no-debugger": "error",
      "no-alert": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      
      // ES6+
      "arrow-spacing": ["error", { "before": true, "after": true }],
      "template-curly-spacing": ["error", "never"],
      "prefer-template": "error",
      
      // 関数とブロック
      "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
      "keyword-spacing": ["error", { "before": true, "after": true }],
      "space-before-function-paren": ["error", "never"],
      "space-infix-ops": "error"
    }
  },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
]);

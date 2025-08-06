const OFF = 0;
const WARN = 1;
const ERROR = 2;

const coreRules = {
  endOfLine: OFF,
  "array-callback-return": WARN,
  "getter-return": WARN,
  "new-parens": WARN,
  "no-array-constructor": WARN,
  "no-caller": ERROR,
  "no-cond-assign": [WARN, "except-parens"],
  "no-const-assign": ERROR,
  "no-control-regex": WARN,
  "no-dupe-args": WARN,
  "no-dupe-class-members": WARN,
  "no-dupe-keys": WARN,
  "no-duplicate-case": WARN,
  "no-empty-character-class": WARN,
  "no-empty-pattern": WARN,
  "no-duplicate-imports": WARN,
  "no-empty": [WARN, { allowEmptyCatch: true }],
  "no-eval": ERROR,
  "no-ex-assign": WARN,
  "no-extend-native": WARN,
  "no-extra-bind": WARN,
  "no-extra-label": WARN,
  "no-extra-boolean-cast": WARN,
  "no-func-assign": ERROR,
  "no-global-assign": ERROR,
  "no-implied-eval": WARN,
  "no-invalid-regexp": WARN,
  "no-label-var": WARN,
  "no-labels": [WARN, { allowLoop: true, allowSwitch: false }],
  "no-lone-blocks": WARN,
  "no-loop-func": WARN,
  "no-mixed-operators": [
    WARN,
    {
      groups: [
        ["&", "|", "^", "~", "<<", ">>", ">>>"],
        ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
        ["&&", "||"],
        ["in", "instanceof"],
      ],
      allowSamePrecedence: false,
    },
  ],
  "no-unsafe-negation": WARN,
  "no-new-func": WARN,
  "no-new-object": WARN,
  "no-octal": WARN,
  "no-redeclare": ERROR,
  "no-script-url": WARN,
  "no-self-assign": WARN,
  "no-self-compare": WARN,
  "no-sequences": WARN,
  "no-shadow-restricted-names": WARN,
  "no-sparse-arrays": WARN,
  "no-template-curly-in-string": WARN,
  "no-this-before-super": WARN,
  "no-undef": OFF,
  "no-unreachable": WARN,
  "no-unused-expressions": [
    WARN,
    {
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true,
    },
  ],
  "no-unused-labels": WARN,
  "no-unused-vars": [
    WARN,
    {
      args: "none",
      ignoreRestSiblings: true,
    },
  ],
  "no-use-before-define": [
    WARN,
    { classes: false, functions: false, variables: false },
  ],
  "no-useless-computed-key": WARN,
  "no-useless-concat": WARN,
  "no-useless-constructor": WARN,
  "no-useless-escape": WARN,
  "no-useless-rename": [
    WARN,
    {
      ignoreDestructuring: false,
      ignoreImport: false,
      ignoreExport: false,
    },
  ],
  "require-yield": WARN,
  "use-isnan": WARN,
  "valid-typeof": WARN,
};

const pluginRules = {
  // Import
  "import/first": ERROR,
  "import/no-amd": ERROR,
  "import/no-webpack-loader-syntax": ERROR,
  "import/no-duplicates": [ERROR, { considerQueryString: true }],
};

const typescriptRules = {
  "no-dupe-class-members": OFF,
  "no-undef": OFF,

  // Add TypeScript specific rules (and turn off ESLint equivalents)
  "@typescript-eslint/consistent-type-assertions": WARN,
  "@typescript-eslint/consistent-type-imports": WARN,
  "@typescript-eslint/no-explicit-any": WARN,

  "no-array-constructor": OFF,
  "@typescript-eslint/no-array-constructor": WARN,

  "no-redeclare": OFF,
  "@typescript-eslint/no-redeclare": ERROR,
  "no-use-before-define": OFF,
  "@typescript-eslint/no-use-before-define": [
    WARN,
    {
      functions: false,
      classes: false,
      variables: false,
      typedefs: false,
    },
  ],
  "no-unused-expressions": OFF,
  "@typescript-eslint/no-unused-expressions": [
    WARN,
    {
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true,
    },
  ],
  "no-unused-vars": OFF,
  "@typescript-eslint/no-unused-vars": [
    WARN,
    {
      args: "none",
      ignoreRestSiblings: true,
    },
  ],
  "no-useless-constructor": OFF,
  "@typescript-eslint/no-useless-constructor": WARN,
};

module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },

  ignorePatterns: ["dist", "node_modules", "shopify"],
  plugins: ["import"],
  rules: {
    ...pluginRules,
    ...coreRules,
    endOfLine: OFF,
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "plugin:import/typescript",
        "plugin:@typescript-eslint/recommended",
      ],
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: true,
      },
      rules: {
        ...typescriptRules,
      },
    },
  ],
};

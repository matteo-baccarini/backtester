module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    // disable type-aware rules that require `parserOptions.project` to avoid
    // "file not found in provided project" errors in this template
    project: false
  },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['vite.config.ts', 'node_modules/']
};

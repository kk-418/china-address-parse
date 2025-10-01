/**
 * ESLint 配置
 * @author kk
 */

module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        // 代码风格
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],

        // 最佳实践
        'no-console': 'warn',
        'no-unused-vars': ['error', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],
        'no-debugger': 'error',
        'eqeqeq': ['error', 'always'],

        // ES6+
        'prefer-const': 'error',
        'no-var': 'error',
        'arrow-spacing': 'error',
        'template-curly-spacing': 'error'
    }
};

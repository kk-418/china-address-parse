/**
 * Jest配置文件
 * @author kk
 */

module.exports = {
    // 测试环境
    testEnvironment: 'node',

    // 文件转换配置
    transform: {
        '^.+\\.js$': 'babel-jest',
    },

    // 模块文件扩展名
    moduleFileExtensions: ['js', 'json'],

    // 测试文件匹配模式
    testMatch: ['**/test/**/*.test.js'],

    // 忽略转换的文件
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$))'
    ],


    // 收集覆盖率的文件
    collectCoverageFrom: [
        'app/lib/**/*.js',
        '!app/lib/getMcaGovData.js'
    ],

    // 覆盖率输出目录
    coverageDirectory: 'coverage',

    // 覆盖率报告格式
    coverageReporters: ['text', 'lcov', 'html'],

    // 设置超时时间
    testTimeout: 30000
};
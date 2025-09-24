/**
 * 使用真实测试数据验证重构后的代码（使用构建后的文件）
 */

const zhAddressParse = require('../dist/zh-address-parse.min.js');
const testData = require('../app/test/testData.json');

console.log('=== 使用真实测试数据验证重构后的代码 ===\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

// 测试每一个测试用例
testData.forEach((testCase, index) => {
    const { s: input, options = {}, parsedResult: expected } = testCase;

    console.log(`测试用例 ${index + 1}/${testData.length}: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);

    try {
        // 使用重构后的代码解析
        const actual = zhAddressParse(input, options);

        totalTests++;

        // 比较关键字段
        const keyFields = ['name', 'telNumber', 'provinceName', 'cityName', 'countyName', 'detailInfo', 'postalCode'];
        let isMatch = true;
        let mismatchFields = [];

        keyFields.forEach(field => {
            if (expected[field] !== actual[field]) {
                isMatch = false;
                mismatchFields.push({
                    field,
                    expected: expected[field],
                    actual: actual[field]
                });
            }
        });

        if (isMatch) {
            passedTests++;
            console.log('✅ 通过');
        } else {
            failedTests.push({
                index: index + 1,
                input,
                options,
                mismatchFields
            });
            console.log('❌ 失败');
            console.log('不匹配字段:', mismatchFields.map(f =>
                `${f.field}: 期望"${f.expected}", 实际"${f.actual}"`
            ).join(', '));
        }
    } catch (error) {
        totalTests++;
        console.log('❌ 出错:', error.message);
        failedTests.push({
            index: index + 1,
            input,
            options,
            error: error.message
        });
    }

    console.log('---\n');
});

console.log('=== 测试结果汇总 ===');
console.log(`总测试用例: ${totalTests}`);
console.log(`通过: ${passedTests}`);
console.log(`失败: ${failedTests.length}`);
console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

if (failedTests.length > 0) {
    console.log('\n=== 失败用例详情 ===');
    failedTests.slice(0, 5).forEach(failed => {
        console.log(`用例 ${failed.index}: ${failed.input}`);
        if (failed.error) {
            console.log(`错误: ${failed.error}`);
        } else if (failed.mismatchFields) {
            console.log('不匹配字段:');
            failed.mismatchFields.forEach(f => {
                console.log(`  ${f.field}: "${f.expected}" != "${f.actual}"`);
            });
        }
        console.log('---');
    });

    if (failedTests.length > 5) {
        console.log(`... 还有 ${failedTests.length - 5} 个失败用例`);
    }
}
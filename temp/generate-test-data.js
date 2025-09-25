/**
 * 重新生成单元测试数据
 * 使用新的字段格式：province, city, area, detail
 */

const ZhAddressParse = require('../dist/zh-address-parse.min.js');
const fs = require('fs');
const path = require('path');

// 读取现有测试数据
const testDataPath = path.join(__dirname, '../app/test/testData.json');
const existingTestData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

console.log('开始重新生成测试数据...');
console.log('原有测试用例数量:', existingTestData.length);

const newTestData = [];

existingTestData.forEach((testCase, index) => {
    console.log(`处理第 ${index + 1}/${existingTestData.length} 个测试用例: ${testCase.s.substring(0, 50)}...`);

    try {
        // 使用默认数据源（TreeParser）解析
        const result = ZhAddressParse(testCase.s, {
            type: 1, // 使用TreeParser
            ...testCase.options
        });

        // 创建新的测试用例
        const newTestCase = {
            s: testCase.s,
            parsedResult: {
                name: result.name,
                telNumber: result.telNumber,
                provinceName: result.provinceName,
                cityName: result.cityName,
                subCityDivisionName: result.subCityDivisionName,
                address: result.address,
                postalCode: result.postalCode
            },
            options: testCase.options || {}
        };

        newTestData.push(newTestCase);

    } catch (error) {
        console.error(`处理测试用例失败: ${testCase.s}`);
        console.error('错误:', error.message);
    }
});

// 写入新的测试数据
const outputPath = path.join(__dirname, '../app/test/testData.json');
fs.writeFileSync(outputPath, JSON.stringify(newTestData, null, 2), 'utf8');

console.log(`\n测试数据重新生成完成！`);
console.log(`原有用例数量: ${existingTestData.length}`);
console.log(`新生成用例数量: ${newTestData.length}`);
console.log(`输出文件: ${outputPath}`);

// 显示前3个示例
console.log('\n前3个测试用例示例:');
newTestData.slice(0, 3).forEach((testCase, index) => {
    console.log(`\n示例 ${index + 1}:`);
    console.log('输入:', testCase.s);
    console.log('输出:', JSON.stringify(testCase.parsedResult, null, 2));
});
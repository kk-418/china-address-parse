/**
 * 新功能测试脚本
 * 测试cn-division数据源功能
 */

const ZhAddressParse = require('./dist/zh-address-parse.min.js');

console.log('=== 新功能测试 ===\n');

// 测试地址
const testAddress = "北京市朝阳区朝外大街19号华普大厦1201室 张三 13800138000";

console.log('测试地址:', testAddress);
console.log('\n' + '='.repeat(60) + '\n');

// 1. 默认数据源测试
console.log('1. 默认数据源测试:');
try {
    const result1 = ZhAddressParse(testAddress);
    console.log('结果:', JSON.stringify(result1, null, 2));
} catch (error) {
    console.error('错误:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 2. 使用cn-division带编码数据源
console.log('2. cn-division带编码数据源测试:');
try {
    const result2 = ZhAddressParse(testAddress, {
        dataSource: 'cn-code',
        includeCode: true
    });
    console.log('结果:', JSON.stringify(result2, null, 2));
} catch (error) {
    console.error('错误:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 3. 使用cn-division不带编码数据源
console.log('3. cn-division不带编码数据源测试:');
try {
    const result3 = ZhAddressParse(testAddress, {
        dataSource: 'cn-nocode',
        includeCode: false
    });
    console.log('结果:', JSON.stringify(result3, null, 2));
} catch (error) {
    console.error('错误:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 4. 检查DATA_SOURCE常量
console.log('4. 检查导出的常量:');
if (ZhAddressParse.DATA_SOURCE) {
    console.log('DATA_SOURCE:', ZhAddressParse.DATA_SOURCE);
} else {
    console.log('DATA_SOURCE 未正确导出');
}

console.log('\n=== 测试完成 ===');
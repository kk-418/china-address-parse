/**
 * 测试重构后的代码是否正常工作
 */

// 测试原版本
const zhAddressParse = require('../dist/zh-address-parse.min.js');

console.log('=== 测试重构后的代码 ===');

const testAddress = '张三 13800138000 北京市朝阳区某某街道123号';
console.log('测试地址:', testAddress);

try {
    const result = zhAddressParse(testAddress);
    console.log('解析结果:', result);
    console.log('解析成功:', result.provinceName === '北京市' ? '✅' : '❌');
} catch (error) {
    console.error('解析失败:', error.message);
    console.error('错误详情:', error.stack);
}
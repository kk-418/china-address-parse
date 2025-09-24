/**
 * 测试原始代码的行为
 */

const zhAddressParse = require('../dist/zh-address-parse.min.js');

// 测试400电话
console.log('=== 测试原始代码的400电话处理 ===');

const testInput = "王五 广东省深圳市南山区科技园 400-8888888";

console.log('输入:', testInput);

// 测试正则模式
const regexpResult = zhAddressParse(testInput, { type: 0, mode: 1 });
console.log('原始代码正则模式结果:');
console.log('telNumber:', regexpResult.telNumber);
console.log('完整结果:', JSON.stringify(regexpResult, null, 2));

// 测试树查找模式
const treeResult = zhAddressParse(testInput, { type: 1, mode: 1 });
console.log('\n原始代码树查找模式结果:');
console.log('telNumber:', treeResult.telNumber);
console.log('完整结果:', JSON.stringify(treeResult, null, 2));
/**
 * 测试不带横杠的400电话
 */

const zhAddressParse = require('../dist/zh-address-parse.min.js');

// 测试400电话（无横杠）
console.log('=== 测试原始代码的400电话处理（无横杠）===');

const testInput = "王五 广东省深圳市南山区科技园 4008888888";

console.log('输入:', testInput);

// 测试正则模式
const regexpResult = zhAddressParse(testInput, { type: 0, mode: 1 });
console.log('原始代码正则模式结果:');
console.log('telNumber:', regexpResult.telNumber);

// 测试树查找模式
const treeResult = zhAddressParse(testInput, { type: 1, mode: 1 });
console.log('原始代码树查找模式结果:');
console.log('telNumber:', treeResult.telNumber);
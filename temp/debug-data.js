/**
 * 调试数据格式
 */

const fs = require('fs');

// 读取cn-division数据
const codeData = JSON.parse(fs.readFileSync('./app/lib/data/cn-division/pca-code.json', 'utf8'));
const noCodeData = JSON.parse(fs.readFileSync('./app/lib/data/cn-division/pca-nocode.json', 'utf8'));

console.log('=== CN-Division 数据格式调试 ===\n');

console.log('1. 带编码数据格式 (前2项):');
console.log(JSON.stringify(codeData.slice(0, 2), null, 2));

console.log('\n' + '='.repeat(50) + '\n');

console.log('2. 不带编码数据格式 (前2项):');
const noCodeKeys = Object.keys(noCodeData).slice(0, 2);
const noCodeSample = {};
noCodeKeys.forEach(key => {
    noCodeSample[key] = noCodeData[key];
});
console.log(JSON.stringify(noCodeSample, null, 2));

console.log('\n' + '='.repeat(50) + '\n');

// 读取原始area.json格式
const originalData = JSON.parse(fs.readFileSync('./app/lib/data/area.json', 'utf8'));
console.log('3. 原始area.json格式 (前1项):');
console.log(JSON.stringify(originalData.slice(0, 1), null, 2));
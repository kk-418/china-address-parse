/**
 * 测试北京市地址解析
 */

import AddressParse from '../app/lib/index.js';

// 测试北京市地址
const testAddress = "北京市东城区北京师范大学";

console.log('测试地址:', testAddress);

try {
    const result = AddressParse(testAddress);
    console.log('解析结果:');
    console.log('provinceName:', result.provinceName);
    console.log('cityName:', result.cityName);
    console.log('subCityDivisionName:', result.subCityDivisionName);
    console.log('address:', result.address);
} catch (error) {
    console.error('解析失败:', error.message);
}
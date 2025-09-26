/**
 * 临时调试脚本，用于检查数据结构和城市匹配问题
 */

import DataManagerCode from '../app/lib/core/DataManagerCode.js';

const dataManager = new DataManagerCode();

console.log('=== 数据加载测试 ===');
const provinces = dataManager.getProvinces();
const cities = dataManager.getCities();
const areas = dataManager.getAreas();

console.log('省份数量:', provinces.length);
console.log('城市数量:', cities.length);
console.log('区县数量:', areas.length);

console.log('\n=== 江苏省数据 ===');
const jiangsu = provinces.find(p => p.name === '江苏省');
console.log('江苏省:', jiangsu);

if (jiangsu) {
    console.log('\n=== 江苏省的城市 ===');
    const jiangsucities = cities.filter(c => c.provinceCode === jiangsu.code);
    console.log('江苏省城市数量:', jiangsucities.length);

    const nanjing = jiangsucities.find(c => c.name.includes('南京'));
    console.log('南京相关城市:', nanjing);

    if (nanjing) {
        console.log('\n=== 南京市的区县 ===');
        const nanjingareas = areas.filter(a => a.cityCode === nanjing.code);
        console.log('南京市区县数量:', nanjingareas.length);
        console.log('南京市区县:', nanjingareas.slice(0, 3));
    }
}

console.log('\n=== 广东省数据 ===');
const guangdong = provinces.find(p => p.name === '广东省');
console.log('广东省:', guangdong);

if (guangdong) {
    console.log('\n=== 广东省的城市 ===');
    const guangdongcities = cities.filter(c => c.provinceCode === guangdong.code);
    console.log('广东省城市数量:', guangdongcities.length);

    const zhongshan = guangdongcities.find(c => c.name.includes('中山'));
    console.log('中山相关城市:', zhongshan);
}

console.log('\n=== 测试地址片段匹配 ===');
// 测试 "南京市鼓楼区建宁路搜索发的"
const fragment = "南京市鼓楼区建宁路搜索发的";
console.log('待匹配片段:', fragment);

// 查找包含"南京"的城市
const nanjingCities = cities.filter(c => c.name.includes('南京'));
console.log('包含"南京"的城市:', nanjingCities);

// 查找包含"鼓楼"的区县
const gulouAreas = areas.filter(a => a.name.includes('鼓楼'));
console.log('包含"鼓楼"的区县:', gulouAreas);
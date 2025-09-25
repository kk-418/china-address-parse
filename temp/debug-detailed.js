/**
 * 详细调试脚本
 * 调试数据转换和解析流程
 */

// 导入我们的内部模块进行调试
import CNDivisionLoader from './app/lib/loaders/CNDivisionLoader.js';
import CNDivisionAdapter from './app/lib/adapters/CNDivisionAdapter.js';

console.log('=== 详细调试 cn-division 数据解析 ===\n');

// 1. 测试 CNDivisionLoader
console.log('1. 测试 CNDivisionLoader:');
try {
    const loader = new CNDivisionLoader();

    // 测试加载带编码数据
    console.log('\n  a) 加载带编码数据...');
    const codeData = loader.getCodeData();
    console.log('    省份数量:', codeData.provinces.length);
    console.log('    城市数量:', codeData.cities.length);
    console.log('    区县数量:', codeData.areas.length);
    console.log('    第一个省份:', JSON.stringify(codeData.provinces[0], null, 4));
    console.log('    第一个城市:', JSON.stringify(codeData.cities[0], null, 4));
    console.log('    第一个区县:', JSON.stringify(codeData.areas[0], null, 4));

    // 测试加载不带编码数据
    console.log('\n  b) 加载不带编码数据...');
    const noCodeData = loader.getNoCodeData();
    console.log('    省份数量:', noCodeData.provinces.length);
    console.log('    城市数量:', noCodeData.cities.length);
    console.log('    区县数量:', noCodeData.areas.length);
    console.log('    第一个省份:', JSON.stringify(noCodeData.provinces[0], null, 4));
    console.log('    第一个城市:', JSON.stringify(noCodeData.cities[0], null, 4));
    console.log('    第一个区县:', JSON.stringify(noCodeData.areas[0], null, 4));

} catch (error) {
    console.error('  CNDivisionLoader 测试失败:', error.message);
    console.error('  错误堆栈:', error.stack);
}

console.log('\n' + '='.repeat(60) + '\n');

// 2. 测试 CNDivisionAdapter
console.log('2. 测试 CNDivisionAdapter:');
try {
    const loader = new CNDivisionLoader();

    // 测试适配带编码数据
    console.log('\n  a) 适配带编码数据...');
    const codeData = loader.getCodeData();
    const adaptedCodeData = CNDivisionAdapter.adapt(codeData, true);
    console.log('    适配后省份数量:', adaptedCodeData.provinces.length);
    console.log('    适配后城市数量:', adaptedCodeData.cities.length);
    console.log('    适配后区县数量:', adaptedCodeData.areas.length);
    console.log('    适配后第一个省份:', JSON.stringify(adaptedCodeData.provinces[0], null, 4));
    console.log('    适配后第一个城市:', JSON.stringify(adaptedCodeData.cities[0], null, 4));
    console.log('    适配后第一个区县:', JSON.stringify(adaptedCodeData.areas[0], null, 4));

    // 查找北京相关数据
    console.log('\n  c) 查找北京相关数据...');
    const beijingProvince = adaptedCodeData.provinces.find(p => p.name === '北京市');
    console.log('    北京省份:', JSON.stringify(beijingProvince, null, 4));

    const beijingCities = adaptedCodeData.cities.filter(c =>
        (c.provinceCode && c.provinceCode === beijingProvince?.code) ||
        (c.provinceName === '北京市')
    );
    console.log('    北京城市:', JSON.stringify(beijingCities, null, 4));

    const chaoyangArea = adaptedCodeData.areas.find(a => a.name === '朝阳区');
    console.log('    朝阳区:', JSON.stringify(chaoyangArea, null, 4));

} catch (error) {
    console.error('  CNDivisionAdapter 测试失败:', error.message);
    console.error('  错误堆栈:', error.stack);
}

console.log('\n=== 调试完成 ===');
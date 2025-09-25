/**
 * cn-division数据源使用示例
 * 演示如何使用带编码和不带编码的两种模式
 * @author kk
 */

import AddressParse from '../app/lib/address-parse.js';

// 测试地址
const testAddress = "北京市朝阳区朝外大街19号华普大厦1201室 张三 13800138000";

console.log('=== cn-division 数据源使用示例 ===\n');

// 1. 使用默认数据源（原有area.json）
console.log('1. 默认数据源（不带编码）:');
try {
    const result1 = AddressParse(testAddress);
    console.log(JSON.stringify(result1, null, 2));
} catch (error) {
    console.error('默认数据源解析失败:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// 2. 使用cn-division带编码数据源
console.log('2. cn-division带编码数据源:');
try {
    const result2 = AddressParse(testAddress, {
        dataSource: AddressParse.DATA_SOURCE.CN_DIVISION_CODE,
        includeCode: true
    });
    console.log(JSON.stringify(result2, null, 2));
} catch (error) {
    console.error('cn-division编码数据源解析失败:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// 3. 使用cn-division不带编码数据源
console.log('3. cn-division不带编码数据源（体积最小）:');
try {
    const result3 = AddressParse(testAddress, {
        dataSource: AddressParse.DATA_SOURCE.CN_DIVISION_NOCODE,
        includeCode: false
    });
    console.log(JSON.stringify(result3, null, 2));
} catch (error) {
    console.error('cn-division非编码数据源解析失败:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// 4. 使用工厂方法创建特定配置的解析器
console.log('4. 使用工厂方法创建带编码解析器:');
try {
    const codeParser = AddressParse.createParser(
        AddressParse.DATA_SOURCE.CN_DIVISION_CODE,
        true
    );
    const result4 = codeParser.parse(testAddress);
    console.log(JSON.stringify(result4, null, 2));
} catch (error) {
    console.error('工厂方法创建解析器失败:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// 5. 批量测试多个地址
console.log('5. 批量测试（带编码vs不带编码）:');
const addresses = [
    "上海市浦东新区陆家嘴金融贸易区 李四 13900139000",
    "广东省深圳市南山区科技园 王五 13700137000",
    "四川省成都市锦江区春熙路 赵六 13600136000"
];

addresses.forEach((addr, index) => {
    console.log(`\n地址 ${index + 1}: ${addr}`);

    try {
        // 不带编码
        const noCodeResult = AddressParse(addr, {
            dataSource: AddressParse.DATA_SOURCE.CN_DIVISION_NOCODE
        });
        console.log('  不带编码:', {
            province: noCodeResult.province,
            city: noCodeResult.city,
            area: noCodeResult.area,
            name: noCodeResult.name
        });

        // 带编码
        const codeResult = AddressParse(addr, {
            dataSource: AddressParse.DATA_SOURCE.CN_DIVISION_CODE,
            includeCode: true
        });
        console.log('  带编码:', {
            province: codeResult.province,
            provinceCode: codeResult.provinceCode,
            city: codeResult.city,
            cityCode: codeResult.cityCode,
            area: codeResult.area,
            areaCode: codeResult.areaCode,
            name: codeResult.name
        });
    } catch (error) {
        console.error(`  解析失败: ${error.message}`);
    }
});

console.log('\n' + '='.repeat(50) + '\n');

// 6. 性能和体积对比说明
console.log('6. 性能和体积对比:');
console.log(`
数据源类型对比:

1. 默认数据源 (default)
   - 使用原有area.json格式
   - 包含完整编码信息
   - 体积: 中等
   - 兼容性: 100%向后兼容

2. cn-division带编码 (cn-code)
   - 使用cn-division/dist/code/pca.json
   - 包含完整编码信息
   - 体积: 较大（包含所有编码）
   - 特点: 数据更新及时，编码标准

3. cn-division不带编码 (cn-nocode)
   - 使用cn-division/dist/no-code/pca.json
   - 不包含编码信息
   - 体积: 最小（仅包含名称）
   - 特点: 适合只需要名称不需要编码的场景

推荐使用场景:
- 需要编码: 使用 cn-code
- 不需要编码，追求最小体积: 使用 cn-nocode
- 现有项目，保持兼容: 使用 default
`);
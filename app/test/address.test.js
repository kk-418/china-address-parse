import testDataList from './testData'
import fs from 'fs'
import path from 'path'

// 检测测试的是哪个版本
const testFile = process.env.TEST_FILE || 'zh-address-parse.min.js';
const isNoCodeVersion = testFile.includes('nocode');

// 动态导入对应的构建文件
const distPath = path.join(__dirname, '../../dist', testFile);

let zhAddressParse;
if (fs.existsSync(distPath)) {
    zhAddressParse = require(distPath);
} else {
    // 如果构建文件不存在，跳过测试
    console.warn(`构建文件 ${distPath} 不存在，跳过测试`);
    process.exit(0);
}

// 使用jest单元测试
const versionName = isNoCodeVersion ? '不带编码版本' : '带编码版本';

describe(`---${versionName}测试---`, () => {
    for (const testData of testDataList) {
        test(testData.s, () => {
            const result = zhAddressParse(testData.s, testData.options);

            // 验证基本字段
            expect(result.name).toEqual(testData.parsedResult.name);
            expect(result.telNumber).toEqual(testData.parsedResult.telNumber);
            expect(result.provinceName).toEqual(testData.parsedResult.provinceName);
            expect(result.cityName).toEqual(testData.parsedResult.cityName);
            expect(result.subCityDivisionName).toEqual(testData.parsedResult.subCityDivisionName);
            expect(result.address).toEqual(testData.parsedResult.address);
            expect(result.postalCode).toEqual(testData.parsedResult.postalCode);

            // 根据版本验证编码字段
            if (isNoCodeVersion) {
                // 不带编码版本不应该有编码字段
                expect(result).not.toHaveProperty('provinceCode');
                expect(result).not.toHaveProperty('cityCode');
                expect(result).not.toHaveProperty('subCityDivisionCode');
            } else {
                // 带编码版本应该有编码字段（可能为undefined，但应该有这些字段）
                expect(result).toHaveProperty('provinceCode');
                expect(result).toHaveProperty('cityCode');
                expect(result).toHaveProperty('subCityDivisionCode');
            }
        })
    }
})
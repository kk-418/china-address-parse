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

// 自定义关键字功能测试
describe(`---${versionName} 自定义关键字测试---`, () => {
    // 高级地址清洗正则表达式示例
    const ADVANCED_ADDRESS_CLEAN_KEYWORDS = [
        '(不|拒|勿).*到付件?',
        '到付.*(不|拒)(收|签)',
        '建议使用官方推荐',
        '(支持.*)?上门取件(服务)?',
        '感?谢.*配合',
        '请?(寄|退)回.*(清单|产品)',
        '请.*拒(收|签)?',
        '仓?库?签收.*处理',
        '(拒|不|勿|建议).*(百世|极兔|信丰|京东|申通|圆通|中通|韵达|平邮|邮政|EMS|顺丰|到付|平邮|联昊通|丹鸟|安能|宅急送|国通)(快递|物流)?',
        '(如?有赠品|人为损坏|已清洗|优先|安排|退款|订单|编号|旺旺名|您|写上)'
    ];

    test('自定义姓名称呼关键字测试', () => {
        const address = '张三boss 13800138000 北京市朝阳区某某街道123号';

        const result = zhAddressParse(address, {
            customNameTitles: ['boss', '经理', '总监']
        });

        expect(result.name).toEqual('张三boss');
        expect(result.telNumber).toEqual('13800138000');
        expect(result.provinceName).toEqual('北京市');
        expect(result.cityName).toEqual('北京市');
        expect(result.subCityDivisionName).toEqual('朝阳区');
    });

    test('高级地址清洗正则表达式测试 - 到付相关', () => {
        const address = '李四先生 13900139000 上海市浦东新区 勿到付件 某某路456号';

        const result = zhAddressParse(address, {
            customAddressCleanRegexs: ADVANCED_ADDRESS_CLEAN_KEYWORDS
        });

        expect(result.name).toEqual('李四先生');
        expect(result.telNumber).toEqual('13900139000');
        expect(result.provinceName).toEqual('上海市');
        expect(result.cityName).toEqual('上海市');
        expect(result.subCityDivisionName).toEqual('浦东新区');
        expect(result.address).toEqual('某某路456号');
    });

    test('高级地址清洗正则表达式测试 - 快递公司相关', () => {
        const address = '王五 15800158000 广州市天河区 请勿使用圆通快递 天河路789号';

        const result = zhAddressParse(address, {
            customAddressCleanRegexs: ADVANCED_ADDRESS_CLEAN_KEYWORDS
        });

        expect(result.name).toEqual('王五');
        expect(result.telNumber).toEqual('15800158000');
        expect(result.provinceName).toEqual('广东省');
        expect(result.cityName).toEqual('广州市');
        expect(result.subCityDivisionName).toEqual('天河区');
        expect(result.address).toEqual('天河路789号');
    });

    test('高级地址清洗正则表达式测试 - 感谢配合', () => {
        const address = '赵六女士 18600186000 深圳市南山区 感谢您的配合 科技园路123号';

        const result = zhAddressParse(address, {
            customAddressCleanRegexs: ADVANCED_ADDRESS_CLEAN_KEYWORDS
        });

        expect(result.name).toEqual('赵六女士');
        expect(result.telNumber).toEqual('18600186000');
        expect(result.provinceName).toEqual('广东省');
        expect(result.cityName).toEqual('深圳市');
        expect(result.subCityDivisionName).toEqual('南山区');
        expect(result.address).toEqual('科技园路123号');
    });

})
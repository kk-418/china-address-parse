/**
 * example.js 示例文件的单元测试
 * @author kk
 */

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

// 高级地址清洗正则表达式示例（与example.js保持一致）
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

const versionName = isNoCodeVersion ? '不带编码版本' : '带编码版本';

describe(`---${versionName} example.js示例测试---`, () => {

    test('示例1: 基本使用', () => {
        const basicAddress = '张三 13800138000 北京市朝阳区某某街道123号';
        const result = zhAddressParse(basicAddress);

        expect(result.name).toEqual('张三');
        expect(result.telNumber).toEqual('13800138000');
        expect(result.provinceName).toEqual('北京市');
        expect(result.cityName).toEqual('北京市');
        expect(result.countyName).toEqual('朝阳区');
        expect(result.address).toEqual('某某街道123号');
    });

    test('示例2: 自定义姓名称呼关键字', () => {
        const nameAddress = '李四boss 13900139000 上海市浦东新区某某路456号';
        const result = zhAddressParse(nameAddress, {
            customNameTitles: ['boss', '经理', '总监', '主管']
        });

        expect(result.name).toEqual('李四boss');
        expect(result.telNumber).toEqual('13900139000');
        expect(result.provinceName).toEqual('上海市');
        expect(result.cityName).toEqual('上海市');
        expect(result.countyName).toEqual('浦东新区');
        expect(result.address).toEqual('某某路456号');
    });

    test('示例3: 高级地址清洗功能', () => {
        const dirtyAddress = '王五先生 15800158000 广州市天河区 请勿使用圆通快递 感谢您的配合 天河路789号';
        const result = zhAddressParse(dirtyAddress, {
            customAddressCleanRegexs: ADVANCED_ADDRESS_CLEAN_KEYWORDS
        });

        expect(result.name).toEqual('王五先生');
        expect(result.telNumber).toEqual('15800158000');
        expect(result.provinceName).toEqual('广东省');
        expect(result.cityName).toEqual('广州市');
        expect(result.countyName).toEqual('天河区');
        expect(result.address).toEqual('天河路789号');
    });

    test('示例4: 组合使用自定义功能', () => {
        const complexAddress = '陈总监 18888888888 深圳市南山区 科技园路100号';
        const result = zhAddressParse(complexAddress, {
            customNameTitles: ['总监', '主管', 'boss', '经理'],
            customAddressCleanRegexs: ADVANCED_ADDRESS_CLEAN_KEYWORDS
        });

        expect(result.name).toEqual('陈总监');
        expect(result.telNumber).toEqual('18888888888');
        expect(result.provinceName).toEqual('广东省');
        expect(result.cityName).toEqual('深圳市');
        expect(result.countyName).toEqual('南山区');
        expect(result.address).toEqual('科技园路100号');
    });

    test('示例5: 自定义地址清洗规则', () => {
        const customAddress = '孙小姐 18600186000 深圳市南山区 请勿邮政快递 禁止代收 科技园路123号';
        const result = zhAddressParse(customAddress, {
            customAddressCleanRegexs: [
                '请勿.*快递',
                '禁止.*代收',
                '注意.*事项'
            ]
        });

        expect(result.name).toEqual('孙小姐');
        expect(result.telNumber).toEqual('18600186000');
        expect(result.provinceName).toEqual('广东省');
        expect(result.cityName).toEqual('深圳市');
        expect(result.countyName).toEqual('南山区');
        expect(result.address).toEqual('科技园路123号');
    });

    test('示例6: 包含编码信息', () => {
        const basicAddress = '张三 13800138000 北京市朝阳区某某街道123号';
        const result = zhAddressParse(basicAddress, {
            includeCode: true
        });

        expect(result.name).toEqual('张三');
        expect(result.telNumber).toEqual('13800138000');
        expect(result.provinceName).toEqual('北京市');
        expect(result.cityName).toEqual('北京市');
        expect(result.countyName).toEqual('朝阳区');
        expect(result.address).toEqual('某某街道123号');

        // 检查编码字段
        if (!isNoCodeVersion) {
            expect(result).toHaveProperty('provinceCode');
            expect(result).toHaveProperty('cityCode');
            expect(result).toHaveProperty('countyCode');
            expect(result.provinceCode).toEqual(11);
            expect(result.cityCode).toEqual('1101');
            expect(result.countyCode).toEqual('110105');
        }
    });

    test('ADVANCED_ADDRESS_CLEAN_KEYWORDS 常量可用性测试', () => {
        // 测试高级清洗关键字数组不为空
        expect(ADVANCED_ADDRESS_CLEAN_KEYWORDS).toBeInstanceOf(Array);
        expect(ADVANCED_ADDRESS_CLEAN_KEYWORDS.length).toBeGreaterThan(0);

        // 测试每个元素都是字符串
        ADVANCED_ADDRESS_CLEAN_KEYWORDS.forEach(keyword => {
            expect(typeof keyword).toBe('string');
            expect(keyword.length).toBeGreaterThan(0);
        });
    });

    test('与默认行为对比 - 自定义清洗效果验证', () => {
        const testAddress = '李先生 13800138000 广东省深圳市南山区 请勿使用申通快递 科技园路100号';

        // 不使用自定义清洗
        const defaultResult = zhAddressParse(testAddress);

        // 使用自定义清洗
        const customResult = zhAddressParse(testAddress, {
            customAddressCleanRegexs: ADVANCED_ADDRESS_CLEAN_KEYWORDS
        });

        // 基本信息应该相同
        expect(customResult.name).toEqual(defaultResult.name);
        expect(customResult.telNumber).toEqual(defaultResult.telNumber);
        expect(customResult.provinceName).toEqual(defaultResult.provinceName);
        expect(customResult.cityName).toEqual(defaultResult.cityName);
        expect(customResult.countyName).toEqual(defaultResult.countyName);

        // 自定义清洗后的地址应该更干净（不包含快递相关文字）
        expect(customResult.address).not.toContain('申通快递');
        expect(customResult.address).toEqual('科技园路100号');
    });
});
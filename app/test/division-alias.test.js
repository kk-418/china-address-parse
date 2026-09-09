import fs from 'fs';
import path from 'path';

const testFile = process.env.TEST_FILE || 'zh-address-parse.min.js';
const isNoCodeVersion = testFile.includes('nocode');
const distPath = path.join(__dirname, '../../dist', testFile);

let zhAddressParse;
if (fs.existsSync(distPath)) {
    zhAddressParse = require(distPath);
} else {
    console.warn(`构建文件 ${distPath} 不存在，跳过测试`);
    process.exit(0);
}

const versionName = isNoCodeVersion ? '不带编码版本' : '带编码版本';
const parseOptions = { type: 0, mode: 1, nameMaxLength: 5 };

describe(`---${versionName} 重庆区划别名---`, () => {
    test('重庆市江北区改写为两江新区并给出 notice', () => {
        const result = zhAddressParse('张三 13800138000 重庆市江北区观音桥步行街', parseOptions);

        expect(result.provinceName).toEqual('重庆市');
        expect(result.cityName).toEqual('重庆市');
        expect(result.countyName).toEqual('两江新区');
        expect(result.address).toEqual('观音桥步行街');
        expect(result.address).not.toContain('江北区');
        expect(result.notices).toEqual([
            expect.objectContaining({
                type: 'division-renamed',
                autoApplied: true,
                from: expect.objectContaining({ county: '江北区' }),
                to: expect.objectContaining({ county: '两江新区' })
            })
        ]);
        expect(result.notices[0].message).toContain('两江新区');
    });

    test('重庆市渝北区默认改写为两江新区', () => {
        const result = zhAddressParse('李四 13900139000 重庆市渝北区回兴街道双龙大道', parseOptions);

        expect(result.countyName).toEqual('两江新区');
        expect(result.address).toContain('回兴街道双龙大道');
        expect(result.address).not.toContain('渝北区');
        expect(result.notices[0].from.county).toEqual('渝北区');
    });

    test('重庆市渝北区统景镇改写为北碚区', () => {
        const result = zhAddressParse('王五 13700137000 重庆市渝北区统景镇温泉路1号', parseOptions);

        expect(result.countyName).toEqual('北碚区');
        expect(result.address).toContain('统景镇');
        expect(result.address).not.toContain('渝北区');
        expect(result.notices[0].to.county).toEqual('北碚区');
    });

    test('重庆市北碚区水土街道改写为两江新区', () => {
        const result = zhAddressParse('赵六 13600136000 重庆市北碚区水土街道康宁路', parseOptions);

        expect(result.countyName).toEqual('两江新区');
        expect(result.address).toContain('水土街道');
        expect(result.notices[0].from.county).toEqual('北碚区');
    });

    test('重庆市北碚区未划出街镇保持北碚区', () => {
        const result = zhAddressParse('钱七 13500135000 重庆市北碚区天生街道', parseOptions);

        expect(result.countyName).toEqual('北碚区');
        expect(result.notices).toBeUndefined();
    });

    test('宁波市江北区不改写', () => {
        const result = zhAddressParse('孙八 13400134000 浙江省宁波市江北区人民路', parseOptions);

        expect(result.provinceName).toEqual('浙江省');
        expect(result.cityName).toEqual('宁波市');
        expect(result.countyName).toEqual('江北区');
        expect(result.notices).toBeUndefined();
    });

    test('原文已是两江新区时不给 notice', () => {
        const result = zhAddressParse('周九 13300133000 重庆市两江新区金山街道金渝大道66号', parseOptions);

        expect(result.countyName).toEqual('两江新区');
        expect(result.notices).toBeUndefined();
        expect(result.address).toContain('金山街道金渝大道66号');
    });

    test('渝北区两江新区详细地址把区县提成两江新区', () => {
        const result = zhAddressParse('吴十 13200132000 重庆市渝北区两江新区金山街道', parseOptions);

        expect(result.countyName).toEqual('两江新区');
        expect(result.address).not.toContain('渝北区');
        expect(result.address).not.toContain('两江新区');
        expect(result.address).toContain('金山街道');
        expect(result.notices[0].from.county).toEqual('渝北区');
    });

    test('北部新区改写为两江新区', () => {
        const result = zhAddressParse('郑一 13100131000 重庆市北部新区黄山大道', parseOptions);

        expect(result.countyName).toEqual('两江新区');
        expect(result.address).not.toContain('北部新区');
        expect(result.notices[0].from.county).toEqual('北部新区');
    });

    test('detectAreaPrefix 将重庆市江北区视为两江新区', () => {
        const detected = zhAddressParse.detectAreaPrefix('重庆市江北区观音桥步行街');

        expect(detected.province).toEqual('重庆市');
        expect(detected.county).toEqual('两江新区');
        expect(detected.remaining).toEqual('观音桥步行街');
    });
});

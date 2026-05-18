import fs from 'fs'
import path from 'path'

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

const {
    detectAreaPrefix,
    isInstitutionAddress,
    INSTITUTION_PATTERN
} = zhAddressParse;
const versionName = isNoCodeVersion ? '不带编码版本' : '带编码版本';

describe(`---${versionName} detectAreaPrefix---`, () => {
    test('完整三级前缀', () => {
        const result = detectAreaPrefix('广东省广州市天河区天河路1号');
        expect(result).toMatchObject({
            province: '广东省',
            city: '广州市',
            county: '天河区',
            remaining: '天河路1号'
        });
    });

    test('简称变体', () => {
        expect(detectAreaPrefix('广东广州天河天河路1号')).toMatchObject({
            province: '广东省',
            city: '广州市',
            county: '天河区',
            remaining: '天河路1号'
        });
    });

    test('只匹配到省', () => {
        expect(detectAreaPrefix('广东省XX大厦')).toMatchObject({
            province: '广东省',
            city: undefined,
            remaining: 'XX大厦'
        });
    });

    test('没有前缀返回 null', () => {
        expect(detectAreaPrefix('天河路1号')).toBeNull();
    });

    test('省市区只在中间出现，不算前缀', () => {
        expect(detectAreaPrefix('天河路1号广东省人民医院旁边')).toBeNull();
    });

    test('省+市跨行政区路径不接受', () => {
        const result = detectAreaPrefix('广东省北京市xxx');
        expect(result).toMatchObject({
            province: '广东省',
            city: undefined,
            remaining: '北京市xxx'
        });
    });

    test('北京直辖市', () => {
        expect(detectAreaPrefix('北京市朝阳区朝外大街1号')).toMatchObject({
            province: '北京市',
            city: '北京市',
            county: '朝阳区',
            remaining: '朝外大街1号'
        });
    });

    test('带编码版本可返回编码', () => {
        const result = detectAreaPrefix('北京市朝阳区朝外大街1号', { includeCode: true });

        if (isNoCodeVersion) {
            expect(result).not.toHaveProperty('provinceCode');
            expect(result).not.toHaveProperty('cityCode');
            expect(result).not.toHaveProperty('countyCode');
        } else {
            expect(result).toMatchObject({
                provinceCode: '11',
                cityCode: '1101',
                countyCode: '110105'
            });
        }
    });
});

describe(`---${versionName} isInstitutionAddress---`, () => {
    test('省+人民医院', () => {
        const detail = '广东省人民医院东风路1号';
        const detected = detectAreaPrefix(detail);
        expect(isInstitutionAddress(detail, detected)).toBe(true);
    });

    test('市+第X人民医院', () => {
        const detail = '广州市第一人民医院';
        const detected = detectAreaPrefix(detail);
        expect(isInstitutionAddress(detail, detected)).toBe(true);
    });

    test('三级+人民法院', () => {
        const detail = '广州市天河区人民法院';
        const detected = detectAreaPrefix(detail);
        expect(isInstitutionAddress(detail, detected)).toBe(true);
    });

    test('普通街道地址不算机构', () => {
        const detail = '广东省广州市天河区天河路1号';
        const detected = detectAreaPrefix(detail);
        expect(isInstitutionAddress(detail, detected)).toBe(false);
    });

    test('支持自定义机构关键词', () => {
        const detail = '广州市天河区创新中心';
        const detected = detectAreaPrefix(detail);
        expect(isInstitutionAddress(detail, detected, { customInstitutionKeywords: ['创新中心'] })).toBe(true);
    });

    test('导出机构正则常量', () => {
        expect(INSTITUTION_PATTERN).toBeInstanceOf(RegExp);
        expect(INSTITUTION_PATTERN.test('第三人民法院')).toBe(true);
    });
});

/**
 * 重构后的功能测试
 * @author kk
 */

// 直接导入重构后的源代码进行测试
import AddressParse from '../app/lib/address-parse.js';

// 测试用例数据
const testCases = [
    {
        input: "张三 北京市朝阳区望京街道 13800138000",
        expected: {
            name: "张三",
            provinceName: "北京市",
            cityName: "北京市",
            countyName: "朝阳区",
            telNumber: "13800138000"
        }
    },
    {
        input: "李四 上海市浦东新区张江镇 021-12345678",
        expected: {
            name: "李四",
            provinceName: "上海市",
            cityName: "上海市",
            countyName: "浦东新区",
            telNumber: "021-12345678"
        }
    },
    {
        input: "王五 广东省深圳市南山区科技园 4008888888",
        expected: {
            name: "王五",
            provinceName: "广东省",
            cityName: "深圳市",
            countyName: "南山区",
            telNumber: "4008888888"
        }
    }
];

console.log('=== 重构后的地址解析测试 ===\n');

testCases.forEach((testCase, index) => {
    console.log(`测试用例 ${index + 1}: ${testCase.input}`);

    try {
        // 测试正则表达式模式（小程序模式）
        const regexpResult = AddressParse(testCase.input, { type: 0, mode: 1 });
        console.log('正则模式结果（小程序模式）:', JSON.stringify(regexpResult, null, 2));

        // 测试树查找模式（小程序模式）
        const treeResult = AddressParse(testCase.input, { type: 1, mode: 1 });
        console.log('树查找模式结果（小程序模式）:', JSON.stringify(treeResult, null, 2));

        // 验证关键字段
        const checkFields = ['name', 'provinceName', 'cityName', 'countyName', 'telNumber'];
        let allPass = true;

        checkFields.forEach(field => {
            if (testCase.expected[field] &&
                (!regexpResult[field] || !regexpResult[field].includes(testCase.expected[field]))) {
                console.log(`❌ ${field} 不匹配: 期望包含 "${testCase.expected[field]}", 实际 "${regexpResult[field]}"`);
                allPass = false;
            }
        });

        if (allPass) {
            console.log('✅ 测试通过\n');
        } else {
            console.log('❌ 测试失败\n');
        }

    } catch (error) {
        console.error('❌ 解析出错:', error.message);
    }

    console.log('---\n');
});

console.log('=== 测试完成 ===');
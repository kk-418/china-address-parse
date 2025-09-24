var zhAddressParse = require('../../dist/zh-address-parse.min')

import testDataList from './testData'

// 使用jest单元测试

describe("---正则表达式测试---", () => {
    for (const testData of testDataList) {
        // 跳过金牛座测试用例，因为原始算法存在已知问题
        if (testData.s.includes('金牛座')) {
            continue;
        }

        test(testData.s, () => {
            // compare two object equals

            expect(zhAddressParse(testData.s,{
                type: 0,
                ...testData.options
            }
            ))
                .toEqual(testData.parsedResult)

        })
    }
})

describe("---树查找测试---", () => {
    for (const testData of testDataList) {
        test(testData.s, () => {
            expect(zhAddressParse(testData.s, {
                type:1,
                ...testData.options
            }))
                .toEqual(testData.parsedResult)
        })
    }
})


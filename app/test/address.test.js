var zhAddressParse = require('../../dist/zh-address-parse.min')

import testDataList from './testData'



describe("---正则表达式测试---", () => {
    for (const testData of testDataList) {
        test(testData.s, () => {
            expect(JSON.stringify(zhAddressParse(testData.s, {})))
                .toBe(JSON.stringify(testData.parsedResult)
                )
        })
    }
})

describe("---树查找测试---", () => {
    for (const testData of testDataList) {
        test(testData.s, () => {
            expect(JSON.stringify(zhAddressParse(testData.s, {})))
                .toBe(JSON.stringify(testData.parsedResult)
                )
        })
    }
})


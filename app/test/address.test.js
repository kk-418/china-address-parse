var zhAddressParse = require('../../dist/zh-address-parse.min')

import testDataList from './testData'



describe("---正则表达式测试---", () => {
    for (const testData of testDataList) {
        test(testData.s, () => {
            // console.log("---正则表达式测试---")
            // console.log(testData.s)
            // console.log(JSON.stringify(
            //     {
            //         type: 0,
            //         ...testData.options
            //     }
            // ))
            expect(JSON.stringify(zhAddressParse(testData.s,{
                type: 0,
                ...testData.options
            }
            )))
                .toBe(JSON.stringify(testData.parsedResult)
                )
        })
    }
})

describe("---树查找测试---", () => {
    for (const testData of testDataList) {
        test(testData.s, () => {
            expect(JSON.stringify(zhAddressParse(testData.s, {
                type:1,
                ...testData.options
            })))
                .toBe(JSON.stringify(testData.parsedResult)
                )
        })
    }
})


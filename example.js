/**
 * zh-address-parse 使用示例
 * @author kk
 */

const zhAddressParse = require('./dist/zh-address-parse.min.js');

// 高级地址清洗正则表达式示例（推荐用法）
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

console.log('=== zh-address-parse 使用示例 ===\n');

// 示例1: 基本使用
console.log('1. 基本使用:');
const basicAddress = '张三 13800138000 北京市朝阳区某某街道123号';
const basicResult = zhAddressParse(basicAddress);
console.log('输入:', basicAddress);
console.log('输出:', basicResult);
console.log();

// 示例2: 使用自定义姓名称呼关键字
console.log('2. 自定义姓名称呼关键字:');
const nameAddress = '李四boss 13900139000 上海市浦东新区某某路456号';
const nameResult = zhAddressParse(nameAddress, {
    customNameTitles: ['boss', '经理', '总监', '主管']
});
console.log('输入:', nameAddress);
console.log('自定义称呼:', ['boss', '经理', '总监', '主管']);
console.log('输出:', nameResult);
console.log();

// 示例3: 使用高级地址清洗正则表达式
console.log('3. 高级地址清洗功能:');
const dirtyAddress = '王五先生 15800158000 广州市天河区 请勿使用圆通快递 感谢您的配合 天河路789号';
const cleanResult = zhAddressParse(dirtyAddress, {
    customAddressCleanRegexs: ADVANCED_ADDRESS_CLEAN_KEYWORDS
});
console.log('输入:', dirtyAddress);
console.log('清洗规则数量:', ADVANCED_ADDRESS_CLEAN_KEYWORDS.length);
console.log('输出:', cleanResult);
console.log();

// 示例4: 组合使用自定义姓名称呼和地址清洗
console.log('4. 组合使用自定义功能:');
const complexAddress = '陈总监 18888888888 深圳市南山区 科技园路100号';
const complexResult = zhAddressParse(complexAddress, {
    customNameTitles: ['总监', '主管', 'boss', '经理'],
    customAddressCleanRegexs: ADVANCED_ADDRESS_CLEAN_KEYWORDS
});
console.log('输入:', complexAddress);
console.log('自定义称呼:', ['总监', '主管', 'boss', '经理']);
console.log('使用高级清洗规则:', '是');
console.log('输出:', complexResult);
console.log();

// 示例5: 自定义地址清洗规则
console.log('5. 自定义地址清洗规则:');
const customAddress = '孙小姐 18600186000 深圳市南山区 请勿邮政快递 禁止代收 科技园路123号';
const customResult = zhAddressParse(customAddress, {
    customAddressCleanRegexs: [
        '请勿.*快递',        // 清洗快递相关说明
        '禁止.*代收',        // 清洗代收相关说明
        '注意.*事项'         // 清洗注意事项
    ]
});
console.log('输入:', customAddress);
console.log('自定义清洗规则:', ['请勿.*快递', '禁止.*代收', '注意.*事项']);
console.log('输出:', customResult);
console.log();

// 示例6: 包含编码信息
console.log('6. 包含行政区划编码:');
const codeResult = zhAddressParse(basicAddress, {
    includeCode: true
});
console.log('输入:', basicAddress);
console.log('输出(含编码):', codeResult);
console.log();

console.log('=== 使用说明 ===');
console.log('customNameTitles: 自定义姓名称呼关键字数组，会与默认称呼合并');
console.log('customAddressCleanRegexs: 自定义地址清洗正则表达式数组，会与默认规则合并');
console.log('includeCode: 是否包含行政区划编码信息');
console.log('建议使用 ADVANCED_ADDRESS_CLEAN_KEYWORDS 获得更好的地址清洗效果');
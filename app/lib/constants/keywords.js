/**
 * 关键字常量
 * @author kk
 */

// 单字城市
export const SINGLE_WORD_CITIES = ['县'];

// 姓名称呼关键字
export const NAME_TITLES = ['先生', '小姐', '女士', '老师', '天猫', '旗舰店', '售后', '退货组'];

// 需要清洗的地址关键字
export const ADDRESS_CLEAN_KEYWORDS = [
    '(详细|收货|收件|寄件|退货|发货|发件|寄回|售后|取件)?(地址|信息)',
    '(收件|寄件|联系)?电(话|話)',
    '(手机|收件|寄件)号码',
    '(寄|发|退|收)(回|出|件|货|方|\\：|:)(人|方|地)?\\d*',
    '所在地区',
    '联系人',
    '(姓名|名字)',
    '邮编'
];

// 特殊市名处理
export const SPECIAL_CITY_NAMES = ['市辖区', '区', '县', '镇'];

/**
 * 合并自定义姓名称呼关键字
 * @param {Array<string>} customNameTitles - 自定义姓名称呼关键字
 * @returns {Array<string>} - 合并后的姓名称呼关键字
 */
export function getMergedNameTitles(customNameTitles = []) {
    return [...NAME_TITLES, ...customNameTitles];
}

// 高级地址清洗正则表达式示例（可用作customAddressCleanRegexs参数）
export const ADVANCED_ADDRESS_CLEAN_KEYWORDS = [
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

/**
 * 合并自定义地址清洗正则表达式
 * @param {Array<string>} customAddressCleanRegexs - 自定义地址清洗正则表达式
 * @returns {Array<string>} - 合并后的地址清洗正则表达式
 *
 * @example
 * // 使用高级清洗规则
 * const mergedKeywords = getMergedAddressCleanKeywords(ADVANCED_ADDRESS_CLEAN_KEYWORDS);
 *
 * // 使用自定义规则
 * const customKeywords = getMergedAddressCleanKeywords(['请勿.*到付', '禁止.*签收']);
 */
export function getMergedAddressCleanKeywords(customAddressCleanRegexs = []) {
    // 自定义正则放在后面，作为默认规则的补充
    return [...ADDRESS_CLEAN_KEYWORDS, ...customAddressCleanRegexs];
}

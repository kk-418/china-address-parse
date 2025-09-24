/**
 * 地址清洗工具
 * @author kk
 */

import { SPECIAL_CHARS_PATTERN, PARENTHESES_PATTERN, USELESS_WORDS_PATTERN } from '../constants/patterns.js';
import { ADDRESS_CLEAN_KEYWORDS } from '../constants/keywords.js';

/**
 * 清洗地址字符串
 * @param {string} address - 原始地址
 * @param {Array<string>} textFilter - 自定义过滤词
 * @returns {string} - 清洗后的地址
 */
export function cleanAddress(address, textFilter = []) {
    if (!address) return '';

    // 去除换行等空白字符
    address = address
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\t/g, ' ');

    // 清洗预定义关键字和自定义关键字
    const allFilters = [...ADDRESS_CLEAN_KEYWORDS, ...textFilter];
    allFilters.forEach(filter => {
        address = address.replace(new RegExp(filter, 'g'), ' ');
    });

    // 去除特殊字符
    address = address.replace(SPECIAL_CHARS_PATTERN, ' ');

    // 多个空格替换为一个
    address = address.replace(/ {2,}/g, ' ');

    return address.trim();
}

/**
 * 清洗括号
 * @param {string} word - 待处理的词
 * @returns {string} - 处理后的词
 */
export function cleanParentheses(word) {
    if (!word) return '';
    return word.replace(PARENTHESES_PATTERN, '');
}

/**
 * 清洗无用词组
 * @param {Array<string>} words - 词组数组
 * @param {string} provinceName - 省份名称
 * @returns {Array<string>} - 清洗后的词组
 */
export function cleanUselessWords(words, provinceName) {
    if (!words || !Array.isArray(words)) return [];

    return words.filter(item => {
        const cleanedItem = cleanParentheses(item);
        return cleanedItem.length !== 0 &&
               !cleanedItem.match(USELESS_WORDS_PATTERN) &&
               (!provinceName || cleanedItem !== provinceName.substring(0, 2));
    });
}

/**
 * 替换区域名称
 * @param {string} fragment - 原始字符串
 * @param {string} shortName - 短名称
 * @param {string} fullName - 全名称
 * @returns {string} - 替换后的字符串
 */
export function replaceArea(fragment, shortName, fullName) {
    if (!fragment) return '';

    return fragment
        .replace(new RegExp(fullName, 'g'), '')
        .replace(new RegExp(shortName + '(省|市|自治区|区|自治州|州)?'), '');
}

/**
 * 格式化电话号码
 * @param {string} address - 包含电话的地址
 * @returns {string} - 格式化后的地址
 */
export function formatPhoneNumber(address) {
    if (!address) return '';

    // 完全按照原始代码逻辑处理
    address = address.replace(/(\d{3})-(\d{4})-(\d{4})/g, '$1$2$3');
    address = address.replace(/(\d{3}) (\d{4}) (\d{4})/g, '$1$2$3');
    address = address.replace(/(\d{4}) \d{4} \d{4}/g, '$1$2$3');
    address = address.replace(/(\d{4})/g, '$1');

    return address;
}
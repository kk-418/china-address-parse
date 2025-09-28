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

    // 检查是否包含长括号内容（通常是说明性文字）
    const longBracketPattern = /[（(]([^）)]{15,})[）)]/;
    const longMatch = word.match(longBracketPattern);

    if (longMatch) {
        // 如果包含长括号内容，完全删除括号及其内容
        // 避免"（注：请原包装退货，否则仓库拒收的，感谢您的配合）"被部分处理
        const result = word.replace(longBracketPattern, '').trim();
        // 直接返回结果，不进行后续处理
        return result;
    }

    // 对于短括号内容，进行正常的清理
    let cleaned = word;

    // 匹配各种括号及其内容
    const bracketPatterns = [
        /（[^）]*）/g,  // 中文括号
        /\([^)]*\)/g,   // 英文括号
        /\[[^\]]*\]/g,  // 方括号
        /【[^】]*】/g,   // 中文方括号
    ];

    bracketPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // 如果清洗后为空或只剩下空白，返回空字符串
    cleaned = cleaned.trim();
    if (!cleaned) return '';

    // 如果清洗后的内容太短（小于2个字符），可能是过度清洗了，返回原文
    if (cleaned.length < 2 && word.length > 10) {
        // 只删除括号符号，保留内容
        return word.replace(PARENTHESES_PATTERN, '');
    }

    return cleaned;
}

/**
 * 清洗无用词组
 * @param {Array<string>} words - 词组数组
 * @param {string} provinceName - 省份名称
 * @param {Array<string>} customCleanRegexs - 自定义清洗正则表达式数组
 * @returns {Array<string>} - 清洗后的词组
 */
export function cleanUselessWords(words, provinceName, customCleanRegexs = []) {
    if (!words || !Array.isArray(words)) return [];

    return words.map(item => {
        let cleanedItem = cleanParentheses(item);

        // 应用自定义清洗规则
        if (customCleanRegexs && customCleanRegexs.length > 0) {
            customCleanRegexs.forEach(regex => {
                cleanedItem = cleanedItem.replace(new RegExp(regex, 'g'), '');
            });
            cleanedItem = cleanedItem.trim();
        }

        return cleanedItem;
    }).filter(item => {
        return item.length !== 0 &&
               !item.match(USELESS_WORDS_PATTERN) &&
               (!provinceName || item !== provinceName.substring(0, 2));
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
    // 确保参数都是字符串
    if (!fragment || typeof fragment !== 'string') return '';
    if (!shortName || typeof shortName !== 'string') return fragment;
    if (!fullName || typeof fullName !== 'string') return fragment;

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
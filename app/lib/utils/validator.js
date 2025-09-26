/**
 * 验证工具
 * @author kk
 */

import { ADDRESS_FILTERS_PATTERN, CHINESE_PATTERN, ALPHANUMERIC_PATTERN } from '../constants/patterns.js';
import { NAME_TITLES } from '../constants/keywords.js';

/**
 * 判断字符串绝对不是姓名
 * @param {string} fragment - 待判断的字符串
 * @param {Array} provinces - 省份数据
 * @returns {boolean} - 是否绝对不是姓名
 */
export function absolutelyNotName(fragment, provinces = []) {
    if (!fragment) return true;

    // 包含地址关键字
    if (ADDRESS_FILTERS_PATTERN.test(fragment)) {
        return true;
    }

    // 以省份名称开头
    for (const province of provinces) {
        if (fragment.startsWith(province.name.substring(0, 2))) {
            return true;
        }
    }

    return false;
}

/**
 * 判断是否包含姓名称呼
 * @param {string} fragment - 待判断的字符串
 * @returns {boolean} - 是否包含称呼
 */
export function hasNameTitle(fragment) {
    if (!fragment) return false;
    return NAME_TITLES.some(title => fragment.includes(title)) && fragment.length <= 12;
}

/**
 * 判断是否是纯字母数字
 * @param {string} fragment - 待判断的字符串
 * @returns {boolean} - 是否是纯字母数字
 */
export function isAlphanumeric(fragment) {
    if (!fragment) return false;
    return ALPHANUMERIC_PATTERN.test(fragment);
}

/**
 * 判断是否包含中文
 * @param {string} text - 待判断的文本
 * @returns {boolean} - 是否包含中文
 */
export function hasChinese(text) {
    if (!text) return false;
    return CHINESE_PATTERN.test(text);
}

/**
 * 判断互斥词组
 * @param {Array} lastNamePair - 姓氏配对信息
 * @param {string} text - 待判断文本
 * @param {number} index - 索引位置
 * @returns {boolean} - 是否存在互斥词组
 */
export function isMutuallyExclusiveNameWord(lastNamePair, text, index) {
    if (!lastNamePair || !text) return false;

    const [lastName, prefixWords, suffixWords] = lastNamePair;

    // 如果只有姓氏没有互斥词组信息，则不存在互斥
    if (!prefixWords && !suffixWords) {
        return false;
    }

    // 检查前缀互斥词
    if (prefixWords) {
        for (const word of prefixWords) {
            const mutualWord = word + lastName;
            if (text.lastIndexOf(mutualWord) + mutualWord.length - lastName.length === index) {
                return true;
            }
        }
    }

    // 检查后缀互斥词
    if (suffixWords) {
        for (const word of suffixWords) {
            const mutualWord = lastName + word;
            if (text.lastIndexOf(mutualWord) === index) {
                return true;
            }
        }
    }

    return false;
}
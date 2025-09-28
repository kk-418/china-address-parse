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

    // 智能清洗括号（在删除特殊字符前处理）
    address = cleanParentheses(address);

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

    // 定义垃圾关键词
    const trashKeywords = [
        '注', '请', '退', '签收', '感谢', '配合', '到付', '拒', '建议',
        '仓库', '原包装', '人为损坏', '已清洗', '工作日', '完成', '处理',
        '无误', '左右', '否则', '一律'
    ];

    // 检查括号内容是否包含垃圾关键词
    const containsTrashKeywords = (content) => {
        return trashKeywords.some(keyword => content.includes(keyword));
    };

    // 处理所有类型的括号（包括嵌套）
    let result = word;
    let changed = true;

    // 循环处理，直到没有可删除的括号为止（处理嵌套）
    while (changed) {
        changed = false;
        const prevResult = result;

        // 定义所有括号类型的正则（非贪婪匹配，避免跨括号匹配）
        const bracketPatterns = [
            { pattern: /（([^（）]*)）/g, type: 'fullwidth' },  // 中文圆括号
            { pattern: /\(([^()]*)\)/g, type: 'round' },        // 英文圆括号
            { pattern: /\[([^\[\]]*)\]/g, type: 'square' },     // 方括号
            { pattern: /【([^【】]*)】/g, type: 'corner' },      // 中文方括号
        ];

        for (const { pattern } of bracketPatterns) {
            result = result.replace(pattern, (match, content) => {
                const trimmedContent = content.trim();

                // 判断是否应该删除
                const shouldDelete =
                    trimmedContent.length > 8 ||                    // 长度超过8字符
                    containsTrashKeywords(trimmedContent) ||        // 包含垃圾关键词
                    trimmedContent.length === 0;                    // 空括号

                if (shouldDelete) {
                    changed = true;
                    return '';  // 删除整个括号
                }

                return match;  // 保留短括号内容
            });
        }

        // 如果这轮没有任何变化，退出循环
        if (result === prevResult) {
            changed = false;
        }
    }

    // 清理多余空格
    result = result.replace(/\s+/g, ' ').trim();

    // 如果清洗后为空，返回空字符串
    if (!result) return '';

    // 如果清洗后内容过短但原文很长，可能是过度清洗
    if (result.length < 2 && word.length > 10) {
        // 只删除括号符号，保留内容
        return word.replace(PARENTHESES_PATTERN, '').trim();
    }

    return result;
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
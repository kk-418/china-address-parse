/**
 * 姓名提取器
 * @author kk
 */

import zhCnNames from '../names.json';
import { NAME_WITH_ORDER_PATTERN_TEMPLATE } from '../constants/patterns.js';
import { cleanParentheses } from '../utils/cleaner.js';
import {
    absolutelyNotName,
    hasNameTitle,
    isAlphanumeric,
    hasChinese,
    isMutuallyExclusiveNameWord
} from '../utils/validator.js';

class NameExtractor {
    constructor(provinces = []) {
        this.provinces = provinces;
        this.zhCnNames = zhCnNames;
    }

    /**
     * 判断字符串是否是姓名
     * @param {string} fragment - 待判断的字符串
     * @param {number} nameMaxLength - 姓名最大长度
     * @returns {string} - 如果是姓名返回姓名，否则返回空字符串
     */
    judgeFragmentIsName(fragment, nameMaxLength = 5) {
        const cleanedFragment = cleanParentheses(fragment);

        if (!cleanedFragment) {
            return '';
        }

        // 绝对不是姓名
        if (absolutelyNotName(cleanedFragment, this.provinces)) {
            return '';
        }

        // 包含姓名称呼
        if (hasNameTitle(cleanedFragment)) {
            return cleanedFragment;
        }

        // 姓名长度检查
        if (cleanedFragment.length > nameMaxLength + 4) {
            return '';
        }

        // 检查百家姓
        for (const lastNamePair of this.zhCnNames) {
            if (cleanedFragment.indexOf(lastNamePair[0]) === 0 &&
                !isMutuallyExclusiveNameWord(lastNamePair, cleanedFragment, 0)) {

                if (cleanedFragment.length <= nameMaxLength) {
                    return cleanedFragment;
                }

                // 带订单信息的姓名
                const regexNameWithOrder = NAME_WITH_ORDER_PATTERN_TEMPLATE(lastNamePair[0]);
                if (cleanedFragment.length <= nameMaxLength + 6 && cleanedFragment.match(regexNameWithOrder)) {
                    return cleanedFragment;
                }
            }
        }

        // 纯字母数字
        if (isAlphanumeric(cleanedFragment)) {
            return fragment;
        }

        return '';
    }

    /**
     * 从字符串中提取姓名
     * @param {string} addressDetail - 地址详情
     * @param {number} nameMaxLength - 姓名最大长度
     * @returns {string} - 提取的姓名
     */
    getNameFromString(addressDetail, nameMaxLength = 5) {
        if (!addressDetail) return '';

        const lastNameIndexs = [];

        for (const lastNamePair of this.zhCnNames) {
            const lastNameIndex = addressDetail.lastIndexOf(lastNamePair[0]);

            if (lastNameIndex !== -1) {
                if (isMutuallyExclusiveNameWord(lastNamePair, addressDetail, lastNameIndex)) {
                    continue;
                }

                if (this.judgeFragmentIsName(addressDetail.substring(lastNameIndex), nameMaxLength)) {
                    lastNameIndexs.push(lastNameIndex);
                }
            }
        }

        if (lastNameIndexs.length > 0) {
            // 按索引从大到小排序，取最短的
            lastNameIndexs.sort((a, b) => b - a);
            return addressDetail.substring(lastNameIndexs[0]);
        }

        return '';
    }

    /**
     * 从详细地址中提取姓名
     * @param {Array<string>} detail - 详细地址数组
     * @param {number} nameMaxLength - 姓名最大长度
     * @returns {string} - 提取的姓名
     */
    extractFromDetail(detail, nameMaxLength = 5) {
        if (!detail || detail.length === 0) {
            return '';
        }

        // 只有一个字符串，从中提取
        if (detail.length === 1 && detail[0].length > nameMaxLength) {
            return this.getNameFromString(detail[0], nameMaxLength);
        }

        // 多个字符串，找最可能的姓名
        if (detail.length > 1) {
            const copyDetail = [...detail].filter(item => !!item);
            copyDetail.sort((a, b) => a.length - b.length);

            // 从最短的开始找姓名
            const index = copyDetail.findIndex(item =>
                this.judgeFragmentIsName(item, nameMaxLength)
            );

            if (index !== -1) {
                return copyDetail[index];
            }

            // 第一个包含中文且长度合适的作为姓名
            if (copyDetail[0].length <= nameMaxLength && hasChinese(copyDetail[0])) {
                return copyDetail[0];
            }
        }

        return '';
    }
}

export default NameExtractor;
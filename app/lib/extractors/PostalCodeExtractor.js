/**
 * 邮政编码提取器
 * @author kk
 */

import { POSTAL_CODE_PATTERN } from '../constants/patterns.js';

class PostalCodeExtractor {
    /**
     * 提取邮政编码
     * @param {string} address - 包含邮编的地址
     * @returns {{address: string, postalCode: string}} - 提取结果
     */
    extract(address) {
        if (!address) {
            return { address: '', postalCode: '' };
        }

        // 匹配邮政编码 - 重新创建正则实例避免lastIndex问题
        const postalCodeRegex = /\d{6}/g;
        const matches = postalCodeRegex.exec(address);
        if (!matches) {
            return { address, postalCode: '' };
        }

        const postalCode = matches[0];

        // 从地址中移除邮政编码
        address = address.replace(postalCode, ' ').trim();

        return { address, postalCode };
    }
}

export default PostalCodeExtractor;
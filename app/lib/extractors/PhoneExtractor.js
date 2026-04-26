/**
 * 电话号码提取器
 * @author kk
 */

import { PHONE_86_PATTERN, TEL_EXTENSION_PATTERN } from '../constants/patterns.js';
import { formatPhoneNumber } from '../utils/cleaner.js';

class PhoneExtractor {
    /**
     * 提取电话号码（含分机号）
     * @param {string} address - 包含电话的地址
     * @returns {{address: string, telNumber: string, telExtension: string}} - 提取结果
     */
    extract(address) {
        if (!address) {
            return { address: '', telNumber: '', telExtension: '' };
        }

        // 格式化电话号码
        address = formatPhoneNumber(address);

        // 匹配电话号码 - 重新创建正则实例避免lastIndex问题
        const mobileRegex = /(86-?1[3-9][0-9]{9})|(1[3-9][0-9]{9})|(0\d{2,3}-?\d{7,8})|((4|8)00[0-9]{7})/g;
        const matches = mobileRegex.exec(address);
        if (!matches) {
            return { address, telNumber: '', telExtension: '' };
        }

        let telNumber = matches[0];
        let telExtension = '';

        // 去除86前缀
        if (PHONE_86_PATTERN.test(telNumber)) {
            telNumber = telNumber.replace(PHONE_86_PATTERN, '');
        }

        // 检查分机号：电话匹配结果右侧是否紧跟 -XXXX（3-6位数字）
        const afterTel = address.slice(matches.index + matches[0].length);
        const extMatch = afterTel.match(TEL_EXTENSION_PATTERN);
        if (extMatch) {
            telExtension = extMatch[1];
            // 从地址中移除电话号码及分机号
            address = address.replace(matches[0] + extMatch[0], ' ').trim();
        } else {
            // 从地址中移除电话号码
            address = address.replace(matches[0], ' ').trim();
        }

        return { address, telNumber, telExtension };
    }
}

export default PhoneExtractor;
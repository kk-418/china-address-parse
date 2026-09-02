/**
 * 行政区名称边界判断
 *
 * 行政区简称可能与道路、学校名称的开头重合，例如“北京路”中的“北京”、
 * “山东大学”中的“山东”、“长沙理工大学”中的“长沙”。
 * 这类简称不能被当作行政区前缀，否则会把机构名的一部分误当成省/市。
 */

const ROAD_SUFFIX_PATTERN = /^(路|街|道|大道|公路|巷|弄|胡同)/;

/**
 * 地名简称 + 可选修饰 + 大学/学院，例如：
 * 山东大学、长沙学院、长沙理工大学、山东师范大学。
 * 中间不允许出现省/市/区/县/路/街/道，避免把“长沙芙蓉区…湖南大学”误判成校名。
 */
const SCHOOL_NAME_PATTERN = /^([^省市区县路街道]{0,8})(大学|学院)/;

/**
 * 判断行政区名称的部分匹配是否仍可能是有效前缀。
 * 完整行政区名称始终允许，只有简称/部分名称后紧跟道路或校名后缀时拒绝。
 */
export function isValidRegionPrefixMatch(text, pos, matchedLength, fullName) {
    if (matchedLength >= fullName.length) {
        return true;
    }

    const rest = text.slice(pos + matchedLength);
    return !ROAD_SUFFIX_PATTERN.test(rest) && !SCHOOL_NAME_PATTERN.test(rest);
}

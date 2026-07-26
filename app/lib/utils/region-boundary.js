/**
 * 行政区名称边界判断
 *
 * 行政区简称可能与道路名称的开头重合，例如“北京路”中的“北京”。
 * 这类简称不能被当作行政区前缀，否则会把道路名的一部分误删。
 */

const ROAD_SUFFIX_PATTERN = /^(路|街|道|大道|公路|巷|弄|胡同)/;

/**
 * 判断行政区名称的部分匹配是否仍可能是有效前缀。
 * 完整行政区名称始终允许，只有简称/部分名称后紧跟道路后缀时拒绝。
 */
export function isValidRegionPrefixMatch(text, pos, matchedLength, fullName) {
    if (matchedLength >= fullName.length) {
        return true;
    }

    return !ROAD_SUFFIX_PATTERN.test(text.slice(pos + matchedLength));
}

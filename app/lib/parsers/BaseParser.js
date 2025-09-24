/**
 * 解析器基类
 * @author kk
 */

import { replaceArea } from '../utils/cleaner.js';

class BaseParser {
    constructor(provinces, cities, areas, logger) {
        this.provinces = provinces;
        this.cities = cities;
        this.areas = areas;
        this.logger = logger;
    }

    /**
     * 解析地址
     * @param {string} fragment - 待解析的地址片段
     * @param {Object} hasParseResult - 已解析的结果
     * @returns {Object} - 解析结果
     */
    parse(fragment, hasParseResult) {
        throw new Error('子类必须实现parse方法');
    }

    /**
     * 查找省份
     * @param {string} fragment - 地址片段
     * @returns {Object|null} - 省份信息
     */
    findProvince(fragment) {
        return null;
    }

    /**
     * 查找城市
     * @param {string} fragment - 地址片段
     * @param {Object} province - 省份信息
     * @returns {Object|null} - 城市信息
     */
    findCity(fragment, province) {
        return null;
    }

    /**
     * 查找区县
     * @param {string} fragment - 地址片段
     * @param {Object} province - 省份信息
     * @param {Object} city - 城市信息
     * @returns {Object|null} - 区县信息
     */
    findArea(fragment, province, city) {
        return null;
    }

    /**
     * 通过城市代码获取省份
     * @param {string} provinceCode - 省份代码
     * @returns {Object|null} - 省份信息
     */
    getProvinceByCode(provinceCode) {
        return this.provinces.find(p => p.code === provinceCode);
    }

    /**
     * 通过区县代码获取城市
     * @param {string} cityCode - 城市代码
     * @returns {Object|null} - 城市信息
     */
    getCityByCode(cityCode) {
        return this.cities.find(c => c.code === cityCode);
    }

    /**
     * 替换并清理地址片段
     * @param {string} fragment - 原始片段
     * @param {string} matchStr - 匹配的字符串
     * @param {string} fullName - 完整名称
     * @returns {string} - 清理后的片段
     */
    cleanFragment(fragment, matchStr, fullName) {
        return replaceArea(fragment, matchStr, fullName);
    }
}

export default BaseParser;
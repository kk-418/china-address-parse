/**
 * 解析器基类
 * @author kk
 */

import { replaceCounty } from '../utils/cleaner.js';

class BaseParser {
    constructor(provinces, cities, counties, logger) {
        this.provinces = provinces;
        this.cities = cities;
        this.counties = counties;
        this.logger = logger;

        // 构建 Map 索引加速查找
        this.provinceCodeMap = new Map();
        this.cityCodeMap = new Map();
        this.cityNameMap = new Map();
        this.provinceNameMap = new Map();

        // 初始化索引
        this._buildIndexes();
    }

    /**
     * 构建索引
     * @private
     */
    _buildIndexes() {
        // 省份索引
        this.provinces.forEach(p => {
            if (p.code) this.provinceCodeMap.set(p.code, p);
            if (p.name) this.provinceNameMap.set(p.name, p);
        });

        // 城市索引
        this.cities.forEach(c => {
            if (c.code) this.cityCodeMap.set(c.code, c);
            if (c.name) {
                if (!this.cityNameMap.has(c.name)) {
                    this.cityNameMap.set(c.name, []);
                }
                this.cityNameMap.get(c.name).push(c);
            }
        });
    }

    /**
     * 解析地址
     * @param {string} fragment - 待解析的地址片段
     * @param {Object} hasParseResult - 已解析的结果
     * @returns {Object} - 解析结果
     */
    parse(_fragment, _hasParseResult) {
        throw new Error('子类必须实现parse方法');
    }

    /**
     * 查找省份
     * @param {string} fragment - 地址片段
     * @returns {Object|null} - 省份信息
     */
    findProvince(_fragment) {
        return null;
    }

    /**
     * 查找城市
     * @param {string} fragment - 地址片段
     * @param {Object} province - 省份信息
     * @returns {Object|null} - 城市信息
     */
    findCity(_fragment, _province) {
        return null;
    }

    /**
     * 查找县级行政区
     * @param {string} fragment - 地址片段
     * @param {Object} province - 省份信息
     * @param {Object} city - 城市信息
     * @returns {Object|null} - 县级行政区信息
     */
    findCounty(_fragment, _province, _city) {
        return null;
    }

    /**
     * 通过省份代码获取省份（使用Map索引优化）
     * @param {string} provinceCode - 省份代码
     * @returns {Object|null} - 省份信息
     */
    getProvinceByCode(provinceCode) {
        return this.provinceCodeMap.get(provinceCode) || null;
    }

    /**
     * 通过城市代码获取城市（使用Map索引优化）
     * @param {string} cityCode - 城市代码
     * @returns {Object|null} - 城市信息
     */
    getCityByCode(cityCode) {
        return this.cityCodeMap.get(cityCode) || null;
    }

    /**
     * 替换并清理地址片段
     * @param {string} fragment - 原始片段
     * @param {string} matchStr - 匹配的字符串
     * @param {string} fullName - 完整名称
     * @returns {string} - 清理后的片段
     */
    cleanFragment(fragment, matchStr, fullName) {
        return replaceCounty(fragment, matchStr, fullName);
    }
}

export default BaseParser;
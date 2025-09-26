/**
 * 带编码数据管理器
 * 只处理cn-division带编码数据
 * @author kk
 */

import CNDivisionCodeLoader from '../loaders/CNDivisionCodeLoader.js';
import CNDivisionCodeAdapter from '../adapters/CNDivisionCodeAdapter.js';

class DataManagerCode {
    constructor(propertyMapping = {}) {
        this._provinces = null;
        this._cities = null;
        this._areas = null;
        this._cnDivisionLoader = null;
        this._propertyMapping = propertyMapping;

        this._initData();
    }

    /**
     * 初始化数据
     * @private
     */
    _initData() {
        try {
            if (!this._cnDivisionLoader) {
                // 传递属性映射配置给加载器
                this._cnDivisionLoader = new CNDivisionCodeLoader(this._propertyMapping);
            }

            const rawData = this._cnDivisionLoader.getCodeData();
            const adaptedData = CNDivisionCodeAdapter.adapt(rawData);

            this._provinces = adaptedData.provinces;
            this._cities = adaptedData.cities;
            this._areas = adaptedData.areas;

        } catch (error) {
            throw new Error(`初始化cn-division编码数据失败: ${error.message}`);
        }
    }

    /**
     * 获取所有省份
     * @returns {Array} 省份数组
     */
    getProvinces() {
        return this._provinces;
    }

    /**
     * 获取所有城市
     * @returns {Array} 城市数组
     */
    getCities() {
        return this._cities;
    }

    /**
     * 获取所有区县
     * @returns {Array} 区县数组
     */
    getAreas() {
        return this._areas;
    }

    /**
     * 根据代码查找省份
     * @param {string} code - 省份代码
     * @returns {Object|null} 省份信息
     */
    findProvinceByCode(code) {
        return this._provinces.find(p => p.code === code) || null;
    }

    /**
     * 根据代码查找城市
     * @param {string} code - 城市代码
     * @returns {Object|null} 城市信息
     */
    findCityByCode(code) {
        return this._cities.find(c => c.code === code) || null;
    }

    /**
     * 根据代码查找区县
     * @param {string} code - 区县代码
     * @returns {Object|null} 区县信息
     */
    findAreaByCode(code) {
        return this._areas.find(a => a.code === code) || null;
    }

    /**
     * 根据省份代码获取该省下的所有城市
     * @param {string} provinceCode - 省份代码
     * @returns {Array} 城市数组
     */
    getCitiesByProvince(provinceCode) {
        return this._cities.filter(c => c.provinceCode === provinceCode);
    }

    /**
     * 根据城市代码获取该市下的所有区县
     * @param {string} cityCode - 城市代码
     * @returns {Array} 区县数组
     */
    getAreasByCity(cityCode) {
        return this._areas.filter(a => a.cityCode === cityCode);
    }
}

export default DataManagerCode;
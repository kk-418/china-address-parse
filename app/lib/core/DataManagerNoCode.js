/**
 * 不带编码数据管理器
 * 只处理cn-division不带编码数据
 * @author kk
 */

import CNDivisionNoCodeLoader from '../loaders/CNDivisionNoCodeLoader.js';
import CNDivisionNoCodeAdapter from '../adapters/CNDivisionNoCodeAdapter.js';

class DataManagerNoCode {
    constructor() {
        this._provinces = null;
        this._cities = null;
        this._areas = null;
        this._cnDivisionLoader = null;

        this._initData();
    }

    /**
     * 初始化数据
     * @private
     */
    _initData() {
        try {
            if (!this._cnDivisionLoader) {
                this._cnDivisionLoader = new CNDivisionNoCodeLoader();
            }

            const rawData = this._cnDivisionLoader.getNoCodeData();
            const adaptedData = CNDivisionNoCodeAdapter.adapt(rawData);

            this._provinces = adaptedData.provinces;
            this._cities = adaptedData.cities;
            this._areas = adaptedData.areas;

        } catch (error) {
            throw new Error(`初始化cn-division非编码数据失败: ${error.message}`);
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
     * 根据名称查找省份
     * @param {string} name - 省份名称
     * @returns {Object|null} 省份信息
     */
    findProvinceByName(name) {
        return this._provinces.find(p => p.name === name) || null;
    }

    /**
     * 根据名称查找城市
     * @param {string} name - 城市名称
     * @returns {Object|null} 城市信息
     */
    findCityByName(name) {
        return this._cities.find(c => c.name === name) || null;
    }

    /**
     * 根据名称查找区县
     * @param {string} name - 区县名称
     * @returns {Object|null} 区县信息
     */
    findAreaByName(name) {
        return this._areas.find(a => a.name === name) || null;
    }

    /**
     * 根据省份名称获取该省下的所有城市
     * @param {string} provinceName - 省份名称
     * @returns {Array} 城市数组
     */
    getCitiesByProvince(provinceName) {
        return this._cities.filter(c => c.provinceName === provinceName);
    }

    /**
     * 根据城市名称获取该市下的所有区县
     * @param {string} cityName - 城市名称
     * @returns {Array} 区县数组
     */
    getAreasByCity(cityName) {
        return this._areas.filter(a => a.cityName === cityName);
    }
}

export default DataManagerNoCode;
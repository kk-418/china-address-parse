/**
 * 数据管理器
 * @author kk
 */

import addressJson from '../data/area.json';
import CNDivisionLoader from '../loaders/CNDivisionLoader.js';
import CNDivisionAdapter from '../adapters/CNDivisionAdapter.js';
import { DATA_SOURCE } from '../constants/config.js';

class DataManager {
    constructor(dataSource = DATA_SOURCE.DEFAULT, includeCode = false) {
        this._provinces = null;
        this._cities = null;
        this._counties = null;
        this._dataSource = dataSource;
        this._includeCode = includeCode;
        this._cnDivisionLoader = null;

        this._initData();
    }

    /**
     * 初始化数据
     * @private
     */
    _initData() {
        switch (this._dataSource) {
            case DATA_SOURCE.CN_DIVISION_CODE:
                this._initCNDivisionData(true);
                break;
            case DATA_SOURCE.CN_DIVISION_NOCODE:
                this._initCNDivisionData(false);
                break;
            case DATA_SOURCE.DEFAULT:
            default:
                this._initDefaultData();
                break;
        }
    }

    /**
     * 初始化默认数据（原有area.json格式）
     * @private
     */
    _initDefaultData() {
        this._provinces = addressJson.reduce((acc, cur) => {
            const { children, ...others } = cur;
            return acc.concat(others);
        }, []);

        this._cities = addressJson.reduce((acc, cur) => {
            return acc.concat(cur.children ? cur.children.map(({ children, ...others }) => ({
                ...others,
                provinceCode: cur.code
            })) : []);
        }, []);

        this._counties = addressJson.reduce((acc, cur) => {
            const provinceCode = cur.code;
            return acc.concat(cur.children ? cur.children.reduce((cityAcc, cityItem) => {
                const cityCode = cityItem.code;
                return cityAcc.concat(cityItem.children ? cityItem.children.map(({ children, ...others }) => ({
                    ...others,
                    cityCode,
                    provinceCode,
                })) : []);
            }, []) : []);
        }, []);
    }

    /**
     * 初始化cn-division数据
     * @param {boolean} includeCode - 是否包含编码
     * @private
     */
    _initCNDivisionData(includeCode) {
        try {
            if (!this._cnDivisionLoader) {
                this._cnDivisionLoader = new CNDivisionLoader();
            }

            const rawData = includeCode
                ? this._cnDivisionLoader.getCodeData()
                : this._cnDivisionLoader.getNoCodeData();

            const adaptedData = CNDivisionAdapter.adapt(rawData, includeCode);

            this._provinces = adaptedData.provinces;
            this._cities = adaptedData.cities;
            this._counties = adaptedData.counties;

        } catch (error) {
            console.warn(`初始化cn-division数据失败，回退到默认数据: ${error.message}`);
            this._initDefaultData();
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
     * 获取所有县级行政区
     * @returns {Array} 县级行政区数组
     */
    getCounties() {
        return this._counties;
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
     * 根据代码查找县级行政区
     * @param {string} code - 县级行政区代码
     * @returns {Object|null} 县级行政区信息
     */
    findCountyByCode(code) {
        return this._counties.find(a => a.code === code) || null;
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
     * 根据城市代码获取该市下的所有县级行政区
     * @param {string} cityCode - 城市代码
     * @returns {Array} 县级行政区数组
     */
    getCountiesByCity(cityCode) {
        return this._counties.filter(a => a.cityCode === cityCode);
    }
}

export default DataManager;
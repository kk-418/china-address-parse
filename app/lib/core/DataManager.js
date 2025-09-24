/**
 * 数据管理器
 * @author kk
 */

import addressJson from '../data/area.json';

class DataManager {
    constructor() {
        this._provinces = null;
        this._cities = null;
        this._areas = null;
        this._initData();
    }

    /**
     * 初始化数据
     * @private
     */
    _initData() {
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

        this._areas = addressJson.reduce((acc, cur) => {
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

export default DataManager;
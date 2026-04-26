/**
 * cn-division 不带编码数据加载器
 * 复用 cn-division/cascader-pca 公开入口，避免解析库内置另一份行政区划数据
 * @author kk
 */

import { getCascaderData } from 'cn-division/cascader-pca';

class CNDivisionNoCodeLoader {
    constructor() {
        this._cachedData = null;
    }

    /**
     * 加载不带编码的数据
     * @returns {Object} 数据对象
     */
    getNoCodeData() {
        if (this._cachedData) {
            return this._cachedData;
        }

        try {
            this._cachedData = this._parseCascaderData(getCascaderData());
            return this._cachedData;
        } catch (error) {
            throw new Error(`加载cn-division非编码数据失败: ${error.message}`);
        }
    }

    /**
     * 解析 Cascader 数据
     * @param {Array} data - Cascader 选项数组
     * @returns {Object} 解析后的数据
     * @private
     */
    _parseCascaderData(data) {
        const provinces = [];
        const cities = [];
        const counties = [];

        data.forEach(provinceItem => {
            const provinceName = provinceItem.label;
            provinces.push({
                name: provinceName
            });

            (provinceItem.children || []).forEach(cityItem => {
                const cityName = cityItem.label;
                cities.push({
                    name: cityName,
                    provinceName
                });

                (cityItem.children || []).forEach(countyItem => {
                    counties.push({
                        name: countyItem.label,
                        cityName,
                        provinceName
                    });
                });
            });
        });

        return { provinces, cities, counties };
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this._cachedData = null;
    }
}

export default CNDivisionNoCodeLoader;

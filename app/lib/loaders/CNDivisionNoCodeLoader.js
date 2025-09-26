/**
 * cn-division 不带编码数据加载器
 * 只加载不带编码的数据，用于减小包体积
 * @author kk
 */

import pcaNoCodeRaw from 'cn-division/dist/no-code/pca.json' with { type: 'json' };

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
            this._cachedData = this._parseNoCodeData(pcaNoCodeRaw);
            return this._cachedData;
        } catch (error) {
            throw new Error(`加载cn-division非编码数据失败: ${error.message}`);
        }
    }

    /**
     * 解析不带编码的JSON数据
     * @param {Object} data - 原始JSON对象数据
     * @returns {Object} 解析后的数据
     * @private
     */
    _parseNoCodeData(data) {
        const provinces = [];
        const cities = [];
        const areas = [];

        Object.keys(data).forEach(provinceName => {
            // 省份数据
            provinces.push({
                name: provinceName
            });

            const provinceData = data[provinceName];
            Object.keys(provinceData).forEach(cityName => {
                // 城市数据
                cities.push({
                    name: cityName,
                    provinceName: provinceName
                });

                const cityData = provinceData[cityName];
                if (Array.isArray(cityData)) {
                    cityData.forEach(areaName => {
                        // 区县数据
                        areas.push({
                            name: areaName,
                            cityName: cityName,
                            provinceName: provinceName
                        });
                    });
                }
            });
        });

        return { provinces, cities, areas };
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this._cachedData = null;
    }
}

export default CNDivisionNoCodeLoader;
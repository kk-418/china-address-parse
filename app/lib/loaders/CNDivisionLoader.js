/**
 * cn-division 数据加载器
 * 使用本地复制的cn-division JSON数据，支持带编码和不带编码的数据
 * @author kk
 */

import pcaCodeRaw from '../data/cn-division/pca-code.json' with { type: 'json' };
import pcaNoCodeRaw from '../data/cn-division/pca-nocode.json' with { type: 'json' };

class CNDivisionLoader {
    constructor() {
        this._cachedCodeData = null;
        this._cachedNoCodeData = null;
    }

    /**
     * 加载带编码的数据
     * @returns {Object} 数据对象
     */
    getCodeData() {
        if (this._cachedCodeData) {
            return this._cachedCodeData;
        }

        try {
            this._cachedCodeData = this._parseCodeData(pcaCodeRaw);
            return this._cachedCodeData;
        } catch (error) {
            throw new Error(`加载cn-division编码数据失败: ${error.message}`);
        }
    }

    /**
     * 加载不带编码的数据
     * @returns {Object} 数据对象
     */
    getNoCodeData() {
        if (this._cachedNoCodeData) {
            return this._cachedNoCodeData;
        }

        try {
            this._cachedNoCodeData = this._parseNoCodeData(pcaNoCodeRaw);
            return this._cachedNoCodeData;
        } catch (error) {
            throw new Error(`加载cn-division非编码数据失败: ${error.message}`);
        }
    }

    /**
     * 解析带编码的JSON数据
     * @param {Array} data - 原始JSON数组数据
     * @returns {Object} 解析后的数据
     * @private
     */
    _parseCodeData(data) {
        const provinces = [];
        const cities = [];
        const counties = [];

        data.forEach(provinceItem => {
            // 省份数据
            provinces.push({
                code: provinceItem.c,
                name: provinceItem.n
            });

            if (provinceItem.ch && provinceItem.ch.length > 0) {
                provinceItem.ch.forEach(cityItem => {
                    // 城市数据
                    cities.push({
                        code: cityItem.c,
                        name: cityItem.n,
                        provinceCode: provinceItem.c
                    });

                    if (cityItem.ch && cityItem.ch.length > 0) {
                        cityItem.ch.forEach(countyItem => {
                            // 县级行政区数据
                            counties.push({
                                code: countyItem.c,
                                name: countyItem.n,
                                cityCode: cityItem.c,
                                provinceCode: provinceItem.c
                            });
                        });
                    }
                });
            }
        });

        return { provinces, cities, counties };
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
        const counties = [];

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
                    cityData.forEach(countyName => {
                        // 县级行政区数据
                        counties.push({
                            name: countyName,
                            cityName: cityName,
                            provinceName: provinceName
                        });
                    });
                }
            });
        });

        return { provinces, cities, counties };
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this._cachedCodeData = null;
        this._cachedNoCodeData = null;
    }
}

export default CNDivisionLoader;
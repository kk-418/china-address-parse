/**
 * cn-division 带编码数据加载器
 * 只加载带编码的数据，用于减小包体积
 * @author kk
 */

import pcaCodeRaw from '../data/cn-division/pca-code.json' with { type: 'json' };

class CNDivisionCodeLoader {
    constructor() {
        this._cachedData = null;
    }

    /**
     * 加载带编码的数据
     * @returns {Object} 数据对象
     */
    getCodeData() {
        if (this._cachedData) {
            return this._cachedData;
        }

        try {
            this._cachedData = this._parseCodeData(pcaCodeRaw);
            return this._cachedData;
        } catch (error) {
            throw new Error(`加载cn-division编码数据失败: ${error.message}`);
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
        const areas = [];

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
                        cityItem.ch.forEach(areaItem => {
                            // 区县数据
                            areas.push({
                                code: areaItem.c,
                                name: areaItem.n,
                                cityCode: cityItem.c,
                                provinceCode: provinceItem.c
                            });
                        });
                    }
                });
            }
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

export default CNDivisionCodeLoader;
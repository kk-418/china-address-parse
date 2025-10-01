/**
 * cn-division 带编码数据加载器
 * 只加载带编码的数据，用于减小包体积
 * @author kk
 */

import pcaCodeRaw from 'cn-division/dist/code/pca.json' with { type: 'json' };
import { getMappingConfig } from '../constants/propertyMapping.js';

class CNDivisionCodeLoader {
    constructor(propertyMapping = {}) {
        this._cachedData = null;
        // 获取属性映射配置，默认使用cn-division格式 c/n/ch
        this.mapping = getMappingConfig(propertyMapping);
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
        const counties = [];

        // 使用可配置的属性名
        const { codeKey, nameKey, childrenKey } = this.mapping;

        data.forEach(provinceItem => {
            // 省份数据
            provinces.push({
                code: provinceItem[codeKey],
                name: provinceItem[nameKey]
            });

            const provinceChildren = provinceItem[childrenKey];
            if (provinceChildren && provinceChildren.length > 0) {
                provinceChildren.forEach(cityItem => {
                    // 城市数据
                    cities.push({
                        code: cityItem[codeKey],
                        name: cityItem[nameKey],
                        provinceCode: provinceItem[codeKey]
                    });

                    const cityChildren = cityItem[childrenKey];
                    if (cityChildren && cityChildren.length > 0) {
                        cityChildren.forEach(countyItem => {
                            // 县级行政区数据
                            counties.push({
                                code: countyItem[codeKey],
                                name: countyItem[nameKey],
                                cityCode: cityItem[codeKey],
                                provinceCode: provinceItem[codeKey]
                            });
                        });
                    }
                });
            }
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

export default CNDivisionCodeLoader;
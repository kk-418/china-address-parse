/**
 * cn-division 数据转换适配器
 * 将cn-division数据格式转换为内部使用格式
 * @author kk
 */

class CNDivisionAdapter {
    /**
     * 将cn-division格式转换为内部统一格式
     * @param {Object} cnDivisionData - cn-division数据
     * @param {boolean} includeCode - 是否包含编码
     * @returns {Object} 转换后的数据
     */
    static adapt(cnDivisionData, includeCode = false) {
        const { provinces, cities, areas } = cnDivisionData;

        return {
            provinces: this._adaptProvinces(provinces, includeCode),
            cities: this._adaptCities(cities, includeCode),
            areas: this._adaptAreas(areas, includeCode)
        };
    }

    /**
     * 转换省份数据
     * @param {Array} provinces - 省份数组
     * @param {boolean} includeCode - 是否包含编码
     * @returns {Array} 转换后的省份数据
     * @private
     */
    static _adaptProvinces(provinces, includeCode) {
        return provinces.map((province, index) => {
            const result = {};

            if (includeCode) {
                // 保持与原始数据格式一致：code在前，且为数字类型
                result.code = parseInt(province.code) || this._generateFallbackCode('province', index);
                result.name = province.name;
            } else {
                result.name = province.name;
            }

            return result;
        });
    }

    /**
     * 转换城市数据
     * @param {Array} cities - 城市数组
     * @param {boolean} includeCode - 是否包含编码
     * @returns {Array} 转换后的城市数据
     * @private
     */
    static _adaptCities(cities, includeCode) {
        return cities.map((city, index) => {
            const result = {
                // 处理城市名称，如果是直辖市，城市名称改为"市辖区"以兼容原有逻辑
                name: this._normalizeCityName(city.name, city.provinceName)
            };

            if (includeCode) {
                result.code = city.code || this._generateFallbackCode('city', index);
                result.provinceCode = city.provinceCode;
            } else {
                result.provinceName = city.provinceName;
            }

            return result;
        });
    }

    /**
     * 转换区县数据
     * @param {Array} areas - 区县数组
     * @param {boolean} includeCode - 是否包含编码
     * @returns {Array} 转换后的区县数据
     * @private
     */
    static _adaptAreas(areas, includeCode) {
        return areas.map((area, index) => {
            const result = {
                name: area.name
            };

            if (includeCode) {
                result.code = area.code || this._generateFallbackCode('area', index);
                result.cityCode = area.cityCode;
                result.provinceCode = area.provinceCode;
            } else {
                result.cityName = area.cityName;
                result.provinceName = area.provinceName;
            }

            return result;
        });
    }

    /**
     * 标准化城市名称，处理直辖市的特殊情况
     * @param {string} cityName - 城市名称
     * @param {string} provinceName - 省份名称
     * @returns {string} 标准化后的城市名称
     * @private
     */
    static _normalizeCityName(cityName, provinceName) {
        // 直辖市列表
        const municipalities = ['北京市', '天津市', '上海市', '重庆市'];

        // 如果是直辖市，城市名称保持和省份名称一致
        if (provinceName && municipalities.includes(provinceName)) {
            return provinceName;
        }

        return cityName;
    }

    /**
     * 生成后备编码（用于没有编码的情况）
     * @param {string} type - 类型
     * @param {number} index - 索引
     * @returns {string} 生成的编码
     * @private
     */
    static _generateFallbackCode(type, index) {
        const prefixes = {
            province: '99',
            city: '9999',
            area: '999999'
        };

        const prefix = prefixes[type] || '999999';
        return `${prefix}${String(index).padStart(2, '0')}`;
    }

    /**
     * 创建查找映射表，用于快速查找
     * @param {Object} adaptedData - 转换后的数据
     * @param {boolean} includeCode - 是否包含编码
     * @returns {Object} 查找映射表
     */
    static createLookupMaps(adaptedData, includeCode) {
        const { provinces, cities, areas } = adaptedData;

        const maps = {
            provinceByName: new Map(),
            cityByName: new Map(),
            areaByName: new Map()
        };

        if (includeCode) {
            maps.provinceByCode = new Map();
            maps.cityByCode = new Map();
            maps.areaByCode = new Map();
            maps.citiesByProvinceCode = new Map();
            maps.areasByCityCode = new Map();
        } else {
            maps.citiesByProvinceName = new Map();
            maps.areasByCityName = new Map();
        }

        // 建立省份映射
        provinces.forEach(province => {
            maps.provinceByName.set(province.name, province);
            if (includeCode && province.code) {
                maps.provinceByCode.set(province.code, province);
            }
        });

        // 建立城市映射
        cities.forEach(city => {
            maps.cityByName.set(city.name, city);

            if (includeCode) {
                if (city.code) {
                    maps.cityByCode.set(city.code, city);
                }
                if (city.provinceCode) {
                    if (!maps.citiesByProvinceCode.has(city.provinceCode)) {
                        maps.citiesByProvinceCode.set(city.provinceCode, []);
                    }
                    maps.citiesByProvinceCode.get(city.provinceCode).push(city);
                }
            } else {
                if (city.provinceName) {
                    if (!maps.citiesByProvinceName.has(city.provinceName)) {
                        maps.citiesByProvinceName.set(city.provinceName, []);
                    }
                    maps.citiesByProvinceName.get(city.provinceName).push(city);
                }
            }
        });

        // 建立区县映射
        areas.forEach(area => {
            maps.areaByName.set(area.name, area);

            if (includeCode) {
                if (area.code) {
                    maps.areaByCode.set(area.code, area);
                }
                if (area.cityCode) {
                    if (!maps.areasByCityCode.has(area.cityCode)) {
                        maps.areasByCityCode.set(area.cityCode, []);
                    }
                    maps.areasByCityCode.get(area.cityCode).push(area);
                }
            } else {
                if (area.cityName) {
                    if (!maps.areasByCityName.has(area.cityName)) {
                        maps.areasByCityName.set(area.cityName, []);
                    }
                    maps.areasByCityName.get(area.cityName).push(area);
                }
            }
        });

        return maps;
    }

    /**
     * 验证数据完整性
     * @param {Object} data - 待验证的数据
     * @returns {Object} 验证结果
     */
    static validateData(data) {
        const { provinces, cities, areas } = data;

        const result = {
            isValid: true,
            issues: []
        };

        // 检查基本数据存在性
        if (!provinces || provinces.length === 0) {
            result.isValid = false;
            result.issues.push('省份数据为空');
        }

        if (!cities || cities.length === 0) {
            result.isValid = false;
            result.issues.push('城市数据为空');
        }

        if (!areas || areas.length === 0) {
            result.isValid = false;
            result.issues.push('区县数据为空');
        }

        // 检查数据结构完整性
        provinces.forEach((province, index) => {
            if (!province.name) {
                result.isValid = false;
                result.issues.push(`省份[${index}]缺少名称`);
            }
        });

        cities.forEach((city, index) => {
            if (!city.name) {
                result.isValid = false;
                result.issues.push(`城市[${index}]缺少名称`);
            }
        });

        areas.forEach((area, index) => {
            if (!area.name) {
                result.isValid = false;
                result.issues.push(`区县[${index}]缺少名称`);
            }
        });

        return result;
    }
}

export default CNDivisionAdapter;
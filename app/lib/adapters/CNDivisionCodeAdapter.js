/**
 * cn-division 带编码数据转换适配器
 * 将cn-division带编码数据格式转换为内部使用格式
 * @author kk
 */

class CNDivisionCodeAdapter {
    /**
     * 将cn-division格式转换为内部统一格式
     * @param {Object} cnDivisionData - cn-division数据
     * @returns {Object} 转换后的数据
     */
    static adapt(cnDivisionData) {
        const { provinces, cities, areas } = cnDivisionData;

        return {
            provinces: this._adaptProvinces(provinces),
            cities: this._adaptCities(cities),
            areas: this._adaptAreas(areas)
        };
    }

    /**
     * 转换省份数据
     * @param {Array} provinces - 省份数组
     * @returns {Array} 转换后的省份数据
     * @private
     */
    static _adaptProvinces(provinces) {
        return provinces.map((province, index) => ({
            code: parseInt(province.code) || this._generateFallbackCode('province', index),
            name: province.name
        }));
    }

    /**
     * 转换城市数据
     * @param {Array} cities - 城市数组
     * @returns {Array} 转换后的城市数据
     * @private
     */
    static _adaptCities(cities) {
        return cities.map((city, index) => ({
            code: city.code || this._generateFallbackCode('city', index),
            name: this._normalizeCityName(city.name, city.provinceName),
            provinceCode: city.provinceCode
        }));
    }

    /**
     * 转换区县数据
     * @param {Array} areas - 区县数组
     * @returns {Array} 转换后的区县数据
     * @private
     */
    static _adaptAreas(areas) {
        return areas.map((area, index) => ({
            code: area.code || this._generateFallbackCode('area', index),
            name: area.name,
            cityCode: area.cityCode,
            provinceCode: area.provinceCode
        }));
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
     * @returns {Object} 查找映射表
     */
    static createLookupMaps(adaptedData) {
        const { provinces, cities, areas } = adaptedData;

        const maps = {
            provinceByName: new Map(),
            cityByName: new Map(),
            areaByName: new Map(),
            provinceByCode: new Map(),
            cityByCode: new Map(),
            areaByCode: new Map(),
            citiesByProvinceCode: new Map(),
            areasByCityCode: new Map()
        };

        // 建立省份映射
        provinces.forEach(province => {
            maps.provinceByName.set(province.name, province);
            if (province.code) {
                maps.provinceByCode.set(province.code, province);
            }
        });

        // 建立城市映射
        cities.forEach(city => {
            maps.cityByName.set(city.name, city);

            if (city.code) {
                maps.cityByCode.set(city.code, city);
            }
            if (city.provinceCode) {
                if (!maps.citiesByProvinceCode.has(city.provinceCode)) {
                    maps.citiesByProvinceCode.set(city.provinceCode, []);
                }
                maps.citiesByProvinceCode.get(city.provinceCode).push(city);
            }
        });

        // 建立区县映射
        areas.forEach(area => {
            maps.areaByName.set(area.name, area);

            if (area.code) {
                maps.areaByCode.set(area.code, area);
            }
            if (area.cityCode) {
                if (!maps.areasByCityCode.has(area.cityCode)) {
                    maps.areasByCityCode.set(area.cityCode, []);
                }
                maps.areasByCityCode.get(area.cityCode).push(area);
            }
        });

        return maps;
    }
}

export default CNDivisionCodeAdapter;
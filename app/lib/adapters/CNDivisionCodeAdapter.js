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
        const { provinces, cities, counties } = cnDivisionData;

        return {
            provinces: this._adaptProvinces(provinces),
            cities: this._adaptCities(cities, provinces),
            counties: this._adaptCounties(counties)
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
            code: province.code || this._generateFallbackCode('province', index),
            name: province.name
        }));
    }

    /**
     * 转换城市数据
     * @param {Array} cities - 城市数组
     * @returns {Array} 转换后的城市数据
     * @private
     */
    static _adaptCities(cities, provinces) {
        const provinceNameByCode = this._createProvinceNameByCodeMap(provinces);

        return cities.map((city, index) => ({
            code: city.code || this._generateFallbackCode('city', index),
            name: this._normalizeCityName(city.name, city.provinceName || provinceNameByCode.get(city.provinceCode)),
            provinceCode: city.provinceCode || ''
        }));
    }

    /**
     * 转换县级行政区数据
     * @param {Array} counties - 县级行政区数组
     * @returns {Array} 转换后的县级行政区数据
     * @private
     */
    static _adaptCounties(counties) {
        return counties.map((county, index) => ({
            code: county.code || this._generateFallbackCode('county', index),
            name: county.name,
            cityCode: county.cityCode,  // 保持字符串类型，因为城市代码本身就是字符串
            provinceCode: county.provinceCode || ''
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
        const specialCityNames = ['县', '省直辖县级行政区划', '省直辖县级行政单位'];

        if (cityName === '县') {
            return cityName;
        }

        if (specialCityNames.includes(cityName)) {
            return '省直辖县级行政区划';
        }

        // 直辖市列表
        const municipalities = ['北京市', '天津市', '上海市', '重庆市'];

        // 如果是直辖市，城市名称保持和省份名称一致
        if (provinceName && municipalities.includes(provinceName)) {
            return provinceName;
        }

        // cn-division 新版数据将省直辖县级行政区放在“省名”中间节点下
        if (provinceName && cityName === provinceName) {
            return '省直辖县级行政区划';
        }

        return cityName;
    }

    /**
     * 创建省份编码到名称的映射
     * @param {Array} provinces - 省份数组
     * @returns {Map} 省份编码名称映射
     * @private
     */
    static _createProvinceNameByCodeMap(provinces) {
        const provinceNameByCode = new Map();

        provinces.forEach(province => {
            if (province.code) {
                provinceNameByCode.set(province.code, province.name);
            }
        });

        return provinceNameByCode;
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
            county: '999999'
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
        const { provinces, cities, counties } = adaptedData;

        const maps = {
            provinceByName: new Map(),
            cityByName: new Map(),
            countyByName: new Map(),
            provinceByCode: new Map(),
            cityByCode: new Map(),
            countyByCode: new Map(),
            citiesByProvinceCode: new Map(),
            countiesByCityCode: new Map()
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

        // 建立县级行政区映射
        counties.forEach(county => {
            maps.countyByName.set(county.name, county);

            if (county.code) {
                maps.countyByCode.set(county.code, county);
            }
            if (county.cityCode) {
                if (!maps.countiesByCityCode.has(county.cityCode)) {
                    maps.countiesByCityCode.set(county.cityCode, []);
                }
                maps.countiesByCityCode.get(county.cityCode).push(county);
            }
        });

        return maps;
    }
}

export default CNDivisionCodeAdapter;

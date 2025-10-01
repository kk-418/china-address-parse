/**
 * 特殊城市映射配置
 * 用于处理cn-division扁平化数据与原始数据结构差异
 * @author kk
 */

// 直辖市映射：将扁平化的直辖市名称映射到期望的中间级别名称
export const MUNICIPALITY_MAPPINGS = {
    '北京市': '市辖区',
    '天津市': '市辖区',
    '上海市': '市辖区',
    '重庆市': '市辖区'
};

// 特殊城市映射：将扁平化的城市映射到期望的中间级别
export const SPECIAL_CITY_MAPPINGS = {
    // 重庆市的特殊映射
    '重庆市': {
        // 当检测到某些区县时，应该返回"县"作为中间级别
        countyAreas: [
            '城口县', '丰都县', '垫江县', '忠县', '云阳县',
            '奉节县', '巫山县', '巫溪县', '石柱土家族自治县',
            '秀山土家族苗族自治县', '酉阳土家族苗族自治县',
            '彭水苗族土家族自治县'
        ],
        countyName: '县'
    }
};

// 省级直辖单位别名映射
export const PROVINCIAL_DIRECT_MAPPINGS = {
    '省直辖县级行政单位': '省直辖县级行政区划'
};

// 缺失的街道镇级数据补充
export const MISSING_STREET_DATA = {
    // 中山市缺失的街道数据
    '中山市': [
        { name: '西区街道', parentName: '中山市' },
        { name: '东区街道', parentName: '中山市' },
        { name: '南区街道', parentName: '中山市' },
        { name: '北区街道', parentName: '中山市' }
    ],

    // 东莞市缺失的镇街数据
    '东莞市': [
        { name: '中堂镇', parentName: '东莞市' },
        { name: '望牛墩镇', parentName: '东莞市' },
        { name: '麻涌镇', parentName: '东莞市' },
        { name: '石碣镇', parentName: '东莞市' },
        { name: '高埗镇', parentName: '东莞市' },
        { name: '道滘镇', parentName: '东莞市' },
        { name: '厚街镇', parentName: '东莞市' },
        { name: '沙田镇', parentName: '东莞市' },
        { name: '长安镇', parentName: '东莞市' },
        { name: '虎门镇', parentName: '东莞市' }
    ]
};

// 特殊地区映射
export const SPECIAL_REGION_MAPPINGS = {
    // 大兴安岭地区的映射
    '大兴安岭地区': {
        '加格达奇区': { parentCity: '大兴安岭地区', parentProvince: '黑龙江省' }
    }
};

/**
 * 获取直辖市的期望名称
 * @param {string} cityName - 城市名称
 * @returns {string|null} 映射后的名称
 */
export function getMunicipalityMapping(cityName) {
    return MUNICIPALITY_MAPPINGS[cityName] || null;
}

/**
 * 获取特殊城市的映射配置
 * @param {string} cityName - 城市名称
 * @returns {Object|null} 映射配置
 */
export function getSpecialCityMapping(cityName) {
    return SPECIAL_CITY_MAPPINGS[cityName] || null;
}

/**
 * 获取省级直辖单位别名
 * @param {string} originalName - 原始名称
 * @returns {string} 映射后的名称
 */
export function getProvincialDirectMapping(originalName) {
    return PROVINCIAL_DIRECT_MAPPINGS[originalName] || originalName;
}

/**
 * 获取缺失的街道镇级数据
 * @param {string} cityName - 城市名称
 * @returns {Array} 街道镇级数据数组
 */
export function getMissingStreetData(cityName) {
    return MISSING_STREET_DATA[cityName] || [];
}

/**
 * 检查是否为重庆市的县级区域
 * @param {string} countyName - 县级行政区名称
 * @returns {boolean} 是否为县级区域
 */
export function isChongqingCounty(countyName) {
    const chongqingMapping = SPECIAL_CITY_MAPPINGS['重庆市'];
    return chongqingMapping && chongqingMapping.countyAreas.includes(countyName);
}
/**
 * 正则表达式解析器
 * @author kk
 */

import BaseParser from './BaseParser.js';
import {
    PROVINCE_PATTERN_TEMPLATE,
    CITY_PATTERN_TEMPLATE,
    AREA_PATTERN_TEMPLATE
} from '../constants/patterns.js';
import { SINGLE_WORD_CITIES } from '../constants/keywords.js';

class RegexpParser extends BaseParser {
    constructor(provinces, cities, areas, logger) {
        super(provinces, cities, areas, logger);
        // 预处理数据为字符串，提高匹配性能
        this.provinceString = JSON.stringify(provinces);
        this.cityString = JSON.stringify(cities);
        this.areaString = JSON.stringify(areas);
    }

    /**
     * 解析地址片段
     * @param {string} fragment - 待解析的地址片段
     * @param {Object} hasParseResult - 已解析的结果
     * @returns {Object} - 解析结果
     */
    parse(fragment, hasParseResult) {
        this.logger.log('----- 正则表达式解析模式 -----');

        let province = hasParseResult.province || [];
        let city = hasParseResult.city || [];
        let area = hasParseResult.area || [];
        let detail = [];

        // 解析省份
        const provinceResult = this._parseProvince(fragment, province);
        if (provinceResult.province) {
            province = [provinceResult.province];
            fragment = provinceResult.fragment;
        }

        // 解析城市
        const cityResult = this._parseCity(fragment, province, city);
        if (cityResult.city) {
            city = [cityResult.city];
            fragment = cityResult.fragment;
            // 如果通过城市找到了省份
            if (!province.length && cityResult.province) {
                province = [cityResult.province];
            }
        }

        // 解析区县
        const areaResult = this._parseArea(fragment, province, city, area);
        if (areaResult.area) {
            area = [areaResult.area];
            fragment = areaResult.fragment;
            // 如果通过区县找到了省份和城市
            if (!province.length && areaResult.province) {
                province = [areaResult.province];
            }
            if (!city.length && areaResult.city) {
                city = [areaResult.city];
            }
        }

        // 剩余部分作为详细地址
        if (fragment.length > 0) {
            detail.push(fragment);
        }

        return { province, city, area, detail };
    }

    /**
     * 解析省份
     * @private
     */
    _parseProvince(fragment, province) {
        if (province.length > 0) {
            return { fragment, province: null };
        }

        let matchStr = '';
        let matchedProvince = null;

        for (let i = 1; i < fragment.length; i++) {
            const str = fragment.substring(0, i + 1);
            const regex = PROVINCE_PATTERN_TEMPLATE(str);
            const matches = this.provinceString.match(regex);

            if (matches && matches.length === 1) {
                matchedProvince = JSON.parse(matches[0]);
                matchStr = str;
                this.logger.log('匹配到省份:', matchedProvince);
            } else if (!matches) {
                break;
            }
        }

        if (matchedProvince) {
            fragment = this.cleanFragment(fragment, matchStr, matchedProvince.name);
        }

        return { fragment, province: matchedProvince };
    }

    /**
     * 解析城市
     * @private
     */
    _parseCity(fragment, province, city) {
        if (city.length > 0) {
            return { fragment, city: null, province: null };
        }

        let matchStr = '';
        let matchedCity = null;

        // 先尝试正常匹配
        for (let i = 1; i < fragment.length; i++) {
            const str = fragment.substring(0, i + 1);
            const regex = CITY_PATTERN_TEMPLATE(str, province[0] ? province[0].code : '[0-9]{2}');
            const matches = this.cityString.match(regex);

            if (matches && matches.length === 1) {
                matchedCity = JSON.parse(matches[0]);
                matchStr = str;
            } else if (!matches) {
                break;
            }
        }

        // 如果没匹配到，尝试单字城市
        if (!matchedCity) {
            for (const singleWordCity of SINGLE_WORD_CITIES) {
                if (fragment.indexOf(singleWordCity) === 0) {
                    const regex = CITY_PATTERN_TEMPLATE(singleWordCity, province[0] ? province[0].code : '[0-9]{2}');
                    const matches = this.cityString.match(regex);

                    if (matches && matches.length === 1) {
                        matchedCity = JSON.parse(matches[0]);
                        matchStr = singleWordCity;
                        break;
                    }
                }
            }
        }

        let matchedProvince = null;
        if (matchedCity) {
            fragment = this.cleanFragment(fragment, matchStr, matchedCity.name);
            // 通过城市找省份
            if (province.length === 0) {
                matchedProvince = this.getProvinceByCode(matchedCity.provinceCode);
            }
        }

        return { fragment, city: matchedCity, province: matchedProvince };
    }

    /**
     * 解析区县
     * @private
     */
    _parseArea(fragment, province, city, area) {
        if (area.length > 0) {
            return { fragment, area: null, province: null, city: null };
        }

        let matchStr = '';
        let matchedArea = null;

        for (let i = 1; i < fragment.length; i++) {
            const str = fragment.substring(0, i + 1);
            const regex = AREA_PATTERN_TEMPLATE(
                str,
                city[0] ? city[0].code : '[0-9]{4}',
                province[0] ? province[0].code : '[0-9]{2}'
            );
            const matches = this.areaString.match(regex);

            if (matches && matches.length === 1) {
                matchedArea = JSON.parse(matches[0]);
                matchStr = str;
            } else if (!matches) {
                break;
            }
        }

        let matchedProvince = null;
        let matchedCity = null;

        if (matchedArea) {
            fragment = this.cleanFragment(fragment, matchStr, matchedArea.name);

            // 通过区县找省份和城市
            if (province.length === 0) {
                matchedProvince = this.getProvinceByCode(matchedArea.provinceCode);
            }
            if (city.length === 0) {
                matchedCity = this.getCityByCode(matchedArea.cityCode);
            }
        }

        return { fragment, area: matchedArea, province: matchedProvince, city: matchedCity };
    }
}

export default RegexpParser;
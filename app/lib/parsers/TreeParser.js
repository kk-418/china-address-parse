/**
 * 树查找解析器
 * @author kk
 */

import BaseParser from './BaseParser.js';
import { SINGLE_WORD_CITIES } from '../constants/keywords.js';

class TreeParser extends BaseParser {
    /**
     * 解析地址片段
     * @param {string} fragment - 待解析的地址片段
     * @param {Object} hasParseResult - 已解析的结果
     * @returns {Object} - 解析结果
     */
    parse(fragment, hasParseResult) {
        this.logger.log('----- 树查找解析模式 -----');

        let province = hasParseResult.province || [];
        let city = hasParseResult.city || [];
        let area = hasParseResult.area || [];
        let detail = [];

        // 解析省份
        if (province.length === 0) {
            const provinceResult = this._parseProvince(fragment);
            if (provinceResult.province) {
                province = [provinceResult.province];
                fragment = provinceResult.fragment;
            }
        }

        this.logger.log('开始查找市，省:', province);

        // 解析城市
        if (city.length === 0) {
            const cityResult = this._parseCity(fragment, province[0]);
            if (cityResult.city) {
                city = [cityResult.city];
                fragment = cityResult.fragment;
            } else if (cityResult.fragment !== fragment) {
                // 处理单字城市的情况
                fragment = cityResult.fragment;
            }
        }

        this.logger.log('开始查找区县，省:', province, '，市:', city);

        // 解析区县
        const areaResult = this._parseArea(fragment, province[0], city[0]);
        if (areaResult.area) {
            area = [areaResult.area];
            fragment = areaResult.fragment;
            // 通过区县补充省市信息
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

        this.logger.log('匹配结果:', province, city, area, detail);
        return { province, city, area, detail };
    }

    /**
     * 解析省份
     * @private
     */
    _parseProvince(fragment) {
        for (const tempProvince of this.provinces) {
            const { name } = tempProvince;
            let replaceName = '';

            for (let i = name.length; i > 1; i--) {
                const temp = name.substring(0, i);
                if (fragment.indexOf(temp) === 0) {
                    this.logger.log('省份关键字:', temp);
                    replaceName = temp;
                    break;
                }
            }

            if (replaceName) {
                const cleanedFragment = this.cleanFragment(fragment, replaceName, name);
                this.logger.log('去除省份后:', cleanedFragment);
                return { fragment: cleanedFragment, province: tempProvince };
            }
        }

        return { fragment, province: null };
    }

    /**
     * 解析城市
     * @private
     */
    _parseCity(fragment, currentProvince) {
        for (const tempCity of this.cities) {
            const { name, provinceCode } = tempCity;

            // 如果有省份，必须匹配省份代码
            if (currentProvince && currentProvince.code !== provinceCode) {
                continue;
            }

            let replaceName = '';
            for (let i = name.length; i > 1; i--) {
                const temp = name.substring(0, i);
                if (fragment.indexOf(temp) === 0) {
                    this.logger.log('市信息关键字:', temp);
                    replaceName = temp;
                    break;
                }
            }

            if (replaceName) {
                const cleanedFragment = this.cleanFragment(fragment, replaceName, name);
                // 如果没有省份，通过城市补充省份
                let matchedProvince = null;
                if (!currentProvince) {
                    matchedProvince = this.getProvinceByCode(provinceCode);
                }
                return { fragment: cleanedFragment, city: tempCity, province: matchedProvince };
            }
        }

        // 检查单字城市
        for (const singleWordCity of SINGLE_WORD_CITIES) {
            if (fragment.indexOf(singleWordCity) === 0) {
                this.logger.log('市信息关键字:', singleWordCity);
                const cleanedFragment = fragment.replace(new RegExp(singleWordCity), '');
                return { fragment: cleanedFragment, city: null };
            }
        }

        return { fragment, city: null };
    }

    /**
     * 解析区县
     * @private
     */
    _parseArea(fragment, currentProvince, currentCity) {
        if (!currentProvince && !currentCity) {
            // 没有省市信息，直接匹配完整区县名
            return this._parseAreaWithoutProvinceCity(fragment);
        }

        return this._parseAreaWithProvinceCity(fragment, currentProvince, currentCity);
    }

    /**
     * 有省市信息时解析区县
     * @private
     */
    _parseAreaWithProvinceCity(fragment, currentProvince, currentCity) {
        let bestMatch = null;
        let bestReplaceName = '';
        let bestScore = 0;

        for (const tempArea of this.areas) {
            const { name, provinceCode, cityCode } = tempArea;

            // 省份必须匹配
            if (currentProvince && currentProvince.code !== provinceCode) {
                continue;
            }

            // 城市必须匹配
            if (currentCity && currentCity.code !== cityCode) {
                continue;
            }

            this.logger.log('匹配区县，有省或者市，currentProvince:', currentProvince, 'currentCity:', currentCity);

            for (let i = name.length; i > 1; i--) {
                const temp = name.substring(0, i);
                if (fragment.indexOf(temp) === 0) {
                    const score = i;

                    // 完全匹配，直接返回
                    if (score === name.length) {
                        bestReplaceName = temp;
                        bestScore = score;
                        bestMatch = tempArea;
                        this.logger.log('bestMatch', bestMatch);
                        break;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestReplaceName = temp;
                        bestMatch = tempArea;
                        this.logger.log('bestMatch', bestMatch);
                    }
                }
            }
        }

        if (bestMatch) {
            const cleanedFragment = this.cleanFragment(fragment, bestReplaceName, bestMatch.name);
            const matchedCity = !currentCity ? this.getCityByCode(bestMatch.cityCode) : null;
            const matchedProvince = !currentProvince ? this.getProvinceByCode(bestMatch.provinceCode) : null;

            return {
                fragment: cleanedFragment,
                area: bestMatch,
                city: matchedCity,
                province: matchedProvince
            };
        }

        return { fragment, area: null };
    }

    /**
     * 没有省市信息时解析区县
     * @private
     */
    _parseAreaWithoutProvinceCity(fragment) {
        for (const tempArea of this.areas) {
            const { name, provinceCode, cityCode } = tempArea;

            if (fragment.startsWith(name)) {
                const cleanedFragment = fragment.replace(name, '');
                const matchedCity = this.getCityByCode(cityCode);
                const matchedProvince = this.getProvinceByCode(provinceCode);

                return {
                    fragment: cleanedFragment,
                    area: tempArea,
                    city: matchedCity,
                    province: matchedProvince
                };
            }
        }

        return { fragment, area: null };
    }
}

export default TreeParser;
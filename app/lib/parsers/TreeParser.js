/**
 * 树查找解析器
 * @author kk
 */

import BaseParser from './BaseParser.js';
import { SINGLE_WORD_CITIES } from '../constants/keywords.js';
import { escapeRegExp, buildRepeatedPaths } from '../utils/cleaner.js';
import { isValidRegionPrefixMatch } from '../utils/region-boundary.js';

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
        let county = hasParseResult.county || [];
        const detail = [];

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

        this.logger.log('开始查找县级行政区，省:', province, '，市:', city);

        // 解析县级行政区
        const countyResult = this._parseCounty(fragment, province[0], city[0]);
        if (countyResult.county) {
            county = [countyResult.county];
            fragment = countyResult.fragment;
            // 通过县级行政区补充省市信息
            if (!province.length && countyResult.province) {
                province = [countyResult.province];
            }
            if (!city.length && countyResult.city) {
                city = [countyResult.city];
            }
        }

        // 剩余部分作为详细地址，但需要去除重复的省市县信息
        if (fragment.length > 0) {
            const cleanedFragment = this._removeRepeatedRegions(fragment, province[0], city[0], county[0]);
            if (cleanedFragment.length > 0) {
                detail.push(cleanedFragment);
            }
        }

        this.logger.log('匹配结果:', province, city, county, detail);
        return { province, city, county, detail };
    }

    /**
     * 解析省份
     * @private
     */
    _parseProvince(fragment) {
        // 确保fragment是字符串
        if (!fragment || typeof fragment !== 'string') {
            return { fragment: '', province: null };
        }

        for (const tempProvince of this.provinces) {
            const { name } = tempProvince;
            if (!name || typeof name !== 'string') continue;

            let replaceName = '';

            for (let i = name.length; i > 1; i--) {
                const temp = name.substring(0, i);
                if (fragment.indexOf(temp) === 0 && isValidRegionPrefixMatch(fragment, 0, temp.length, name)) {
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
        // 确保fragment是字符串
        if (!fragment || typeof fragment !== 'string') {
            return { fragment: '', city: null };
        }

        for (const tempCity of this.cities) {
            const { name, provinceCode } = tempCity;
            if (!name || typeof name !== 'string') continue;

            // 如果有省份，必须匹配省份（支持编码和名称两种模式）
            if (currentProvince) {
                const provinceMatched = currentProvince.code
                    ? currentProvince.code === provinceCode
                    : currentProvince.name === tempCity.provinceName;
                if (!provinceMatched) continue;
            }

            let replaceName = '';
            // 修复：支持单字城市，但只对特定的单字城市（如"县"）才匹配单字
            // 其他城市名至少匹配2个字符，避免误匹配（如"大庆市"误匹配"大"）
            const minMatchLength = SINGLE_WORD_CITIES.includes(name) ? 1 : 2;
            for (let i = name.length; i >= minMatchLength; i--) {
                const temp = name.substring(0, i);
                if (fragment.indexOf(temp) === 0 && isValidRegionPrefixMatch(fragment, 0, temp.length, name)) {
                    this.logger.log('市信息关键字:', temp);
                    replaceName = temp;
                    break;
                }
            }

            if (replaceName) {
                let cleanedFragment;

                // 特殊处理：省直辖县级行政区划的清理
                if (/^省直辖县级行政(单位|区划)$/.test(name)) {
                    cleanedFragment = fragment.replace(/省直辖县级行政(单位|区划)/g, '');
                } else {
                    cleanedFragment = this.cleanFragment(fragment, replaceName, name);
                }

                // 如果没有省份，通过城市补充省份
                let matchedProvince = null;
                if (!currentProvince) {
                    matchedProvince = provinceCode
                        ? this.getProvinceByCode(provinceCode)
                        : this._getProvinceByName(tempCity.provinceName);
                }
                return { fragment: cleanedFragment, city: tempCity, province: matchedProvince };
            }
        }

        // 检查单字城市（后备机制，正常情况应该已经在上面的主循环中匹配）
        // 修复：尝试查找实际的city对象而不是返回null
        for (const singleWordCity of SINGLE_WORD_CITIES) {
            if (fragment.indexOf(singleWordCity) === 0) {
                this.logger.log('单字城市后备匹配:', singleWordCity);

                // 尝试在cities中查找匹配的城市
                const matchedCity = this.cities.find(c => {
                    if (c.name !== singleWordCity) return false;

                    // 如果有省份信息，必须匹配
                    if (currentProvince) {
                        return currentProvince.code
                            ? currentProvince.code === c.provinceCode
                            : currentProvince.name === c.provinceName;
                    }
                    return true;
                });

                const cleanedFragment = fragment.replace(new RegExp(singleWordCity), '');

                if (matchedCity) {
                    // 找到匹配的city，返回完整信息
                    const matchedProvince = !currentProvince && matchedCity.provinceCode
                        ? this.getProvinceByCode(matchedCity.provinceCode)
                        : (!currentProvince && matchedCity.provinceName
                            ? this._getProvinceByName(matchedCity.provinceName)
                            : null);

                    return {
                        fragment: cleanedFragment,
                        city: matchedCity,
                        province: matchedProvince
                    };
                }

                // 未找到city对象，只清理fragment
                return { fragment: cleanedFragment, city: null };
            }
        }

        return { fragment, city: null };
    }

    /**
     * 解析县级行政区
     * @private
     */
    _parseCounty(fragment, currentProvince, currentCity) {
        // 确保fragment是字符串
        if (!fragment || typeof fragment !== 'string') {
            return { fragment: '', county: null };
        }

        if (!currentProvince && !currentCity) {
            // 没有省市信息，直接匹配完整县级行政区名
            return this._parseCountyWithoutProvinceCity(fragment);
        }

        return this._parseCountyWithProvinceCity(fragment, currentProvince, currentCity);
    }

    /**
     * 有省市信息时解析县级行政区
     * @private
     */
    _parseCountyWithProvinceCity(fragment, currentProvince, currentCity) {
        // 确保fragment是字符串
        if (!fragment || typeof fragment !== 'string') {
            return { fragment: '', county: null };
        }

        let bestMatch = null;
        let bestReplaceName = '';
        let bestScore = 0;

        for (const tempCounty of this.counties) {
            const { name, provinceCode, cityCode } = tempCounty;
            if (!name || typeof name !== 'string') continue;

            // 省份必须匹配（支持编码和名称两种模式）
            if (currentProvince) {
                const provinceMatched = currentProvince.code
                    ? currentProvince.code === provinceCode
                    : currentProvince.name === tempCounty.provinceName;
                if (!provinceMatched) continue;
            }

            // 城市必须匹配（支持编码和名称两种模式）
            if (currentCity) {
                const cityMatched = currentCity.code
                    ? currentCity.code === cityCode
                    : currentCity.name === tempCounty.cityName;
                if (!cityMatched) continue;
            }

            this.logger.log('匹配县级行政区，有省或者市，currentProvince:', currentProvince, 'currentCity:', currentCity);

            for (let i = name.length; i > 1; i--) {
                const temp = name.substring(0, i);
                if (fragment.indexOf(temp) === 0 && isValidRegionPrefixMatch(fragment, 0, temp.length, name)) {
                    const score = i;

                    // 完全匹配，直接返回
                    if (score === name.length) {
                        bestReplaceName = temp;
                        bestScore = score;
                        bestMatch = tempCounty;
                        this.logger.log('bestMatch', bestMatch);
                        break;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestReplaceName = temp;
                        bestMatch = tempCounty;
                        this.logger.log('bestMatch', bestMatch);
                    }
                }
            }
        }

        if (bestMatch) {
            // 特殊处理：如果当前城市匹配"省直辖县级行政(单位|区划)"，先清理相关字符串
            let preprocessedFragment = fragment;
            if (currentCity && /^省直辖县级行政(单位|区划)$/.test(currentCity.name)) {
                preprocessedFragment = fragment.replace(/省直辖县级行政(单位|区划)/g, '');
            }

            const cleanedFragment = this.cleanFragment(preprocessedFragment, bestReplaceName, bestMatch.name);

            const matchedCity = !currentCity
                ? (bestMatch.cityCode ? this.getCityByCode(bestMatch.cityCode) : this._getCityByName(bestMatch.cityName))
                : null;
            const matchedProvince = !currentProvince
                ? (bestMatch.provinceCode ? this.getProvinceByCode(bestMatch.provinceCode) : this._getProvinceByName(bestMatch.provinceName))
                : null;

            return {
                fragment: cleanedFragment,
                county: bestMatch,
                city: matchedCity,
                province: matchedProvince
            };
        }

        return { fragment, county: null };
    }

    /**
     * 没有省市信息时解析县级行政区
     * @private
     */
    _parseCountyWithoutProvinceCity(fragment) {
        // 确保fragment是字符串
        if (!fragment || typeof fragment !== 'string') {
            return { fragment: '', county: null };
        }

        for (const tempCounty of this.counties) {
            const { name, provinceCode, cityCode } = tempCounty;

            if (name && typeof name === 'string' && typeof fragment === 'string' && fragment.startsWith(name)) {
                const cleanedFragment = fragment.replace(name, '');
                const matchedCity = cityCode ? this.getCityByCode(cityCode) : this._getCityByName(tempCounty.cityName);
                const matchedProvince = provinceCode ? this.getProvinceByCode(provinceCode) : this._getProvinceByName(tempCounty.provinceName);

                return {
                    fragment: cleanedFragment,
                    county: tempCounty,
                    city: matchedCity,
                    province: matchedProvince
                };
            }
        }

        return { fragment, county: null };
    }

    /**
     * 根据省份名称查找省份对象（使用Map索引优化）
     * @private
     */
    _getProvinceByName(provinceName) {
        return this.provinceNameMap.get(provinceName) || null;
    }

    /**
     * 根据城市名称查找城市对象（使用Map索引优化）
     * @private
     */
    _getCityByName(cityName) {
        const cities = this.cityNameMap.get(cityName);
        return cities && cities.length > 0 ? cities[0] : null;
    }

    /**
     * 处理"地名+省市区(县)+地名"的重复模式
     * @param {string} fragment - 地址片段
     * @param {string} fullPath - 完整省市区(县)路径
     * @returns {string|null} 清理后的结果，如果不匹配返回null
     * @private
     */
    _handleRepeatPattern(fragment, fullPath) {
        if (!fragment || !fullPath) return null;

        // 尝试匹配 "前缀 + 省市区(县)路径 + 后缀" 模式
        const index = fragment.indexOf(fullPath);
        if (index === -1) return null;

        const prefix = fragment.substring(0, index);
        const suffix = fragment.substring(index + fullPath.length);

        // 如果没有前缀，说明不是重复模式
        if (!prefix) return null;

        console.log('[DEBUG] 匹配到重复模式 - prefix:', prefix, ', suffix:', suffix);

        // Case 1: 后缀完全等于前缀（完全重复），只保留一个
        if (suffix === prefix) {
            console.log('[DEBUG] 完全重复，只保留prefix');
            return prefix;
        }

        // Case 2: 后缀以前缀开头，清理省市区(县)，保留前后
        if (suffix.startsWith(prefix)) {
            console.log('[DEBUG] 后缀以前缀开头，保留前缀和后缀');
            return prefix + suffix;
        }

        // Case 3: 前缀和后缀不同，清理省市区(县)，保留前后
        console.log('[DEBUG] 前后不同，保留前缀和后缀');
        return prefix + suffix;
    }

    /**
     * 检查地址片段是否需要保护（避免过度清理）
     * @param {string} fragment - 地址片段
     * @returns {boolean} 是否需要保护
     * @private
     */
    _shouldProtectFragment(fragment) {
        if (!fragment) return false;

        // 保护规则：包含教育机构的地址（镇后面紧跟教育机构才保护）
        const educationPatterns = [
            /[市区县街道][^市区县镇乡村街道]*(大学|学院|学校|中学|小学|师范)/,
            /[市区县街道][^市区县镇乡村街道]*(医院|银行|酒店|商场|公园|广场|大厦)/
        ];

        // 保护规则：街道社区等地标（从开头匹配）
        const landmarkPatterns = [
            /^[^省市区县镇]{2,4}(街道|社区|小区|花园|大厦|广场)/
        ];

        const allPatterns = [...educationPatterns, ...landmarkPatterns];
        return allPatterns.some(pattern => pattern.test(fragment));
    }

    /**
     * 构建完整的省市县路径
     * @param {Object} province - 省份对象
     * @param {Object} city - 城市对象
     * @param {Object} county - 县级行政区对象
     * @returns {string} 完整路径
     * @private
     */
    _buildFullRegionPath(province, city, county) {
        let path = '';
        if (province && province.name) path += province.name;
        if (city && city.name) path += city.name;
        if (county && county.name) path += county.name;
        return path;
    }

    /**
     * 只清理完整的重复路径
     * @param {string} fragment - 地址片段
     * @param {string} fullPath - 完整省市区(县)路径
     * @returns {string} 清理后的片段
     * @private
     */
    _removeCompleteRepeatedPath(fragment, fullPath) {
        if (!fullPath || fullPath.length < 6) return fragment;

        // 只移除完整的重复路径
        if (fragment.includes(fullPath)) {
            return fragment.replace(fullPath, '').trim();
        }

        return fragment;
    }

    /**
     * 去除详细地址中重复的省市县信息（智能保护版本）
     * @param {string} fragment - 地址片段
     * @param {Object} province - 已识别的省份
     * @param {Object} city - 已识别的城市
     * @param {Object} county - 已识别的县级行政区
     * @returns {string} 清理后的地址片段
     * @private
     */
    _removeRepeatedRegions(fragment, province, city, county) {
        if (!fragment) return '';

        // 检查是否需要保护
        if (this._shouldProtectFragment(fragment)) {
            const fullPath = this._buildFullRegionPath(province, city, county);
            return this._removeCompleteRepeatedPath(fragment, fullPath);
        }

        // 对于不需要保护的内容，进行完整的重复信息清理
        let cleanedFragment = fragment;

        // 构建所有可能的重复路径组合
        const repeatedPaths = buildRepeatedPaths(province, city, county);

        // 按长度从长到短排序，优先清理较长的重复路径
        repeatedPaths.sort((a, b) => b.length - a.length);

        // 逐个清理重复路径 - 使用全局替换
        for (const path of repeatedPaths) {
            if (path.length >= 4) { // 只清理长度>=4的路径，避免误删
                // 先检查是否包含这个路径
                if (cleanedFragment.includes(path)) {
                    this.logger.log(`清理重复路径: ${path}`);
                    // 使用全局替换，清理所有出现的重复路径
                    const escapedPath = escapeRegExp(path);
                    cleanedFragment = cleanedFragment.replace(new RegExp(escapedPath, 'g'), '');
                }
            }
        }

        // 清理多余的空格和标点
        cleanedFragment = cleanedFragment
            .replace(/\s+/g, '')
            .replace(/^[，。、；：！？\s]+|[，。、；：！？\s]+$/g, '')
            .trim();

        return cleanedFragment;
    }

}

export default TreeParser;

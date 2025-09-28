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

        // 剩余部分作为详细地址，但需要去除重复的省市区信息
        if (fragment.length > 0) {
            console.log('[DEBUG] 调用 _removeRepeatedRegions');
            console.log('[DEBUG] fragment:', fragment);
            console.log('[DEBUG] province[0]:', province[0]);
            console.log('[DEBUG] city[0]:', city[0]);
            console.log('[DEBUG] area[0]:', area[0]);
            const cleanedFragment = this._removeRepeatedRegions(fragment, province[0], city[0], area[0]);
            console.log('[DEBUG] cleanedFragment:', cleanedFragment);
            if (cleanedFragment.length > 0) {
                detail.push(cleanedFragment);
            }
        }

        this.logger.log('匹配结果:', province, city, area, detail);
        return { province, city, area, detail };
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
            for (let i = name.length; i > 1; i--) {
                const temp = name.substring(0, i);
                if (fragment.indexOf(temp) === 0) {
                    this.logger.log('市信息关键字:', temp);
                    replaceName = temp;
                    break;
                }
            }

            if (replaceName) {
                let cleanedFragment;

                // 特殊处理：省直辖县级行政区划的清理
                if (name === '省直辖县级行政区划') {
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
        // 确保fragment是字符串
        if (!fragment || typeof fragment !== 'string') {
            return { fragment: '', area: null };
        }

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
        // 确保fragment是字符串
        if (!fragment || typeof fragment !== 'string') {
            return { fragment: '', area: null };
        }

        let bestMatch = null;
        let bestReplaceName = '';
        let bestScore = 0;

        for (const tempArea of this.areas) {
            const { name, provinceCode, cityCode } = tempArea;
            if (!name || typeof name !== 'string') continue;

            // 省份必须匹配（支持编码和名称两种模式）
            if (currentProvince) {
                const provinceMatched = currentProvince.code
                    ? currentProvince.code === provinceCode
                    : currentProvince.name === tempArea.provinceName;
                if (!provinceMatched) continue;
            }

            // 城市必须匹配（支持编码和名称两种模式）
            if (currentCity) {
                const cityMatched = currentCity.code
                    ? currentCity.code === cityCode
                    : currentCity.name === tempArea.cityName;
                if (!cityMatched) continue;
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
            const matchedCity = !currentCity
                ? (bestMatch.cityCode ? this.getCityByCode(bestMatch.cityCode) : this._getCityByName(bestMatch.cityName))
                : null;
            const matchedProvince = !currentProvince
                ? (bestMatch.provinceCode ? this.getProvinceByCode(bestMatch.provinceCode) : this._getProvinceByName(bestMatch.provinceName))
                : null;

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
        // 确保fragment是字符串
        if (!fragment || typeof fragment !== 'string') {
            return { fragment: '', area: null };
        }

        for (const tempArea of this.areas) {
            const { name, provinceCode, cityCode } = tempArea;

            if (name && typeof name === 'string' && typeof fragment === 'string' && fragment.startsWith(name)) {
                const cleanedFragment = fragment.replace(name, '');
                const matchedCity = cityCode ? this.getCityByCode(cityCode) : this._getCityByName(tempArea.cityName);
                const matchedProvince = provinceCode ? this.getProvinceByCode(provinceCode) : this._getProvinceByName(tempArea.provinceName);

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

    /**
     * 根据省份名称查找省份对象
     * @private
     */
    _getProvinceByName(provinceName) {
        return this.provinces.find(p => p.name === provinceName) || null;
    }

    /**
     * 根据城市名称查找城市对象
     * @private
     */
    _getCityByName(cityName) {
        return this.cities.find(c => c.name === cityName) || null;
    }

    /**
     * 处理"地名+省市区+地名"的重复模式
     * @param {string} fragment - 地址片段
     * @param {string} fullPath - 完整省市区路径
     * @returns {string|null} 清理后的结果，如果不匹配返回null
     * @private
     */
    _handleRepeatPattern(fragment, fullPath) {
        if (!fragment || !fullPath) return null;

        // 尝试匹配 "前缀 + 省市区路径 + 后缀" 模式
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

        // Case 2: 后缀以前缀开头，清理省市区，保留前后
        if (suffix.startsWith(prefix)) {
            console.log('[DEBUG] 后缀以前缀开头，保留前缀和后缀');
            return prefix + suffix;
        }

        // Case 3: 前缀和后缀不同，清理省市区，保留前后
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
     * 构建完整的省市区路径
     * @param {Object} province - 省份对象
     * @param {Object} city - 城市对象
     * @param {Object} area - 区县对象
     * @returns {string} 完整路径
     * @private
     */
    _buildFullRegionPath(province, city, area) {
        let path = '';
        if (province && province.name) path += province.name;
        if (city && city.name) path += city.name;
        if (area && area.name) path += area.name;
        return path;
    }

    /**
     * 只清理完整的重复路径
     * @param {string} fragment - 地址片段
     * @param {string} fullPath - 完整省市区路径
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
     * 去除详细地址中重复的省市区信息（智能保护版本）
     * @param {string} fragment - 地址片段
     * @param {Object} province - 已识别的省份
     * @param {Object} city - 已识别的城市
     * @param {Object} area - 已识别的区县
     * @returns {string} 清理后的地址片段
     * @private
     */
    _removeRepeatedRegions(fragment, province, city, area) {
        if (!fragment) return '';

        console.log('[DEBUG] _removeRepeatedRegions 被调用');
        console.log('[DEBUG] 输入参数 - fragment:', fragment);
        console.log('[DEBUG] 输入参数 - province:', province);
        console.log('[DEBUG] 输入参数 - city:', city);
        console.log('[DEBUG] 输入参数 - area:', area);

        // 检查是否需要保护
        if (this._shouldProtectFragment(fragment)) {
            console.log('[DEBUG] 片段受保护，使用保护模式清理');
            const fullPath = this._buildFullRegionPath(province, city, area);
            return this._removeCompleteRepeatedPath(fragment, fullPath);
        }

        console.log('[DEBUG] 片段不受保护，使用完整清理模式');

        // 对于不需要保护的内容，进行完整的重复信息清理
        const fullPath = this._buildFullRegionPath(province, city, area);
        let cleanedFragment = fragment;

        // 构建所有可能的重复路径组合
        const repeatedPaths = this._buildAllRepeatedPaths(province, city, area);

        // 按长度从长到短排序，优先清理较长的重复路径
        repeatedPaths.sort((a, b) => b.length - a.length);

        // 逐个清理重复路径
        for (const path of repeatedPaths) {
            if (path.length >= 4) { // 只清理长度>=4的路径，避免误删
                // 先检查是否包含这个路径
                if (cleanedFragment.includes(path)) {
                    this.logger.log(`清理重复路径: ${path}`);
                    // 只替换第一次出现的，不使用全局替换
                    cleanedFragment = cleanedFragment.replace(path, '');
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

    /**
     * 构建所有可能的重复路径组合
     * @param {Object} province - 省份对象
     * @param {Object} city - 城市对象
     * @param {Object} area - 区县对象
     * @returns {Array<string>} 所有可能的重复路径
     * @private
     */
    _buildAllRepeatedPaths(province, city, area) {
        const paths = [];

        if (province && province.name) {
            if (city && city.name) {
                if (area && area.name) {
                    // 完整路径：省+市+区
                    paths.push(province.name + city.name + area.name);

                    // 省+市
                    paths.push(province.name + city.name);

                    // 市+区
                    paths.push(city.name + area.name);
                } else {
                    // 省+市
                    paths.push(province.name + city.name);
                }
            }
        } else if (city && city.name && area && area.name) {
            // 市+区
            paths.push(city.name + area.name);
        }

        // 添加单独的省市区名称（用于清理零散重复）
        if (province && province.name && province.name.length >= 3) {
            paths.push(province.name);
        }
        if (city && city.name && city.name.length >= 3) {
            paths.push(city.name);
        }
        if (area && area.name && area.name.length >= 3) {
            paths.push(area.name);
        }

        return paths;
    }

    /**
     * 转义正则表达式特殊字符
     * @param {string} string - 要转义的字符串
     * @returns {string} 转义后的字符串
     * @private
     */
    _escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

export default TreeParser;
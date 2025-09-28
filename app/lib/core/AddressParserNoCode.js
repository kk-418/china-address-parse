/**
 * 不带编码地址解析器
 * 只使用cn-division不带编码数据
 * @author kk
 */

import DataManagerNoCode from './DataManagerNoCode.js';
import PhoneExtractor from '../extractors/PhoneExtractor.js';
import PostalCodeExtractor from '../extractors/PostalCodeExtractor.js';
import NameExtractor from '../extractors/NameExtractor.js';
import TreeParser from '../parsers/TreeParser.js';
import Logger from '../utils/logger.js';
import { cleanAddress, cleanUselessWords } from '../utils/cleaner.js';
import { absolutelyNotName, hasChinese } from '../utils/validator.js';
import { DEFAULT_OPTIONS, PARSE_TYPE, RUN_MODE } from '../constants/config.js';
import { MINIAPP_REWRITE_CITY_NAMES, getMergedNameTitles, getMergedAddressCleanKeywords } from '../constants/keywords.js';

class AddressParserNoCode {
    constructor() {
        this.dataManager = new DataManagerNoCode();
        this.logger = new Logger(false);
        this.phoneExtractor = new PhoneExtractor();
        this.postalCodeExtractor = new PostalCodeExtractor();
        this.nameExtractor = new NameExtractor(this.dataManager.getProvinces());

        // 只创建树解析器实例
        this.treeParser = new TreeParser(
            this.dataManager.getProvinces(),
            this.dataManager.getCities(),
            this.dataManager.getAreas(),
            this.logger
        );
    }

    /**
     * 解析地址
     * @param {string} address - 待解析的地址
     * @param {Object} options - 解析选项
     * @returns {Object} - 解析结果
     */
    parse(address, options = {}) {
        const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

        if (mergedOptions.debug) {
            this.logger.enable();
            this.logger.info(`开始解析地址: ${address}`);
            this.logger.info(`解析选项:`, mergedOptions);
        }

        // 合并自定义关键字到配置中（一次性合并）
        mergedOptions.mergedAddressCleanKeywords = getMergedAddressCleanKeywords(mergedOptions.customAddressCleanRegexs);
        mergedOptions.mergedNameTitles = getMergedNameTitles(mergedOptions.customNameTitles);

        // 使用合并后的清洗关键字清洗地址
        let cleanedAddress = this._cleanAddressWithCustomKeywords(address, mergedOptions.textFilter, mergedOptions.mergedAddressCleanKeywords);
        this.logger.info(`清理后地址: ${cleanedAddress}`);

        // 提取电话号码
        const phoneResult = this.phoneExtractor.extract(cleanedAddress);
        cleanedAddress = phoneResult.address;
        this.logger.info(`提取电话后: ${cleanedAddress}`);

        // 提取邮政编码
        const postalCodeResult = this.postalCodeExtractor.extract(cleanedAddress);
        cleanedAddress = postalCodeResult.address;
        this.logger.info(`提取邮编后: ${cleanedAddress}`);

        // 分割地址
        let splitAddress = String(cleanedAddress || '').split(' ').filter(item => item).map(item => item.trim());

        // 检查第一个是否是姓名
        let name = '';
        if (splitAddress.length > 0 && !absolutelyNotName(splitAddress[0], this.dataManager.getProvinces())) {
            name = splitAddress[0];
            splitAddress.splice(0, 1);
        }

        // 初始化解析结果对象
        const parseResult = {
            province: [],
            city: [],
            area: [],
            detail: []
        };

        // 解析省市区和详细地址
        this._parseRegions(splitAddress, parseResult, mergedOptions);

        // 如果前面没有提取到姓名，从详细地址中提取
        if (!name && parseResult.detail.length > 0) {
            // 只剩最后一个字符串了,姓名应该是在详细地址里面
            if (parseResult.detail.length === 1 && parseResult.detail[0].length > mergedOptions.nameMaxLength) {
                const addressDetail = parseResult.detail[0];
                // 从detail里面找
                const extractedName = this.nameExtractor.getNameFromString(addressDetail, mergedOptions.nameMaxLength || 5);
                // 如果找到了,就从字符串里面删除
                if (extractedName) {
                    name = extractedName;
                    parseResult.detail[0] = addressDetail.replace(new RegExp(extractedName), '');
                }
            } else if (parseResult.detail.length > 1) {
                const extractedName = this.nameExtractor.extractFromDetail(parseResult.detail, mergedOptions.nameMaxLength || 5);
                if (extractedName) {
                    name = extractedName;
                    // 从详细地址中移除姓名
                    const nameIndex = parseResult.detail.findIndex(item => item === extractedName);
                    if (nameIndex !== -1) {
                        parseResult.detail.splice(nameIndex, 1);
                    }
                }
            }
        }

        const nameResult = { name };

        // 组装最终结果
        const result = this._buildResult(parseResult, phoneResult, postalCodeResult, nameResult, mergedOptions);

        this.logger.info(`最终解析结果:`, result);
        return result;
    }

    /**
     * 构建解析结果
     * @param {Object} parseResult - 地址解析结果
     * @param {Object} phoneResult - 电话提取结果
     * @param {Object} postalCodeResult - 邮编提取结果
     * @param {Object} nameResult - 姓名提取结果
     * @returns {Object} 最终结果
     * @private
     */
    _buildResult(parseResult, phoneResult, postalCodeResult, nameResult, config = {}) {
        const province = parseResult.province[0];
        const city = parseResult.city[0];
        const area = parseResult.area[0];

        let provinceName = province ? province.name : '';
        let cityName = city ? city.name : '';
        let countyName = area ? area.name : '';

        // 清洗detail数组
        let detail = parseResult.detail;
        detail = Array.from(new Set(detail));
        detail = cleanUselessWords(detail, provinceName, config.mergedAddressCleanKeywords);

        // 将detail数组合并为地址字符串
        const address = detail.join('').trim();

        // 重写城市名称规则
        for (const [oldName, newName] of Object.entries(MINIAPP_REWRITE_CITY_NAMES)) {
            if (cityName === oldName) {
                cityName = newName;
                break;
            }
        }

        const result = {
            name: nameResult.name || '',
            telNumber: phoneResult.telNumber || '',
            provinceName: provinceName || '',
            cityName: cityName || '',
            subCityDivisionName: countyName || '',
            address: address || '',
            postalCode: postalCodeResult.postalCode || ''
        };

        // 不带编码版本不包含编码字段

        return result;
    }

    /**
     * 解析省市区
     * @param {Array} splitAddress - 分割后的地址数组
     * @param {Object} parseResult - 解析结果对象
     * @param {Object} config - 解析配置
     * @private
     */
    _parseRegions(splitAddress, parseResult, config) {
        splitAddress.forEach(item => {
            if (!parseResult.province[0] || !parseResult.city[0] || !parseResult.area[0]) {
                // 使用TreeParser解析
                const parseRegionResult = this.treeParser.parse(item, parseResult);
                // 只更新没有值的字段，保持已解析的结果
                if (!parseResult.province[0] && parseRegionResult.province.length > 0) {
                    parseResult.province = parseRegionResult.province;
                }
                if (!parseResult.city[0] && parseRegionResult.city.length > 0) {
                    parseResult.city = parseRegionResult.city;
                }
                if (!parseResult.area[0] && parseRegionResult.area.length > 0) {
                    parseResult.area = parseRegionResult.area;
                }
                parseResult.detail = parseResult.detail.concat(parseRegionResult.detail || []);
            } else {
                // 省市区都已解析，剩余部分加入detail
                parseResult.detail.push(item);
            }
        });
    }

    /**
     * 使用自定义关键字清洗地址
     * @private
     */
    _cleanAddressWithCustomKeywords(address, textFilter = [], mergedAddressCleanKeywords = []) {
        if (!address) return '';

        // 去除换行等空白字符
        address = address
            .replace(/\r\n/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\t/g, ' ');

        // 清洗预定义关键字和自定义关键字
        const allFilters = [...mergedAddressCleanKeywords, ...textFilter];
        allFilters.forEach(filter => {
            address = address.replace(new RegExp(filter, 'g'), ' ');
        });

        // 去除特殊字符
        address = address.replace(/[^\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u0020-\u007e\u00a0-\u00be\u2e80-\ua4cf\uf900-\ufaff\ufe30-\ufe4f\ufe10-\ufe19\ufe30-\ufe6f\u2013\u2014\u2018\u2019\u201c\u201d\u2026\u3001\u3002\u300a\u300b\u300e\u300f\u3010\u3011\uff01\uff02\uff03\uff04\uff05\uff06\uff07\uff08\uff09\uff0a\uff0b\uff0c\uff0d\uff0e\uff0f\uff1a\uff1b\uff1c\uff1d\uff1e\uff1f\uff20\uff3b\uff3c\uff3d\uff3e\uff3f\uff40\uff5b\uff5c\uff5d\uff5e\uff5f\uff60\uffe0-\uffe6]/g, ' ');

        // 多个空格替换为一个
        address = address.replace(/ {2,}/g, ' ');

        return address.trim();
    }
}

export default AddressParserNoCode;
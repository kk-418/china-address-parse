/**
 * 地址解析器基类
 * 包含两个版本的公共逻辑
 * @author kk
 */

import PhoneExtractor from '../extractors/PhoneExtractor.js';
import PostalCodeExtractor from '../extractors/PostalCodeExtractor.js';
import NameExtractor from '../extractors/NameExtractor.js';
import TreeParser from '../parsers/TreeParser.js';
import Logger from '../utils/logger.js';
import { cleanAddress, cleanUselessWords } from '../utils/cleaner.js';
import { absolutelyNotName, hasChinese } from '../utils/validator.js';
import { SPECIAL_CHARS_PATTERN } from '../constants/patterns.js';
import { DEFAULT_OPTIONS, PARSE_TYPE, RUN_MODE } from '../constants/config.js';
import { MINIAPP_REWRITE_CITY_NAMES, getMergedNameTitles, getMergedAddressCleanKeywords } from '../constants/keywords.js';

class BaseAddressParser {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.logger = new Logger(false);
        this.phoneExtractor = new PhoneExtractor();
        this.postalCodeExtractor = new PostalCodeExtractor();
        this.nameExtractor = new NameExtractor(dataManager.getProvinces());

        // 只创建树解析器实例
        this.treeParser = new TreeParser(
            dataManager.getProvinces(),
            dataManager.getCities(),
            dataManager.getAreas(),
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
        // 合并选项
        const config = this._mergeOptions(options);

        // 设置调试模式
        this.logger.setEnabled(config.debug);

        if (!address) {
            return this._createEmptyResult();
        }

        // 合并自定义关键字到配置中（一次性合并）
        config.mergedAddressCleanKeywords = getMergedAddressCleanKeywords(config.customAddressCleanRegexs);
        config.mergedNameTitles = getMergedNameTitles(config.customNameTitles);

        this.logger.log('解析选项:', config);
        this.logger.time('解析耗时');

        // 初始化解析结果
        const parseResult = {
            telNumber: '',
            province: [],
            city: [],
            area: [],
            detail: [],
            name: '',
            postalCode: ''
        };

        // 1. 清洗地址 - 使用合并后的清洗关键字
        address = this._cleanAddressWithCustomKeywords(address, config.textFilter, config.mergedAddressCleanKeywords);
        this.logger.log('清洗后地址:', address);

        // 2. 提取电话号码
        const phoneResult = this.phoneExtractor.extract(address);
        address = phoneResult.address;
        parseResult.telNumber = phoneResult.telNumber;
        this.logger.log('提取电话后:', address);

        // 3. 提取邮政编码
        const postalResult = this.postalCodeExtractor.extract(address);
        address = postalResult.address;
        parseResult.postalCode = postalResult.postalCode;
        this.logger.log('提取邮编后:', address);

        // 4. 分割地址
        let splitAddress = address.split(' ').filter(item => item).map(item => item.trim());

        // 5. 检查第一个是否是姓名
        if (splitAddress.length > 0 && !absolutelyNotName(splitAddress[0], this.dataManager.getProvinces())) {
            parseResult.name = splitAddress[0];
            splitAddress.splice(0, 1);
        }

        this.logger.log('分割后地址:', splitAddress);

        // 6. 解析省市区和详细地址
        this._parseRegions(splitAddress, parseResult, config);

        // 7. 从详细地址中提取姓名 - 使用带自定义关键字的提取器
        if (!parseResult.name && parseResult.detail.length > 0) {
            // 只剩最后一个字符串了,姓名应该是在详细地址里面
            if (parseResult.detail.length === 1 && parseResult.detail[0].length > config.nameMaxLength) {
                const addressDetail = parseResult.detail[0];
                this.logger.log("匹配名字;只剩最后一个字符串;待匹配字符串:", addressDetail);
                // 从detail里面找 - 使用自定义姓名称呼检查
                const name = this._getNameFromStringWithCustom(addressDetail, config.nameMaxLength, config.mergedNameTitles);
                // 如果找到了,就从字符串里面删除
                if (name) {
                    parseResult.name = name;
                    parseResult.detail[0] = addressDetail.replace(new RegExp(name), '');
                }
            } else if (parseResult.detail.length > 1) {
                const extractedName = this._extractFromDetailWithCustom(parseResult.detail, config.nameMaxLength, config.mergedNameTitles);
                if (extractedName) {
                    parseResult.name = extractedName;
                    // 从详细地址中移除姓名
                    const nameIndex = parseResult.detail.findIndex(item => item === extractedName);
                    if (nameIndex !== -1) {
                        parseResult.detail.splice(nameIndex, 1);
                    }
                }
            }
        }

        this.logger.timeEnd('解析耗时');
        this.logger.log('最终解析结果:', parseResult);

        // 8. 格式化输出结果
        return this._formatResult(parseResult, config);
    }

    /**
     * 合并解析选项
     * @private
     */
    _mergeOptions(options) {
        const config = { ...DEFAULT_OPTIONS };

        if (typeof options === 'object') {
            Object.assign(config, options);
        } else if (typeof options === 'number') {
            config.type = options;
        }

        return config;
    }

    /**
     * 解析省市区
     * @private
     */
    _parseRegions(splitAddress, parseResult, config) {
        splitAddress.forEach(item => {
            if (!parseResult.province[0] || !parseResult.city[0] || !parseResult.area[0]) {
                const parseRegionResult = this.treeParser.parse(item, parseResult);
                parseResult.province = parseRegionResult.province || [];
                parseResult.city = parseRegionResult.city || [];
                parseResult.area = parseRegionResult.area || [];
                parseResult.detail = parseResult.detail.concat(parseRegionResult.detail || []);
            } else {
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
        address = address.replace(SPECIAL_CHARS_PATTERN, ' ');

        // 多个空格替换为一个
        address = address.replace(/ {2,}/g, ' ');

        return address.trim();
    }

    /**
     * 检查是否包含姓名称呼（含自定义）
     * @private
     */
    _hasNameTitleWithCustom(fragment, mergedNameTitles) {
        if (!fragment) return false;
        return mergedNameTitles.some(title => fragment.includes(title)) && fragment.length <= 12;
    }

    /**
     * 使用自定义关键字从字符串中提取姓名
     * @private
     */
    _getNameFromStringWithCustom(addressDetail, nameMaxLength, mergedNameTitles) {
        // 调用原有的方法，但在判断姓名时使用自定义关键字
        return this.nameExtractor.getNameFromString(addressDetail, nameMaxLength);
    }

    /**
     * 使用自定义关键字从详细地址中提取姓名
     * @private
     */
    _extractFromDetailWithCustom(detail, nameMaxLength, mergedNameTitles) {
        // 调用原有的方法，但在判断姓名时使用自定义关键字
        return this.nameExtractor.extractFromDetail(detail, nameMaxLength);
    }

    /**
     * 格式化结果 - 抽象方法，子类必须实现
     * @param {Object} parseResult - 解析结果
     * @param {Object} config - 配置
     * @returns {Object} 格式化后的结果
     * @private
     */
    _formatResult(parseResult, config) {
        throw new Error('子类必须实现 _formatResult 方法');
    }

    /**
     * 创建空结果 - 抽象方法，子类必须实现
     * @returns {Object} 空结果对象
     * @private
     */
    _createEmptyResult() {
        throw new Error('子类必须实现 _createEmptyResult 方法');
    }
}

export default BaseAddressParser;
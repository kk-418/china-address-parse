/**
 * 核心地址解析器
 * @author kk
 */

import DataManager from './DataManager.js';
import PhoneExtractor from '../extractors/PhoneExtractor.js';
import PostalCodeExtractor from '../extractors/PostalCodeExtractor.js';
import NameExtractor from '../extractors/NameExtractor.js';
import RegexpParser from '../parsers/RegexpParser.js';
import TreeParser from '../parsers/TreeParser.js';
import Logger from '../utils/logger.js';
import { cleanAddress, cleanUselessWords } from '../utils/cleaner.js';
import { absolutelyNotName, hasChinese } from '../utils/validator.js';
import { DEFAULT_OPTIONS, PARSE_TYPE, RUN_MODE, DATA_SOURCE } from '../constants/config.js';
import { MINIAPP_REWRITE_CITY_NAMES } from '../constants/keywords.js';

class AddressParser {
    constructor(dataSource = DATA_SOURCE.DEFAULT, includeCode = false) {
        this.dataManager = new DataManager(dataSource, includeCode);
        this.logger = new Logger(false);
        this.phoneExtractor = new PhoneExtractor();
        this.postalCodeExtractor = new PostalCodeExtractor();
        this.nameExtractor = new NameExtractor(this.dataManager.getProvinces());
        this._dataSource = dataSource;
        this._includeCode = includeCode;

        // 创建解析器实例
        this.regexpParser = new RegexpParser(
            this.dataManager.getProvinces(),
            this.dataManager.getCities(),
            this.dataManager.getAreas(),
            this.logger
        );

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
        // 合并选项
        const config = this._mergeOptions(options);

        // 设置调试模式
        this.logger.setEnabled(config.debug);

        if (!address) {
            return this._createEmptyResult();
        }

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

        // 1. 清洗地址
        address = cleanAddress(address, config.textFilter);
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

        // 7. 从详细地址中提取姓名
        if (!parseResult.name && parseResult.detail.length > 0) {
            // 只剩最后一个字符串了,姓名应该是在详细地址里面
            if (parseResult.detail.length === 1 && parseResult.detail[0].length > config.nameMaxLength) {
                const addressDetail = parseResult.detail[0];
                this.logger.log("匹配名字;只剩最后一个字符串;待匹配字符串:", addressDetail);
                // 从detail里面找
                const name = this.nameExtractor.getNameFromString(addressDetail, config.nameMaxLength);
                // 如果找到了,就从字符串里面删除
                if (name) {
                    parseResult.name = name;
                    parseResult.detail[0] = addressDetail.replace(new RegExp(name), '');
                }
            } else if (parseResult.detail.length > 1) {
                const extractedName = this.nameExtractor.extractFromDetail(parseResult.detail, config.nameMaxLength);
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
                // 统一使用TreeParser，不再使用RegexpParser
                const parser = this.treeParser;

                const parseRegionResult = parser.parse(item, parseResult);
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
     * 格式化结果
     * @private
     */
    _formatResult(parseResult, config) {
        const province = parseResult.province[0];
        const city = parseResult.city[0];
        const area = parseResult.area[0];

        let provinceName = province ? province.name : '';
        let provinceCode = province ? province.code : '';
        let cityName = city ? city.name : '';
        let cityCode = city ? city.code : '';
        let countyName = area ? area.name : '';
        let countyCode = area ? area.code : '';

        // 清理详细地址
        let detail = parseResult.detail;

        // 移除省市区名称
        if (province || city || area) {
            detail = detail.map(item =>
                item.replace(new RegExp(`${provinceName}|${cityName}|${countyName}`, 'g'), '')
            );
        }

        // 去重和清理
        detail = Array.from(new Set(detail));
        detail = cleanUselessWords(detail, provinceName);

        // 小程序模式处理
        if (config.mode === RUN_MODE.MINIAPP && MINIAPP_REWRITE_CITY_NAMES.includes(cityName)) {
            cityName = provinceName;
        }

        // 构建返回结果
        const result = {
            name: parseResult.name || '',
            telNumber: parseResult.telNumber || '',
            provinceName: provinceName,
            cityName: cityName,
            subCityDivisionName: countyName,
            address: (detail && detail.length > 0 && detail.join('')) || '',
            postalCode: parseResult.postalCode || ''
        };

        // 根据配置决定是否包含编码
        if (config.includeCode || this._includeCode) {
            result.provinceCode = provinceCode;
            result.cityCode = cityCode;
            result.subCityDivisionCode = countyCode;
        }

        return result;
    }

    /**
     * 创建空结果
     * @private
     */
    _createEmptyResult() {
        const result = {
            name: '',
            telNumber: '',
            provinceName: '',
            cityName: '',
            subCityDivisionName: '',
            address: '',
            postalCode: ''
        };

        // 根据配置决定是否包含编码字段
        if (this._includeCode) {
            result.provinceCode = '';
            result.cityCode = '';
            result.subCityDivisionCode = '';
        }

        return result;
    }
}

export default AddressParser;
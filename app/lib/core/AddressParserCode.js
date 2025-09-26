/**
 * 带编码地址解析器
 * 只使用cn-division带编码数据
 * @author kk
 */

import DataManagerCode from './DataManagerCode.js';
import PhoneExtractor from '../extractors/PhoneExtractor.js';
import PostalCodeExtractor from '../extractors/PostalCodeExtractor.js';
import NameExtractor from '../extractors/NameExtractor.js';
import TreeParser from '../parsers/TreeParser.js';
import Logger from '../utils/logger.js';
import { cleanAddress, cleanUselessWords } from '../utils/cleaner.js';
import { absolutelyNotName, hasChinese } from '../utils/validator.js';
import { DEFAULT_OPTIONS, PARSE_TYPE, RUN_MODE } from '../constants/config.js';
import { MINIAPP_REWRITE_CITY_NAMES } from '../constants/keywords.js';

class AddressParserCode {
    constructor(propertyMapping = {}) {
        // 传递属性映射配置给数据管理器
        this.dataManager = new DataManagerCode(propertyMapping);
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

        let cleanedAddress = cleanAddress(address);
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
        } else {
        }

        // 初始化解析结果对象
        const parseResult = {
            province: [],
            city: [],
            area: [],
            detail: []
        };

        // 解析省市区和详细地址
        console.log('[DEBUG] 调用 _parseRegions，splitAddress:', splitAddress);
        this._parseRegions(splitAddress, parseResult, mergedOptions);
        console.log('[DEBUG] _parseRegions 后，parseResult:', parseResult);

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
        const result = this._buildResult(parseResult, phoneResult, postalCodeResult, nameResult);

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
    _buildResult(parseResult, phoneResult, postalCodeResult, nameResult) {
        const province = parseResult.province[0];
        const city = parseResult.city[0];
        const area = parseResult.area[0];

        let provinceName = province ? province.name : '';
        let provinceCode = province ? province.code : '';
        let cityName = city ? city.name : '';
        let cityCode = city ? city.code : '';
        let countyName = area ? area.name : '';
        let countyCode = area ? area.code : '';

        // 将detail数组合并为地址字符串
        const address = parseResult.detail.join('').trim();

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

        // 添加编码信息
        if (provinceCode) {
            result.provinceCode = provinceCode;
        }
        if (cityCode) {
            result.cityCode = cityCode;
        }
        if (countyCode) {
            result.subCityDivisionCode = countyCode;
        }

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
}

export default AddressParserCode;
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
    constructor() {
        this.dataManager = new DataManagerCode();
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
        cleanedAddress = phoneResult.cleanedText;
        this.logger.info(`提取电话后: ${cleanedAddress}`);

        // 提取邮政编码
        const postalCodeResult = this.postalCodeExtractor.extract(cleanedAddress);
        cleanedAddress = postalCodeResult.cleanedText;
        this.logger.info(`提取邮编后: ${cleanedAddress}`);

        // 清理无用词汇
        cleanedAddress = cleanUselessWords(cleanedAddress, mergedOptions.textFilter);
        this.logger.info(`清理无用词后: ${cleanedAddress}`);

        // 只使用树解析器进行解析
        const parseResult = this.treeParser.parse(cleanedAddress, mergedOptions);

        // 提取姓名 - 从剩余的地址部分中提取
        let remainingText = cleanedAddress;
        if (parseResult.province) remainingText = remainingText.replace(parseResult.province, '');
        if (parseResult.city) remainingText = remainingText.replace(parseResult.city, '');
        if (parseResult.area) remainingText = remainingText.replace(parseResult.area, '');
        if (parseResult.detail) remainingText = remainingText.replace(parseResult.detail.join(''), '');

        const nameResult = this.nameExtractor.extract(remainingText, mergedOptions);

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
        const { province, city, area, detail } = parseResult;

        // 查找编码信息
        const provinceInfo = province ? this.dataManager.findProvinceByName ?
            this.dataManager.getProvinces().find(p => p.name === province) :
            this.dataManager.getProvinces().find(p => p.name === province) : null;

        const cityInfo = city ? this.dataManager.getCities().find(c => c.name === city) : null;
        const areaInfo = area ? this.dataManager.getAreas().find(a => a.name === area) : null;

        // 处理城市名称（直辖市特殊处理）
        let cityName = city || '';
        const provinceName = province || '';

        // 重写城市名称规则
        for (const [oldName, newName] of Object.entries(MINIAPP_REWRITE_CITY_NAMES)) {
            if (cityName === oldName) {
                cityName = newName;
                break;
            }
        }

        const result = {
            name: nameResult.name || '',
            telNumber: phoneResult.phoneNumber || '',
            provinceName: provinceName,
            cityName: cityName,
            subCityDivisionName: area || '',
            address: (detail && detail.length > 0 && detail.join('')) || '',
            postalCode: postalCodeResult.postalCode || ''
        };

        // 添加编码信息
        if (provinceInfo && provinceInfo.code) {
            result.provinceCode = provinceInfo.code;
        }
        if (cityInfo && cityInfo.code) {
            result.cityCode = cityInfo.code;
        }
        if (areaInfo && areaInfo.code) {
            result.subCityDivisionCode = areaInfo.code;
        }

        return result;
    }
}

export default AddressParserCode;
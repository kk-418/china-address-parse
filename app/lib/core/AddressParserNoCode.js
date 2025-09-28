/**
 * 不带编码地址解析器
 * 只使用cn-division不带编码数据
 * @author kk
 */

import DataManagerNoCode from './DataManagerNoCode.js';
import BaseAddressParser from './BaseAddressParser.js';
import { cleanUselessWords } from '../utils/cleaner.js';
import { MINIAPP_REWRITE_CITY_NAMES } from '../constants/keywords.js';

class AddressParserNoCode extends BaseAddressParser {
    constructor() {
        const dataManager = new DataManagerNoCode();
        super(dataManager);
    }


    /**
     * 格式化结果
     * @param {Object} parseResult - 解析结果
     * @param {Object} config - 配置
     * @returns {Object} 格式化后的结果
     * @private
     */
    _formatResult(parseResult, config) {
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
            name: parseResult.name || '',
            telNumber: parseResult.telNumber || '',
            provinceName: provinceName || '',
            cityName: cityName || '',
            subCityDivisionName: countyName || '',
            address: address || '',
            postalCode: parseResult.postalCode || ''
        };

        // 不带编码版本不包含编码字段

        return result;
    }

    /**
     * 创建空结果
     * @returns {Object} 空结果对象
     * @private
     */
    _createEmptyResult() {
        return {
            name: '',
            telNumber: '',
            provinceName: '',
            cityName: '',
            subCityDivisionName: '',
            address: '',
            postalCode: ''
        };
    }
}

export default AddressParserNoCode;
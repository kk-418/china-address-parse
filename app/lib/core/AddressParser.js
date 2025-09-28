/**
 * 核心地址解析器
 * @author kk
 */

import DataManagerCode from './DataManagerCode.js';
import BaseAddressParser from './BaseAddressParser.js';
import { cleanUselessWords } from '../utils/cleaner.js';
import { RUN_MODE } from '../constants/config.js';
import { MINIAPP_REWRITE_CITY_NAMES } from '../constants/keywords.js';

class AddressParser extends BaseAddressParser {
    constructor(propertyMapping = {}) {
        // 传递属性映射配置给数据管理器 - 默认使用带编码数据
        const dataManager = new DataManagerCode(propertyMapping);
        super(dataManager);
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
        detail = cleanUselessWords(detail, provinceName, config.mergedAddressCleanKeywords);

        // 小程序模式处理
        if (config.mode === RUN_MODE.MINIAPP && MINIAPP_REWRITE_CITY_NAMES.includes(cityName)) {
            cityName = provinceName;
        }

        // 特殊城市名称映射：省直辖县级行政区划 -> 省直辖县级行政单位
        if (cityName === '省直辖县级行政区划') {
            cityName = '省直辖县级行政单位';
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

        // 默认包含编码（带编码版本）
        result.provinceCode = provinceCode;
        result.cityCode = cityCode;
        result.subCityDivisionCode = countyCode;

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

        // 默认包含编码字段（带编码版本）
        result.provinceCode = '';
        result.cityCode = '';
        result.subCityDivisionCode = '';

        return result;
    }

}

export default AddressParser;
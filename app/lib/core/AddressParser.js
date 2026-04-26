/**
 * 核心地址解析器
 * @author kk
 */

import DataManagerCode from './DataManagerCode.js';
import BaseAddressParser from './BaseAddressParser.js';
import { cleanUselessWords, removeRepeatedRegions } from '../utils/cleaner.js';
import { RUN_MODE } from '../constants/config.js';

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
        const county = parseResult.county[0];

        const provinceName = province ? province.name : '';
        const provinceCode = province ? province.code : '';
        let cityName = city ? city.name : '';
        const cityCode = city ? city.code : '';
        const countyName = county ? county.name : '';
        const countyCode = county ? county.code : '';

        // 清理详细地址 - 使用统一的清理函数
        let detail = removeRepeatedRegions(parseResult.detail, province, city, county);

        // 去重和清理
        detail = Array.from(new Set(detail));
        detail = cleanUselessWords(detail, provinceName, config.mergedAddressCleanKeywords);

        // 特殊城市名称映射：省直辖县级行政区划 -> 省直辖县级行政单位
        if (cityName === '省直辖县级行政区划') {
            cityName = '省直辖县级行政单位';
        }

        // 小程序模式：将"省直辖县级行政单位"重写为"省直辖县级行政区划"
        if (config.mode === RUN_MODE.MINIAPP && cityName === '省直辖县级行政单位') {
            cityName = '省直辖县级行政区划';
        }

        // 构建返回结果
        const result = {
            name: parseResult.name || '',
            telNumber: parseResult.telNumber || '',
            provinceName: provinceName,
            cityName: cityName,
            countyName: countyName,
            address: (detail && detail.length > 0 && detail.join('')) || '',
            postalCode: parseResult.postalCode || ''
        };

        // 默认包含编码（带编码版本）
        result.provinceCode = provinceCode;
        result.cityCode = cityCode;
        result.countyCode = countyCode;

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
            countyName: '',
            address: '',
            postalCode: ''
        };

        // 默认包含编码字段（带编码版本）
        result.provinceCode = '';
        result.cityCode = '';
        result.countyCode = '';

        return result;
    }

}

export default AddressParser;
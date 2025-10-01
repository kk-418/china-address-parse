/**
 * 核心地址解析器
 * @author kk
 */

import DataManagerCode from './DataManagerCode.js';
import BaseAddressParser from './BaseAddressParser.js';
import { cleanUselessWords } from '../utils/cleaner.js';
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

        let provinceName = province ? province.name : '';
        let provinceCode = province ? province.code : '';
        let cityName = city ? city.name : '';
        let cityCode = city ? city.code : '';
        let countyName = county ? county.name : '';
        let countyCode = county ? county.code : '';

        // 清理详细地址
        let detail = parseResult.detail;

        // 移除省市县名称 - 增强版清理逻辑
        if (province || city || county) {
            // 构建所有可能的省市县组合路径
            const repeatedPaths = [];

            // 完整路径组合
            if (provinceName && cityName && countyName) {
                repeatedPaths.push(provinceName + cityName + countyName);
            }
            if (provinceName && cityName) {
                repeatedPaths.push(provinceName + cityName);
            }
            if (cityName && countyName) {
                repeatedPaths.push(cityName + countyName);
            }

            // 单独的省市县名称（只添加长度>=3的，避免误删）
            if (provinceName && provinceName.length >= 3) {
                repeatedPaths.push(provinceName);
            }
            if (cityName && cityName.length >= 3) {
                repeatedPaths.push(cityName);
            }
            if (countyName && countyName.length >= 3) {
                repeatedPaths.push(countyName);
            }

            // 按长度从长到短排序，优先清理较长的重复路径
            repeatedPaths.sort((a, b) => b.length - a.length);

            // 对每个detail项进行清理
            detail = detail.map(item => {
                let cleaned = item;

                // 逐个清理重复路径
                for (const path of repeatedPaths) {
                    if (path && path.length >= 4) {
                        // 转义正则特殊字符
                        const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        // 全局替换
                        cleaned = cleaned.replace(new RegExp(escapedPath, 'g'), '');
                    }
                }

                return cleaned;
            });
        }

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
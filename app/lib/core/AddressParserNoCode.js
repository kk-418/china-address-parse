/**
 * 不带编码地址解析器
 * 只使用cn-division不带编码数据
 * @author kk
 */

import DataManagerNoCode from './DataManagerNoCode.js';
import BaseAddressParser from './BaseAddressParser.js';
import { cleanUselessWords } from '../utils/cleaner.js';
import { RUN_MODE } from '../constants/config.js';

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
        const county = parseResult.county[0];

        let provinceName = province ? province.name : '';
        let cityName = city ? city.name : '';
        let countyName = county ? county.name : '';

        // 清洗detail数组
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

        // 去重和清理无用词
        detail = Array.from(new Set(detail));
        detail = cleanUselessWords(detail, provinceName, config.mergedAddressCleanKeywords);

        // 将detail数组合并为地址字符串
        const address = detail.join('').trim();

        // 特殊城市名称映射：省直辖县级行政区划 -> 省直辖县级行政单位
        if (cityName === '省直辖县级行政区划') {
            cityName = '省直辖县级行政单位';
        }

        // 小程序模式：将"省直辖县级行政单位"重写为"省直辖县级行政区划"
        if (config.mode === RUN_MODE.MINIAPP && cityName === '省直辖县级行政单位') {
            cityName = '省直辖县级行政区划';
        }

        const result = {
            name: parseResult.name || '',
            telNumber: parseResult.telNumber || '',
            provinceName: provinceName || '',
            cityName: cityName || '',
            countyName: countyName || '',
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
            countyName: '',
            address: '',
            postalCode: ''
        };
    }
}

export default AddressParserNoCode;
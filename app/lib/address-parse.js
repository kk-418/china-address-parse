import AddressParser from './core/AddressParser.js';
import { DATA_SOURCE } from './constants/config.js';

// 使用 Map 缓存解析器实例
const parserCache = new Map();

/**
 * 生成缓存键
 * @private
 */
function getCacheKey(dataSource, includeCode) {
    return `${dataSource}_${includeCode}`;
}

const AddressParse = (address, options = {}) => {
    // 检查是否需要重新创建解析器
    const dataSource = options.dataSource || DATA_SOURCE.DEFAULT;
    const includeCode = options.includeCode || false;

    const cacheKey = getCacheKey(dataSource, includeCode);

    // 从缓存中获取或创建新的解析器
    if (!parserCache.has(cacheKey)) {
        parserCache.set(cacheKey, new AddressParser(dataSource, includeCode));
    }

    return parserCache.get(cacheKey).parse(address, options);
};

// 导出数据源常量供用户使用
AddressParse.DATA_SOURCE = DATA_SOURCE;

// 提供创建特定配置解析器的工厂方法
AddressParse.createParser = (dataSource, includeCode) => {
    return new AddressParser(dataSource, includeCode);
};

export default AddressParse;

import AddressParser from './core/AddressParser.js';
import { DATA_SOURCE } from './constants/config.js';

let globalParser = null;
let currentDataSource = DATA_SOURCE.DEFAULT;
let currentIncludeCode = false;

const AddressParse = (address, options = {}) => {
    // 检查是否需要重新创建解析器
    const dataSource = options.dataSource || DATA_SOURCE.DEFAULT;
    const includeCode = options.includeCode || false;

    if (!globalParser ||
        currentDataSource !== dataSource ||
        currentIncludeCode !== includeCode) {
        globalParser = new AddressParser(dataSource, includeCode);
        currentDataSource = dataSource;
        currentIncludeCode = includeCode;
    }

    return globalParser.parse(address, options);
};

// 导出数据源常量供用户使用
AddressParse.DATA_SOURCE = DATA_SOURCE;

// 提供创建特定配置解析器的工厂方法
AddressParse.createParser = (dataSource, includeCode) => {
    return new AddressParser(dataSource, includeCode);
};

export default AddressParse;

import AddressParserNoCode from './core/AddressParserNoCode.js';
import { DATA_SOURCE } from './constants/config.js';

let globalParser = null;

const AddressParse = (address, options = {}) => {
    // 不带编码版本使用不带编码解析器
    if (!globalParser) {
        globalParser = new AddressParserNoCode();
    }

    return globalParser.parse(address, options);
};

// 导出数据源常量供用户使用
AddressParse.DATA_SOURCE = DATA_SOURCE;

// 提供创建特定配置解析器的工厂方法
AddressParse.createParser = (dataSource = DATA_SOURCE.CN_DIVISION_NOCODE, includeCode = false) => {
    return new AddressParserNoCode();
};

export default AddressParse;
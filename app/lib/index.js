import AddressParserCode from './core/AddressParserCode.js';
import { DATA_SOURCE } from './constants/config.js';

let globalParser = null;

const AddressParse = (address, options = {}) => {
    // 默认版本使用带编码解析器
    if (!globalParser) {
        globalParser = new AddressParserCode();
    }

    return globalParser.parse(address, options);
};

// 导出数据源常量供用户使用
AddressParse.DATA_SOURCE = DATA_SOURCE;

// 提供创建特定配置解析器的工厂方法
AddressParse.createParser = (dataSource = DATA_SOURCE.CN_DIVISION_CODE, includeCode = true) => {
    return new AddressParserCode();
};

export default AddressParse;
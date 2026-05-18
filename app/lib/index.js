import AddressParser from './core/AddressParser.js';
import { DATA_SOURCE } from './constants/config.js';
import { DEFAULT_CN_DIVISION_MAPPING, STANDARD_MAPPING } from './constants/propertyMapping.js';
import { detectAreaPrefix, isInstitutionAddress } from './utils/address-prefix.js';
import { INSTITUTION_PATTERN } from './constants/institutionKeywords.js';

let globalParser = null;

const AddressParse = (address, options = {}) => {
    // 默认版本使用带编码解析器
    if (!globalParser) {
        // 如果options中包含propertyMapping，使用它创建新的解析器
        const propertyMapping = options.propertyMapping || {};
        globalParser = new AddressParser(propertyMapping);
    }

    return globalParser.parse(address, options);
};

// 导出数据源常量供用户使用
AddressParse.DATA_SOURCE = DATA_SOURCE;

// 导出属性映射配置常量
AddressParse.PROPERTY_MAPPINGS = {
    CN_DIVISION: DEFAULT_CN_DIVISION_MAPPING,  // cn-division格式 (c/n/ch)
    STANDARD: STANDARD_MAPPING                  // 标准格式 (code/name/children)
};

// 提供创建特定配置解析器的工厂方法
AddressParse.createParser = (propertyMapping = {}) => {
    return new AddressParser(propertyMapping);
};

AddressParse.detectAreaPrefix = detectAreaPrefix;
AddressParse.isInstitutionAddress = isInstitutionAddress;
AddressParse.INSTITUTION_PATTERN = INSTITUTION_PATTERN;

export {
    detectAreaPrefix,
    isInstitutionAddress,
    INSTITUTION_PATTERN
};
export default AddressParse;

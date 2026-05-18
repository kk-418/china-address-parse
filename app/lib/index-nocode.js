import AddressParserNoCode from './core/AddressParserNoCode.js';
import { DATA_SOURCE } from './constants/config.js';
import { detectAreaPrefix as detectAreaPrefixBase, isInstitutionAddress } from './utils/address-prefix.js';
import { INSTITUTION_PATTERN } from './constants/institutionKeywords.js';

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
AddressParse.createParser = (_dataSource = DATA_SOURCE.CN_DIVISION_NOCODE, _includeCode = false) => {
    return new AddressParserNoCode();
};

AddressParse.detectAreaPrefix = (detail, options = {}) => {
    return detectAreaPrefixBase(detail, {
        ...options,
        dataSource: DATA_SOURCE.CN_DIVISION_NOCODE,
        includeCode: false
    });
};
AddressParse.isInstitutionAddress = isInstitutionAddress;
AddressParse.INSTITUTION_PATTERN = INSTITUTION_PATTERN;

export {
    isInstitutionAddress,
    INSTITUTION_PATTERN
};
export const detectAreaPrefix = AddressParse.detectAreaPrefix;
export default AddressParse;

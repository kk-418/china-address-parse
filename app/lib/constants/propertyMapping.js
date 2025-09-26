/**
 * cn-division数据属性名映射配置
 * @author kk
 */

// 默认的cn-division属性名映射
export const DEFAULT_CN_DIVISION_MAPPING = {
    codeKey: 'c',        // 编码字段名
    nameKey: 'n',        // 名称字段名
    childrenKey: 'ch'    // 子节点字段名
};

// 标准属性名映射（用于原始格式）
export const STANDARD_MAPPING = {
    codeKey: 'code',
    nameKey: 'name',
    childrenKey: 'children'
};

/**
 * 获取属性映射配置
 * @param {Object} customMapping - 自定义映射配置
 * @returns {Object} 合并后的映射配置
 */
export function getMappingConfig(customMapping = {}) {
    return {
        ...DEFAULT_CN_DIVISION_MAPPING,
        ...customMapping
    };
}
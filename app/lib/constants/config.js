/**
 * 配置常量
 * @author kk
 */

// 默认配置
export const DEFAULT_OPTIONS = {
    type: 0,                    // 0: 正则匹配, 1: 树查找
    mode: 0,                    // 0: 默认, 1: 小程序模式
    textFilter: [],             // 自定义文本过滤
    nameMaxLength: 5,           // 姓名最大长度
    debug: false,               // 调试模式
    dataSource: 'default',      // 数据源类型
    includeCode: false          // 是否在返回结果中包含编码
};

// 解析类型
export const PARSE_TYPE = {
    REGEXP: 0,
    TREE: 1
};

// 运行模式
export const RUN_MODE = {
    DEFAULT: 0,
    MINIAPP: 1
};

// 数据源类型
export const DATA_SOURCE = {
    DEFAULT: 'default',          // 使用现有area.json
    CN_DIVISION_CODE: 'cn-code', // 使用cn-division带编码版本
    CN_DIVISION_NOCODE: 'cn-nocode' // 使用cn-division不带编码版本
};
/**
 * 正则表达式常量
 * @author kk
 */

// 电话号码正则
export const MOBILE_PATTERN = /(86-?1[3-9][0-9]{9})|(1[3-9][0-9]{9})|(0\d{2,3}-?\d{7,8})|((4|8)00[0-9]{7})/g;
export const PHONE_86_PATTERN = /^86-*/;

// 分机号正则：匹配电话号码后紧跟的 -分机号（3-6位数字）
export const TEL_EXTENSION_PATTERN = /^-(\d{3,6})/;

// 邮政编码正则
export const POSTAL_CODE_PATTERN = /\d{6}/g;

// 省份正则模板
export const PROVINCE_PATTERN_TEMPLATE = (str) =>
    new RegExp(`{"code":[0-9]{2},"name":"${str}[\u4E00-\u9FA5]*?"}`, 'g');

// 城市正则模板
export const CITY_PATTERN_TEMPLATE = (str, provinceCode) =>
    new RegExp(`{"code":[0-9]{4},"name":"${str}[\u4E00-\u9FA5]*?","provinceCode":${provinceCode || '[0-9]{2}'}}`, 'g');

// 县级行政区正则模板
export const COUNTY_PATTERN_TEMPLATE = (str, cityCode, provinceCode) =>
    new RegExp(`{"code":([0-9]{6}|[0-9]{9}),"name":"${str}[\u4E00-\u9FA5]*?","cityCode":${cityCode || '[0-9]{4}'},"provinceCode":${provinceCode || '[0-9]{2}'}}`, 'g');

// 特殊字符正则。+ 不在这里删除，留给详细地址开头记号搬移。
export const SPECIAL_CHARS_PATTERN = /[`~!@#$^&*=|{}':;,.<>/?！￥…—【】'；：""'。，、？☎]/g;

// 可挪到详细地址末尾的记号字符。不含逗号、句号、分号、冒号，那些仍是字段分隔符。
const MARK_CHAR_CLASS = '`~!@#$^&*=+|{}<>/?！￥…—【】\'"？☎';

// 详细地址开头的记号：一个或多个记号字符，后面可以紧跟纯数字。
export const LEADING_MARK_PATTERN = new RegExp('^[' + MARK_CHAR_CLASS + ']+\\d*');

// 文中的「记号字符 + 纯数字」。清洗特殊字符前先占位，避免 #10086 丢掉 #。
export const MARK_WITH_DIGITS_PATTERN = new RegExp('[' + MARK_CHAR_CLASS + ']+\\d+', 'g');

// 括号正则
export const PARENTHESES_PATTERN = /[[\]（） ()]/g;

// 中文正则
export const CHINESE_PATTERN = /[\u4E00-\u9FA5]/;

// 纯字母数字下划线正则
export const ALPHANUMERIC_PATTERN = /^\w+$/;

// 名字带订单信息正则模板
export const NAME_WITH_ORDER_PATTERN_TEMPLATE = (lastName) =>
    new RegExp(`${lastName}[\u4E00-\u9FA5]{0,3}(分机)?[0-9]{1,4}`, 'g');

// 过滤地址的正则
export const ADDRESS_FILTERS_PATTERN = /省|市|区|自治|街|县|镇|乡|村|公寓|[0-9a-zA-Z一二三四五六七八九十]+[栋楼]|号|室|幢|门|座|单元|菜鸟驿站|[小中大]学|学院|便利|大厦|广场|馆|医院|路口|超市|产业园|大道|前台/;

// 无用词组正则
export const USELESS_WORDS_PATTERN = /^(.|注意?|否则|不然)$/g;
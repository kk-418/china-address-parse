const INSTITUTION_KEYWORD_VALUES = [
    '人民医院',
    '中医院',
    '中西医结合医院',
    '妇幼保健院',
    '医院',
    '高级人民法院',
    '中级人民法院',
    '基层人民法院',
    '人民法院',
    '人民检察院',
    '检察院',
    '人民政府',
    '管委会',
    '管理委员会',
    '公安厅',
    '公安局',
    '派出所',
    '交警支队',
    '交警大队',
    '教育厅',
    '教育局',
    '财政厅',
    '财政局',
    '税务局',
    '海关',
    '大学',
    '学院',
    '中学',
    '小学'
];

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createInstitutionPattern(keywords = INSTITUTION_KEYWORD_VALUES) {
    const source = Array.from(new Set(keywords.filter(Boolean)))
        .sort((left, right) => right.length - left.length)
        .map(escapeRegExp)
        .join('|');

    return new RegExp(source);
}

export const INSTITUTION_PATTERN = createInstitutionPattern();

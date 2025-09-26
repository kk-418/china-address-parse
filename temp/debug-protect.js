// 测试保护机制
function _shouldProtectFragment(fragment) {
    if (!fragment) return false;

    // 保护规则：包含教育机构的地址
    const educationPatterns = [
        /[市区县镇乡村街道][^市区县镇乡村街道]*(大学|学院|学校|中学|小学|师范)/,
        /[市区县镇乡村街道][^市区县镇乡村街道]*(医院|银行|酒店|商场|公园|广场|大厦)/
    ];

    // 保护规则：街道社区等地标
    const landmarkPatterns = [
        /^[^省市区县]{2,4}(街道|社区|小区|花园|大厦|广场)/
    ];

    const allPatterns = [...educationPatterns, ...landmarkPatterns];
    return allPatterns.some(pattern => pattern.test(fragment));
}

const testFragments = [
    "上顿渡镇江西省抚州市临川区上顿渡镇老公安局",
    "东郭镇辽宁省盘锦市盘山县东郭镇"
];

testFragments.forEach(fragment => {
    const protected = _shouldProtectFragment(fragment);
    console.log(`片段: ${fragment}`);
    console.log(`是否受保护: ${protected}`);
    console.log();
});
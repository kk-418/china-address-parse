// 测试重复路径构建逻辑
const province = { name: '江西省' };
const city = { name: '抚州市' };
const area = { name: '临川区' };

function _buildAllRepeatedPaths(province, city, area) {
    const paths = [];

    if (province && province.name) {
        if (city && city.name) {
            if (area && area.name) {
                // 完整路径：省+市+区
                paths.push(province.name + city.name + area.name);

                // 省+市
                paths.push(province.name + city.name);

                // 市+区
                paths.push(city.name + area.name);
            } else {
                // 省+市
                paths.push(province.name + city.name);
            }
        }
    } else if (city && city.name && area && area.name) {
        // 市+区
        paths.push(city.name + area.name);
    }

    // 添加单独的省市区名称（用于清理零散重复）
    if (province && province.name && province.name.length >= 3) {
        paths.push(province.name);
    }
    if (city && city.name && city.name.length >= 3) {
        paths.push(city.name);
    }
    if (area && area.name && area.name.length >= 3) {
        paths.push(area.name);
    }

    return paths;
}

const fragment = "上顿渡镇江西省抚州市临川区上顿渡镇老公安局";
const paths = _buildAllRepeatedPaths(province, city, area);

console.log('测试地址片段:', fragment);
console.log('构建的重复路径:', paths);

// 按长度排序
paths.sort((a, b) => b.length - a.length);
console.log('排序后的路径:', paths);

let cleanedFragment = fragment;
for (const path of paths) {
    if (path.length >= 4) {
        if (cleanedFragment.includes(path)) {
            console.log(`找到重复路径: ${path}`);
            cleanedFragment = cleanedFragment.replace(path, '');
            console.log(`清理后: ${cleanedFragment}`);
        }
    }
}

console.log('最终结果:', cleanedFragment);
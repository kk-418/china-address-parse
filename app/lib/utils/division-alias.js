/**
 * 将重庆已撤销/已调整区划改写成现行名称，并生成可展示的 notices。
 */

import {
    BEIBEI_COUNTY_NAME,
    BEIBEI_TO_LIANGJIANG_STREETS,
    CHONGQING_CITY_NAME,
    CHONGQING_PROVINCE_NAME,
    LIANGJIANG_COUNTY_NAME,
    YUBEI_TO_BEIBEI_TOWNS
} from '../constants/divisionAliases.js';

function regionCode(value) {
    if (value == null || value === '') {
        return '';
    }
    return String(value);
}

function isChongqingCode(code) {
    const normalized = regionCode(code);
    return normalized === '50' || normalized.startsWith('50');
}

export function isChongqingRegion(province, city) {
    if (province?.name === CHONGQING_PROVINCE_NAME) {
        return true;
    }
    if (city?.name === CHONGQING_CITY_NAME) {
        return true;
    }
    if (isChongqingCode(province?.code) || isChongqingCode(city?.provinceCode) || isChongqingCode(city?.code)) {
        return true;
    }
    return false;
}

function findChongqingProvince(provinces) {
    return provinces.find(item => item.name === CHONGQING_PROVINCE_NAME || isChongqingCode(item.code)) || null;
}

function findChongqingCity(cities) {
    return cities.find(item => {
        if (item.name !== CHONGQING_CITY_NAME) {
            return false;
        }
        return item.provinceName === CHONGQING_PROVINCE_NAME || isChongqingCode(item.provinceCode) || isChongqingCode(item.code);
    }) || null;
}

function findChongqingCounty(counties, name) {
    return counties.find(item => {
        if (item.name !== name) {
            return false;
        }
        return item.provinceName === CHONGQING_PROVINCE_NAME
            || isChongqingCode(item.provinceCode)
            || regionCode(item.cityCode).startsWith('5001')
            || regionCode(item.code).startsWith('5001');
    }) || null;
}

function haystackOf(countyName, detailText) {
    return `${countyName || ''}${detailText || ''}`;
}

function firstContained(text, names) {
    return names.find(name => text.includes(name)) || '';
}

function stripNames(text, names) {
    if (!text) {
        return '';
    }
    const sorted = [...names].filter(Boolean).sort((a, b) => b.length - a.length);
    let result = text;
    for (const name of sorted) {
        result = result.split(name).join('');
    }
    return result;
}

function stripDetailParts(detailParts, names) {
    if (!Array.isArray(detailParts) || detailParts.length === 0) {
        return [];
    }
    return detailParts
        .map(part => stripNames(part, names))
        .filter(part => part.length > 0);
}

function buildNotice(fromCounty, toCounty, message) {
    return {
        type: 'division-renamed',
        from: {
            province: CHONGQING_PROVINCE_NAME,
            city: CHONGQING_CITY_NAME,
            county: fromCounty
        },
        to: {
            province: CHONGQING_PROVINCE_NAME,
            city: CHONGQING_CITY_NAME,
            county: toCounty
        },
        message,
        autoApplied: true
    };
}

function resolveRewrite(countyName, haystack) {
    const namedJiangbei = countyName === '江北区' || haystack.includes('江北区');
    const namedYubei = countyName === '渝北区' || haystack.includes('渝北区');
    const namedNorthern = countyName === '北部新区' || haystack.includes('北部新区');
    const namedBeibei = countyName === BEIBEI_COUNTY_NAME;
    const hasLiangjiang = haystack.includes(LIANGJIANG_COUNTY_NAME);
    const yubeiTown = firstContained(haystack, YUBEI_TO_BEIBEI_TOWNS);
    const beibeiStreet = firstContained(haystack, BEIBEI_TO_LIANGJIANG_STREETS);

    if (namedYubei && yubeiTown) {
        return {
            fromCounty: '渝北区',
            toCounty: BEIBEI_COUNTY_NAME,
            strip: ['渝北区', LIANGJIANG_COUNTY_NAME],
            message: `原渝北区${yubeiTown}已划归北碚区，请确认`
        };
    }

    if (hasLiangjiang && countyName !== LIANGJIANG_COUNTY_NAME) {
        const fromCounty = namedJiangbei ? '江北区' : namedYubei ? '渝北区' : namedNorthern ? '北部新区' : countyName || LIANGJIANG_COUNTY_NAME;
        if (fromCounty === LIANGJIANG_COUNTY_NAME) {
            return null;
        }
        return {
            fromCounty,
            toCounty: LIANGJIANG_COUNTY_NAME,
            strip: ['江北区', '渝北区', '北部新区', LIANGJIANG_COUNTY_NAME],
            message: fromCounty === '北部新区'
                ? '北部新区已并入两江新区，请确认'
                : `重庆市${fromCounty}已于2025年撤销，已改为两江新区，请确认`
        };
    }

    if (namedJiangbei) {
        return {
            fromCounty: '江北区',
            toCounty: LIANGJIANG_COUNTY_NAME,
            strip: ['江北区', LIANGJIANG_COUNTY_NAME],
            message: '重庆市江北区已于2025年撤销，已改为两江新区，请确认'
        };
    }

    if (namedNorthern) {
        return {
            fromCounty: '北部新区',
            toCounty: LIANGJIANG_COUNTY_NAME,
            strip: ['北部新区', LIANGJIANG_COUNTY_NAME],
            message: '北部新区已并入两江新区，请确认'
        };
    }

    if (namedYubei) {
        return {
            fromCounty: '渝北区',
            toCounty: LIANGJIANG_COUNTY_NAME,
            strip: ['渝北区', LIANGJIANG_COUNTY_NAME],
            message: '重庆市渝北区已撤销，已改为两江新区，请确认'
        };
    }

    if (namedBeibei && beibeiStreet) {
        return {
            fromCounty: BEIBEI_COUNTY_NAME,
            toCounty: LIANGJIANG_COUNTY_NAME,
            strip: [],
            message: `北碚区${beibeiStreet}已划归两江新区，请确认`
        };
    }

    return null;
}

/**
 * 解析完成后改写省市区对象。
 */
export function applyDivisionAliases(parseResult, dataManager) {
    const province = parseResult.province?.[0] || null;
    const city = parseResult.city?.[0] || null;
    const county = parseResult.county?.[0] || null;
    const detailParts = Array.isArray(parseResult.detail) ? parseResult.detail : [];
    const detailText = detailParts.join('');

    if (province && !isChongqingRegion(province, city)) {
        return parseResult;
    }

    const haystack = haystackOf(county?.name, detailText);
    const hasChongqingHint = haystack.includes('重庆') || haystack.includes('两江新区')
        || haystack.includes('渝北区') || haystack.includes('北部新区');

    if (!isChongqingRegion(province, city) && !hasChongqingHint) {
        return parseResult;
    }

    const rewrite = resolveRewrite(county?.name || '', haystack);
    if (!rewrite) {
        return parseResult;
    }

    const provinces = dataManager.getProvinces();
    const cities = dataManager.getCities();
    const counties = dataManager.getCounties();
    const nextProvince = isChongqingRegion(province, city) ? province : findChongqingProvince(provinces);
    const nextCity = city?.name === CHONGQING_CITY_NAME ? city : findChongqingCity(cities);
    const nextCounty = findChongqingCounty(counties, rewrite.toCounty);

    if (!nextProvince || !nextCity || !nextCounty) {
        return parseResult;
    }

    return {
        ...parseResult,
        province: [nextProvince],
        city: [nextCity],
        county: [nextCounty],
        detail: stripDetailParts(detailParts, rewrite.strip),
        notices: [buildNotice(rewrite.fromCounty, rewrite.toCounty, rewrite.message)]
    };
}

/**
 * detectAreaPrefix 结果上应用同一套别名，避免旧区名被当成冲突前缀。
 */
export function applyDivisionAliasToPrefix(result) {
    if (!result || result.province !== CHONGQING_PROVINCE_NAME) {
        return result;
    }

    const remaining = result.remaining || '';
    const haystack = haystackOf(result.county, remaining);
    const rewrite = resolveRewrite(result.county || '', haystack);
    if (!rewrite) {
        return result;
    }

    const stripped = stripNames(remaining, rewrite.strip);
    const consumedLength = remaining.length - stripped.length;
    const matchedRaw = consumedLength > 0
        ? `${result.matchedRaw || ''}${remaining.slice(0, consumedLength)}`
        : result.matchedRaw;

    return {
        ...result,
        city: result.city || CHONGQING_CITY_NAME,
        county: rewrite.toCounty,
        matchedRaw,
        remaining: stripped
    };
}

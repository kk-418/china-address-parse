/**
 * 地址省市区前缀检测
 * @author kk
 */

import DataManagerCode from '../core/DataManagerCode.js';
import DataManagerNoCode from '../core/DataManagerNoCode.js';
import { DATA_SOURCE } from '../constants/config.js';
import { INSTITUTION_PATTERN } from '../constants/institutionKeywords.js';
import { isValidRegionPrefixMatch } from './region-boundary.js';

const AREA_SUFFIXES = [
    '特别行政区',
    '自治区',
    '自治州',
    '自治县',
    '地区',
    '省',
    '市',
    '区',
    '县',
    '盟',
    '旗'
];
const REMAINING_PREFIX_PATTERN = /^[\s,，、:：-]+/;
const LOOKAHEAD = 10;
const MUNICIPALITIES = ['北京市', '天津市', '上海市', '重庆市'];

let codeDataManager = null;
let noCodeDataManager = null;

function getDataManager(dataSource) {
    switch (dataSource) {
    case DATA_SOURCE.CN_DIVISION_CODE:
    case DATA_SOURCE.DEFAULT:
        if (!codeDataManager) {
            codeDataManager = new DataManagerCode();
        }
        return codeDataManager;
    case DATA_SOURCE.CN_DIVISION_NOCODE:
        if (!noCodeDataManager) {
            noCodeDataManager = new DataManagerNoCode();
        }
        return noCodeDataManager;
    default:
        if (!codeDataManager) {
            codeDataManager = new DataManagerCode();
        }
        return codeDataManager;
    }
}

function normalizeDataSource(dataSource) {
    return dataSource || DATA_SOURCE.DEFAULT;
}

function shouldReturnCode(dataSource, includeCode) {
    return includeCode === true || dataSource === DATA_SOURCE.CN_DIVISION_CODE;
}

function mergeExtraData(items, extraItems = []) {
    if (!Array.isArray(extraItems) || extraItems.length === 0) {
        return items;
    }

    return [...items, ...extraItems];
}

function buildAreaTree(options = {}) {
    const dataSource = normalizeDataSource(options.dataSource);
    const dataManager = getDataManager(dataSource);
    const extraGovData = options.extraGovData || {};

    const provinces = mergeExtraData(dataManager.getProvinces(), extraGovData.province);
    const cities = mergeExtraData(dataManager.getCities(), extraGovData.city);
    const counties = mergeExtraData(dataManager.getCounties(), extraGovData.county);
    const includeCode = shouldReturnCode(dataSource, options.includeCode);

    return provinces.map(province => {
        const provinceCities = cities
            .filter(city => isCityInProvince(city, province))
            .map(city => ({
                ...city,
                children: counties.filter(county => isCountyInCity(county, city, province))
            }));

        return {
            ...province,
            children: provinceCities,
            includeCode
        };
    });
}

function isCityInProvince(city, province) {
    if (province.code && city.provinceCode) {
        return String(city.provinceCode) === String(province.code);
    }

    return city.provinceName === province.name;
}

function isCountyInCity(county, city, province) {
    if (city.code && county.cityCode) {
        return String(county.cityCode) === String(city.code);
    }

    return county.cityName === city.name && county.provinceName === province.name;
}

function createNameVariants(name) {
    const variants = [name];
    const shortName = stripAreaSuffix(name);

    if (shortName && shortName !== name) {
        variants.push(shortName);
    }

    return variants;
}

function stripAreaSuffix(name) {
    for (const suffix of AREA_SUFFIXES) {
        if (name.endsWith(suffix) && name.length > suffix.length) {
            return name.slice(0, -suffix.length);
        }
    }

    return name;
}

function findBestMatch(text, pos, nodes) {
    let best = null;

    for (const node of nodes) {
        if (!node.name) {
            continue;
        }

        for (const variant of createNameVariants(node.name)) {
            if (!variant || !text.startsWith(variant, pos)) {
                continue;
            }

            if (!isValidRegionPrefixMatch(text, pos, variant.length, node.name)) {
                continue;
            }

            const matchedRaw = text.slice(pos, pos + variant.length);
            if (!best || matchedRaw.length > best.matchedRaw.length) {
                best = { node, matchedRaw };
            }
        }
    }

    return best;
}

function createResult(matches, normalizedDetail, includeCode) {
    const province = matches.province;
    const city = matches.city;
    const county = matches.county;
    const matchedRaw = normalizedDetail.slice(0, matches.pos);
    const result = {
        province: province ? province.name : undefined,
        city: city ? city.name : undefined,
        county: county ? county.name : undefined,
        matchedRaw,
        remaining: normalizedDetail.slice(matches.pos).replace(REMAINING_PREFIX_PATTERN, '')
    };

    if (includeCode) {
        if (province && province.code) {
            result.provinceCode = String(province.code);
        }
        if (city && city.code) {
            result.cityCode = String(city.code);
        }
        if (county && county.code) {
            result.countyCode = String(county.code);
        }
    }

    return result;
}

function matchFromProvince(detail, provinces) {
    const provinceMatch = findBestMatch(detail, 0, provinces);
    if (!provinceMatch) {
        return null;
    }

    const province = provinceMatch.node;
    let pos = provinceMatch.matchedRaw.length;
    let city = null;
    let county = null;
    const cityMatch = findBestMatch(detail, pos, province.children || []);

    if (cityMatch) {
        city = cityMatch.node;
        pos += cityMatch.matchedRaw.length;
    } else {
        city = inferMunicipalityCity(province);
    }

    if (city) {
        const countyMatch = findBestMatch(detail, pos, city.children || []);
        if (countyMatch) {
            county = countyMatch.node;
            pos += countyMatch.matchedRaw.length;
        }
    }

    return { province, city, county, pos, includeCode: province.includeCode };
}

function matchFromCity(detail, provinces) {
    let best = null;

    for (const province of provinces) {
        const cityMatch = findBestMatch(detail, 0, province.children || []);
        if (!cityMatch) {
            continue;
        }

        if (!best || cityMatch.matchedRaw.length > best.cityRaw.length) {
            best = {
                province,
                city: cityMatch.node,
                cityRaw: cityMatch.matchedRaw
            };
        }
    }

    if (!best) {
        return null;
    }

    let pos = best.cityRaw.length;
    let county = null;
    const countyMatch = findBestMatch(detail, pos, best.city.children || []);

    if (countyMatch) {
        county = countyMatch.node;
        pos += countyMatch.matchedRaw.length;
    }

    return {
        province: best.province,
        city: best.city,
        county,
        pos,
        includeCode: best.province.includeCode
    };
}

function inferMunicipalityCity(province) {
    if (!MUNICIPALITIES.includes(province.name)) {
        return null;
    }

    return (province.children || []).find(city => city.name === province.name) || null;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCustomInstitutionKeyword(nearby, customInstitutionKeywords = []) {
    const validKeywords = customInstitutionKeywords.filter(Boolean);
    if (validKeywords.length === 0) {
        return false;
    }

    return new RegExp(validKeywords.map(escapeRegExp).join('|')).test(nearby);
}

export function detectAreaPrefix(detail, options = {}) {
    if (!detail || typeof detail !== 'string') {
        return null;
    }

    const normalizedDetail = detail.trimStart();
    if (!normalizedDetail) {
        return null;
    }

    const provinces = buildAreaTree(options);
    const matches = matchFromProvince(normalizedDetail, provinces) || matchFromCity(normalizedDetail, provinces);

    if (!matches || !matches.province) {
        return null;
    }

    return createResult(matches, normalizedDetail, matches.includeCode);
}

export function isInstitutionAddress(detail, detected, options = {}) {
    if (!detail || !detected || !detected.matchedRaw) {
        return false;
    }

    const normalizedDetail = detail.trimStart();
    const nearby = normalizedDetail.slice(0, detected.matchedRaw.length + LOOKAHEAD);
    if (INSTITUTION_PATTERN.test(nearby)) {
        return true;
    }

    return hasCustomInstitutionKeyword(
        nearby,
        Array.isArray(options.customInstitutionKeywords) ? options.customInstitutionKeywords : []
    );
}

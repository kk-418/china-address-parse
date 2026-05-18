export = zhAddressParse;

declare function zhAddressParse(address: string, option?: zhAddressParse.OptionType): zhAddressParse.ParseResult;

declare namespace zhAddressParse {
    export type ParseResult = {
        provinceName: string;
        cityName: string;
        countyName: string;
        address: string;
        name: string;
        telNumber: string;
        telExtension: string;
        postalCode: string;
        provinceCode?: string;
        cityCode?: string;
        countyCode?: string;
    }

    export type GovData = {
        code: string;
        provinceCode?: string;
        cityCode?: string;
        name: string;
    }

    export type DataSource = 'default' | 'cn-code' | 'cn-nocode';

    export type DetectAreaPrefixResult = {
        province?: string;
        city?: string;
        county?: string;
        matchedRaw: string;
        remaining: string;
        provinceCode?: string;
        cityCode?: string;
        countyCode?: string;
    }

    export type OptionType = {
        type?: 0 | 1;
        mode?: 0 | 1;
        textFilter?: string[];
        nameMaxLength?: number;
        dataSource?: DataSource;
        includeCode?: boolean;
        debug?: boolean;
        extraGovData?: Partial<Record<'province' | 'city' | 'county', GovData[]>>;
        customNameTitles?: string[];
        customAddressCleanRegexs?: string[];
        telExtensionIn?: 'both' | 'address' | 'name' | 'none';
    }

    export const DATA_SOURCE: {
        DEFAULT: 'default';
        CN_DIVISION_CODE: 'cn-code';
        CN_DIVISION_NOCODE: 'cn-nocode';
    };

    export const ADVANCED_ADDRESS_CLEAN_KEYWORDS: string[];

    export const INSTITUTION_PATTERN: RegExp;

    export function createParser(dataSource?: DataSource, includeCode?: boolean): {
        parse: (address: string, option?: OptionType) => ParseResult;
    };

    export function detectAreaPrefix(
        detail: string,
        options?: Pick<OptionType, 'dataSource' | 'extraGovData' | 'includeCode'>
    ): DetectAreaPrefixResult | null;

    export function isInstitutionAddress(
        detail: string,
        detected: DetectAreaPrefixResult,
        options?: { customInstitutionKeywords?: string[] }
    ): boolean;
}

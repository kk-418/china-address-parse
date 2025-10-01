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
        postalCode: string;
        provinceCode?: number;
        cityCode?: number;
        countyCode?: number;
    }

    export type GovData = {
        code: string;
        provinceCode?: string;
        cityCode?: string;
        name: string;
    }

    export type DataSource = 'default' | 'cn-code' | 'cn-nocode';

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
    }

    export const DATA_SOURCE: {
        DEFAULT: 'default';
        CN_DIVISION_CODE: 'cn-code';
        CN_DIVISION_NOCODE: 'cn-nocode';
    };

    export const ADVANCED_ADDRESS_CLEAN_KEYWORDS: string[];

    export function createParser(dataSource?: DataSource, includeCode?: boolean): {
        parse: (address: string, option?: OptionType) => ParseResult;
    };
}

export interface AddressParseResult {
  provinceName: string;
  cityName: string;
  countyName: string;
  address: string;
  name: string;
  telNumber: string;
  telExtension: string;
  postalCode: string;
}

export interface AddressParseOptions {
  type?: 0 | 1;
  mode?: 0 | 1;
  textFilter?: string[];
  nameMaxLength?: number;
  telExtensionIn?: 'both' | 'address' | 'name' | 'none';
}

export interface DetectAreaPrefixResult {
  province?: string;
  city?: string;
  county?: string;
  matchedRaw: string;
  remaining: string;
}

export interface DetectAreaPrefixOptions {
  extraGovData?: Partial<Record<'province' | 'city' | 'county', Array<{ name: string }>>>;
}

declare function AddressParse(address: string, options?: AddressParseOptions): AddressParseResult;

declare namespace AddressParse {
  const DATA_SOURCE: {
    CN_DIVISION: string;
    CN_DIVISION_NOCODE: string;
  };
  function createParser(): {
    parse(address: string, options?: AddressParseOptions): AddressParseResult;
  };
  const INSTITUTION_PATTERN: RegExp;
  function detectAreaPrefix(detail: string, options?: DetectAreaPrefixOptions): DetectAreaPrefixResult | null;
  function isInstitutionAddress(
    detail: string,
    detected: DetectAreaPrefixResult,
    options?: { customInstitutionKeywords?: string[] }
  ): boolean;
}

export default AddressParse;

export interface AddressParseResult {
  provinceName: string;
  cityName: string;
  countyName: string;
  address: string;
  name: string;
  telNumber: string;
  postalCode: string;
}

export interface AddressParseOptions {
  type?: 0 | 1;
  mode?: 0 | 1;
  textFilter?: string[];
  nameMaxLength?: number;
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
}

export default AddressParse;

import AddressParser from './core/AddressParser.js';

const globalParser = new AddressParser();

const AddressParse = (address, options) => {
    return globalParser.parse(address, options);
};

export default AddressParse;

// 直接测试失败的案例
import { AddressParserCode } from '../app/lib/core/AddressParserCode.js';

const testAddress = '英灵，13311111111，广东省 揭阳市 普宁市    池尾镇池尾街道上寮园53栋298网批 （注：请原包装退货，否则仓库拒收的，感谢您的配合）';

const parser = new AddressParserCode();
const result = parser.parse(testAddress, { debug: true });

console.log('\n=== 最终结果 ===');
console.log('address:', result.address);
console.log('expected: "池尾镇池尾街道上寮园53栋298网批"');
console.log('actual: "' + result.address + '"');
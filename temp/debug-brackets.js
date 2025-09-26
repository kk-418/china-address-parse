import { cleanParentheses } from '../app/lib/utils/cleaner.js';

const testString = '池尾镇池尾街道上寮园53栋298网批 （注：请原包装退货，否则仓库拒收的，感谢您的配合）';
console.log('原始字符串:', testString);
console.log('清理后结果:', cleanParentheses(testString));
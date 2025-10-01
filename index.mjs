/**
 * ESM wrapper for china-address-parse
 * 直接导出UMD构建的版本
 */

// 浏览器环境下，UMD构建会挂载到window对象
// Node环境下使用CommonJS
let zhAddressParse;

if (typeof window !== 'undefined' && window.ZhAddressParse) {
  // 浏览器环境
  zhAddressParse = window.ZhAddressParse;
} else {
  // Node环境 - 使用动态import避免Vite处理
  try {
    const cjsModule = await import('./dist/zh-address-parse.nocode.min.js');
    zhAddressParse = cjsModule.default || cjsModule;
  } catch (e) {
    console.error('Failed to load china-address-parse:', e);
    zhAddressParse = () => ({
      provinceName: '',
      cityName: '',
      countyName: '',
      address: '',
      name: '',
      telNumber: '',
      postalCode: ''
    });
  }
}

export default zhAddressParse;

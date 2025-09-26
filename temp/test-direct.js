// 简单测试，不使用构建版本
const fs = require('fs');
const path = require('path');

// 读取构建后的文件内容
try {
    const libPath = path.join(__dirname, '../dist/zh-address-parse.min.js');
    const content = fs.readFileSync(libPath, 'utf8');

    // 检查文件是否包含基本的函数定义
    console.log('文件大小:', content.length);
    console.log('包含AddressParserCode:', content.includes('AddressParserCode'));
    console.log('包含TreeParser:', content.includes('TreeParser'));
    console.log('包含PhoneExtractor:', content.includes('PhoneExtractor'));

    // 尝试执行构建后的代码
    const vm = require('vm');
    const sandbox = {
        exports: {},
        module: { exports: {} },
        require: require,
        console: console,
        __dirname: __dirname,
        __filename: __filename,
        global: global,
        process: process
    };

    vm.createContext(sandbox);
    vm.runInContext(content, sandbox);

    // 检查导出的函数
    const addressParse = sandbox.module.exports;
    if (typeof addressParse === 'function') {
        console.log('成功加载地址解析函数');

        // 测试解析
        const result = addressParse('北京 北京市 顺义区 胜利街道宜宾南区2-2-401 小程序模式测试 ww 13311111111');
        console.log('解析结果:', JSON.stringify(result, null, 2));
    } else {
        console.log('导出类型:', typeof addressParse);
        console.log('导出内容:', Object.keys(sandbox.module.exports));
    }

} catch (error) {
    console.error('错误:', error.message);
}
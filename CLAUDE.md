# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个中国地址解析库（zh-address-parse），用于解析中国的快递地址，提取省、市、区、详细地址、姓名、电话等信息。

## 核心架构

### 主要文件结构
- `/app/index.js` - 演示页面入口，包含jQuery UI交互逻辑
- `/app/lib/address-parse.js` - 核心地址解析算法
- `/app/lib/data/area.json` - 中国行政区划数据（省市区三级数据）
- `/app/lib/names.json` - 中文姓名数据库
- `/index.js` - NPM包入口，导向构建后的文件
- `/dist/zh-address-parse.min.js` - 构建后的压缩文件

### 解析算法
项目提供两种解析方式：
- `type: 0` - 正则表达式匹配（默认方式）
- `type: 1` - 树查找匹配

核心解析函数返回包含以下字段的对象：
```javascript
{
  province: string,  // 省份
  city: string,      // 城市
  area: string,      // 区县
  detail: string,    // 详细地址
  name: string,      // 姓名
  telNumber: string, // 电话号码
  postalCode: string // 邮政编码
}
```

## 开发命令

### 启动开发服务器
```bash
npm run dev
```
在 http://localhost:8080/ 启动带有热重载的开发服务器

### 构建项目
```bash
npm run build        # 构建演示页面
npm run build-lib    # 构建NPM库文件
```

### 运行测试
```bash
npm test
# 或者
npm run test
```
测试会先运行 `npm run build-lib` 构建库文件，然后使用Jest运行测试用例

### 获取最新数据
```bash
npm run fetch-data
```
从国家统计局网站抓取最新的行政区划数据

## 测试架构

- 测试文件位于 `/app/test/address.test.js`
- 测试数据位于 `/app/test/testData.json`
- 使用Jest测试框架，包含正则表达式和树查找两种方式的测试用例
- 每个测试用例包含输入地址字符串和期望的解析结果

## 构建配置

项目使用Webpack进行构建：
- `webpack.config.js` - 基础配置
- `webpack.config.dev.js` - 开发环境配置
- `webpack.config.build.js` - 生产环境构建（演示页面）
- `webpack.config.build.lib.js` - 库文件构建配置
- `.babelrc` - Babel转译配置，支持ES6+语法

## 数据文件

- `/app/lib/data/area.json` - 完整的中国三级行政区划数据
- `/app/lib/provinces.json`, `/app/lib/cities.json`, `/app/lib/areas.json` - 按层级拆分的数据
- `/app/lib/names.json` - 中文姓名数据库，用于识别地址中的人名

## TypeScript支持

- `index.d.ts` 提供完整的TypeScript类型定义
- 支持泛型和可选参数配置
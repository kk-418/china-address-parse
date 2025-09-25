# cn-division 数据源使用指南

## 概述

本项目现已支持使用 cn-division 作为数据源，提供两种数据格式：
- **带编码版本**：包含行政区划编码，适合需要编码信息的场景
- **不带编码版本**：仅包含名称，打包体积更小，适合不需要编码的场景

## 使用方法

### 1. 基础用法

```javascript
import ZhAddressParse from './dist/zh-address-parse.min.js';

// 默认数据源（原有功能保持不变）
const result1 = ZhAddressParse("北京市朝阳区朝外大街19号华普大厦 张三 13800138000");

// 使用 cn-division 带编码数据源
const result2 = ZhAddressParse("北京市朝阳区朝外大街19号华普大厦 张三 13800138000", {
    dataSource: 'cn-code',
    includeCode: true
});

// 使用 cn-division 不带编码数据源
const result3 = ZhAddressParse("北京市朝阳区朝外大街19号华普大厦 张三 13800138000", {
    dataSource: 'cn-nocode',
    includeCode: false
});
```

### 2. 数据源选项

可用的数据源选项：

```javascript
import { DATA_SOURCE } from './dist/zh-address-parse.min.js';

// 可用选项
console.log(DATA_SOURCE);
// 输出：
// {
//   DEFAULT: 'default',           // 原始数据源
//   CN_DIVISION_CODE: 'cn-code',  // cn-division 带编码
//   CN_DIVISION_NOCODE: 'cn-nocode' // cn-division 不带编码
// }
```

### 3. 返回结果对比

#### 默认数据源
```javascript
{
  "name": "张三",
  "telNumber": "13800138000",
  "provinceName": "北京市",
  "cityName": "市辖区",        // 直辖市显示为"市辖区"
  "subCityDivisionName": "朝阳区",
  "address": "朝外大街19号华普大厦",
  "postalCode": ""
}
```

#### cn-division 带编码
```javascript
{
  "name": "张三",
  "telNumber": "13800138000",
  "provinceName": "北京市",
  "cityName": "北京市",         // 直辖市显示为省名
  "subCityDivisionName": "朝阳区",
  "address": "朝外大街19号华普大厦",
  "postalCode": "",
  "provinceCode": 11,      // 省份编码
  "cityCode": 1101,        // 城市编码
  "subCityDivisionCode": 110105       // 市级以下区划编码
}
```

#### cn-division 不带编码
```javascript
{
  "name": "张三",
  "telNumber": "13800138000",
  "provinceName": "北京市",
  "cityName": "北京市",         // 直辖市显示为省名
  "subCityDivisionName": "朝阳区",
  "address": "朝外大街19号华普大厦",
  "postalCode": ""
  // 无编码字段
}
```

## 配置选项详解

### dataSource
- **类型**: `string`
- **可选值**: `'default'` | `'cn-code'` | `'cn-nocode'`
- **默认值**: `'default'`
- **说明**: 指定使用的数据源

### includeCode
- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否在返回结果中包含行政区划编码（仅在使用带编码数据源时有效）

## 性能和打包体积

| 数据源 | 打包体积 | 编码支持 | 推荐场景 |
|--------|----------|----------|----------|
| default | 原始大小 | 支持 | 保持兼容性 |
| cn-code | 较大 | 支持 | 需要标准行政区划编码 |
| cn-nocode | 较小 | 不支持 | 仅需要名称解析 |

## 注意事项

1. **直辖市处理**: cn-division 数据源中，直辖市的城市名称与省份名称保持一致
2. **数据格式**: cn-division 使用最新的行政区划数据
3. **向前兼容**: 默认数据源保持不变，确保现有代码无需修改
4. **解析算法**: 统一使用TreeParser进行地址解析，提高准确性

## 示例代码

```javascript
// 完整示例
import ZhAddressParse, { DATA_SOURCE } from './dist/zh-address-parse.min.js';

const address = "北京市朝阳区朝外大街19号华普大厦1201室 张三 13800138000";

// 场景1：不需要编码，追求最小体积
const result1 = ZhAddressParse(address, {
    dataSource: DATA_SOURCE.CN_DIVISION_NOCODE
});
console.log('不带编码:', result1);

// 场景2：需要标准行政区划编码
const result2 = ZhAddressParse(address, {
    dataSource: DATA_SOURCE.CN_DIVISION_CODE,
    includeCode: true
});
console.log('带编码:', result2);

// 场景3：保持向后兼容
const result3 = ZhAddressParse(address);
console.log('默认:', result3);
```

## 升级建议

1. **新项目**: 推荐使用 `cn-nocode` 或 `cn-code` 数据源
2. **现有项目**: 可以继续使用默认数据源，确保兼容性
3. **需要编码**: 使用 `cn-code` 数据源并设置 `includeCode: true`
4. **追求体积**: 使用 `cn-nocode` 数据源

通过以上配置，您可以根据具体需求选择最适合的数据源和配置选项。
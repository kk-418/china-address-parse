China's delivery address parse
===========
## New Feature

> v1.1.0 新增 [cn-division](https://www.npmjs.com/package/cn-division) 外部数据源支持，数据来源更可靠，更新更及时。
> v1.1.1 **Breaking change**：`provinceCode`、`cityCode`、`countyCode` 类型由 `number` 改为 `string`（如 `'11'`、`'1101'`、`'110105'`）。
> v1.2.0 升级 `cn-division@2026.0.0`，新增 `nocode` 独立入口（支持 `china-address-parse/nocode`）以减少打包体积，优化多版本构建导出。

## Preview
[Test page](https://ldwonday.github.io/zh-address-parse/)
## Syntax
> AddressParse(address[, [option|0|1]])

option可选参数属性列表

|参数名| 说明       | 类型                                                         | 是否必填 | 默认值 |
|----|----------|------------------------------------------------------------|------|-----|
|type| 解析方式     | Number                                                     | 否    | 0   |
|textFilter| 预过滤字段    | Array                                                      | 否    | []  |
|nameMaxLength| 中文名最大长度  | Number                                                     | 否    | 4   |
|dataSource| 数据源类型    | 'default' \| 'cn-code' \| 'cn-nocode'                       | 否    | 'default' |
|includeCode| 是否返回行政区划编码 | Boolean                                                  | 否    | false |
|extraGovData| 额外的省市县数据 | { city?: GovData[]; county: GovData[]; province: GovData[] } | 否    | -   |

extraGovData 定义如下：

```ts
type GovData = {
    code: string;
    provinceCode?: string;
    cityCode?: string;
    name: string;
}
```

## Usage

### 安装
```sh
npm i china-address-parse cn-division -s
```

### 基础使用
```js
import AddressParse from 'china-address-parse'

// 默认使用内置数据源
const result = AddressParse('北京市朝阳区朝外大街19号华普大厦 张三 13800138000')
// { provinceName: '北京市', cityName: '北京市', countyName: '朝阳区', address: '朝外大街19号华普大厦', name: '张三', telNumber: '13800138000', postalCode: '' }
```

### 使用外部数据源 cn-division（推荐）

cn-division 提供更准确、更及时的行政区划数据。

```js
import AddressParse from 'china-address-parse'

// 使用 cn-division 带编码数据源
const result = AddressParse('北京市朝阳区朝外大街19号华普大厦 张三 13800138000', {
    dataSource: 'cn-code',
    includeCode: true  // 返回行政区划编码
})
// {
//   provinceName: '北京市',
//   cityName: '北京市',
//   countyName: '朝阳区',
//   address: '朝外大街19号华普大厦',
//   name: '张三',
//   telNumber: '13800138000',
//   postalCode: '',
//   provinceCode: '11',
//   cityCode: '1101',
//   countyCode: '110105'
// }

// 使用 cn-division 不带编码数据源（体积更小）
const result2 = AddressParse('your address', {
    dataSource: 'cn-nocode'
})
```

### 使用 nocode 独立入口（体积最小）

如果不需要行政区划编码，可使用 nocode 入口，打包体积更小：

```js
import AddressParse from 'china-address-parse/nocode'

const result = AddressParse('北京市朝阳区朝外大街19号华普大厦 张三 13800138000')
```

### 完整配置示例
```js
import AddressParse from 'china-address-parse'

const options = {
  type: 0, // 解析方式：0-正则，1-树查找
  textFilter: [], // 预清洗的字段
  nameMaxLength: 4, // 中文名最大长度
  dataSource: 'cn-code', // 数据源：'default' | 'cn-code' | 'cn-nocode'
  includeCode: true, // 是否返回行政区划编码
  extraGovData: { // 额外的省市县数据
    city: [{ name: 'name', code: 'code', provinceCode: 'provinceCode' }],
    province: [{ name: 'name', code: 'code' }],
    county: [{ name: 'name', code: 'code', provinceCode: 'provinceCode', cityCode: 'cityCode' }]
  }
}
const parseResult = AddressParse('your address', options)
```
> script引入

```html
<script async defer src="./zh-address-parse.min.js"></script>
<script>
    const parse = () => {
        const onTextAreaBlur = (e) => {
            const address = e.target.value
            const parseResult = window.ZhAddressParse(address, { type: 0, textFilter: ['电話', '電話', '聯系人'] })
            // The parseResult is an object contain { provinceName: '', name: '', cityName: '', countyName: '', address: '', telNumber: '', postalCode: '' }
            console.log(parseResult)
            $('#result').empty();
            $('#result').append(`<ul>${Object.entries(parseResult).map(([k, v]) => `<li>${k}：${v}</li>`).join('')}</ul>`)
        }
        $('#addressContent').bind('input propertychange', onTextAreaBlur)

        $('#addressList li').on('click', (e) => {
            $('#addressContent').val(e.target.innerText)
            $('#addressContent')[0].dispatchEvent(new Event('input'));
        })
    }

    parse()
</script>
```

## Setup
Install dependencies
```sh
$ npm install
```

## Development
Run the local webpack-dev-server with livereload and autocompile on [http://localhost:8080/](http://localhost:8080/)
```sh
$ npm run dev
```
## Deployment
Build the current application
```sh
$ npm run build
```
## Donate
> 您的支持是我前进的动力，更好的支持开源事业！~

<span><img src="./assets/images/wechat.png" width="300" height="300"></span>
<span><img src="./assets/images/alipay.png" width="300" height="300"></span>


## Developed with Open Source Licensed [WebStorm](http://www.jetbrains.com/webstorm/)

<a href="http://www.jetbrains.com/webstorm/" target="_blank">
<img src="http://ww1.sinaimg.cn/large/005yyi5Jjw1elpp6svs2eg30k004i3ye.gif" width="240" />
</a>

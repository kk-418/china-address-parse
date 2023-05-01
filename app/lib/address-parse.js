import zhCnNames from './names.json'
import addressJson from './data/area.json'


const singleWordCities =['县']

// console.log('完整的数据：', addressJson);
const provinces = addressJson.reduce((per, cur) => {
    const {children, ...others} = cur
    return per.concat(others)
}, [])

const cities = addressJson.reduce((per, cur) => {
    return per.concat(cur.children ? cur.children.map(({children, ...others}) => ({
        ...others,
        provinceCode: cur.code
    })) : [])
}, [])

const areas = addressJson.reduce((per, cur) => {
    const provinceCode = cur.code
    return per.concat(cur.children ? cur.children.reduce((p, c) => {
        const cityCode = c.code
        return p.concat(c.children ? c.children.map(({children, ...others}) => ({
            ...others,
            cityCode,
            provinceCode,
        })) : [])
    }, []) : [])
}, [])


const provinceString = JSON.stringify(provinces)
const cityString = JSON.stringify(cities)
const areaString = JSON.stringify(areas)

// console.log(provinces)
// console.log(cities)
//
// console.log(provinces.length + cities.length + areas.length)

/**
 * 需要解析的地址，type是解析的方式，默认是正则匹配
 * @param address
 * @param options?：type： 0:正则，1：树查找, textFilter： 清洗的字段; mode: 0:默认,1:小程序
 * @returns {{}|({area: Array, province: Array, telNumber: string, city: Array, name: string, detail: Array} & {area: (*|string), province: (*|string), city: (*|string), detail: (Array|boolean|string|string)})}
 * @constructor
 */
const AddressParse = (address, options) => {
    const {
        type = 0,
        textFilter = [],
        nameMaxLength = 5,
        mode = 0,
    } = typeof options === 'object' ? options : (typeof options === 'number' ? {type: options} : {})

    if (!address) {
        return {}
    }
    console.log("options:" + JSON.stringify(options))

    const parseResult = {
        telNumber: '',
        province: [],
        city: [],
        area: [],
        detail: [],
        name: '',
    }
    address = cleanAddress(address, textFilter)
    console.log('清洗后address --->', address)

    // 识别电话
    const resultTelNumber = filterTelNumber(address)
    address = resultTelNumber.address
    parseResult.telNumber = resultTelNumber.telNumber
    console.log('获取电话的结果 --->', address)

    // 识别邮编
    const resultCode = filterPostalCode(address)
    address = resultCode.address
    parseResult.postalCode = resultCode.postalCode
    console.log('获取邮编的结果 --->', address)


    // 地址分割，排序
    let splitAddress = address.split(' ').filter(item => item).map(item => item.trim())


    // 看看第一个是不是名字
    if(!absolutelyNotName(splitAddress[0])){
        parseResult.name = splitAddress[0];
        splitAddress.splice(0,1)
    }

    // 这里先不排序了，排序可能出现问题，比如：北京 北京市
    // splitAddress = sortAddress(splitAddress)

    console.log('分割地址 --->', splitAddress)

    const d1 = new Date().getTime()

    // 找省市区和详细地址
    splitAddress.forEach((item, index) => {
        // 识别地址
        if (!parseResult.province[0] || !parseResult.city[0] || !parseResult.area[0]) {
            // 两个方法都可以解析，正则和树查找
            let parse = {}
            type === 1 && (parse = parseRegion(item, parseResult))
            type === 0 && (parse = parseRegionWithRegexp(item, parseResult))
            const {province, city, area, detail} = parse
            parseResult.province = province || []
            parseResult.area = area || []
            parseResult.city = city || []
            parseResult.detail = parseResult.detail.concat(detail || [])
        } else {
            parseResult.detail.push(item)
        }
    })

    console.log('--->', splitAddress)

    const d2 = new Date().getTime()

    console.log('解析耗时--->', d2 - d1)

    const province = parseResult.province[0]
    const city = parseResult.city[0]
    const area = parseResult.area[0]
    let detail = parseResult.detail

    detail = detail.map(item => item.replace(new RegExp(`${province && province.name}|${city && city.name}|${area && area.name}`, 'g'), ''))
    detail = Array.from(new Set(detail))
    console.log('去重后--->', detail)

    // 地址都解析完了，从剩余字符串数组里面找姓名
    if(!parseResult.name && detail){
        // 只剩最后一个字符串了,姓名应该是在详细地址里面
        if(detail.length === 1 && detail[0].length > nameMaxLength){
            const addressDetail = detail[0]
            console.log("匹配名字;只剩最后一个字符串;待匹配字符串:" + addressDetail)
            // 从detail里面找
            const name = getNameFromString(addressDetail, nameMaxLength)
            // 如果找到了,就从字符串里面删除
            if(name) {
                parseResult.name = name
                detail[0] = addressDetail.replace(new RegExp(name),'')
            }
        }else if(detail.length > 1) {
            let name = ''
            const copyDetail = [...detail].filter(item => !!item)
            copyDetail.sort((a, b) => a.length - b.length)
            console.log('copyDetail --->', copyDetail)
            // 排序后从最短的开始找名字，没找到的话就看第一个是不是咯
            const index = copyDetail.findIndex(item => judgeFragmentIsName(item, nameMaxLength))
            if (~index) {
                console.log("匹配到名字:" + index)
                name = copyDetail[index]
                // 没有找到名字的话把第一个带中文的字符串设为姓名
            } else if (copyDetail[0].length <= nameMaxLength && /[\u4E00-\u9FA5]/.test(copyDetail[0])) {
                name = copyDetail[0]
            }
            // 找到了名字就从详细地址里面删除它
            if (name) {
                parseResult.name = name
                detail.splice(detail.findIndex(item => item === name), 1)
            }
        }

    }

    console.log("解析后结果:", JSON.stringify(parseResult))



    const provinceName = province && province.name
    const provinceCode = province && province.code
    let cityName = city && city.name
    const cityCode = city && city.code
    const areaCode = area && area.code
    // 删除掉无用词组
    detail = cleanUselessWords(detail, provinceName)

    console.log("清洗后的detail:", detail)
    // if (~['市辖区', '区', '县', '镇'].indexOf(cityName)) {
    //     cityName = provinceName
    // }
    // 小程序模式
    // 微信小程序的市辖区会重写成市
    if(mode === 1){
        if(['市辖区'].indexOf(cityName) !== -1){
            cityName = provinceName
        }
    }
    return {
        name: parseResult.name || '',
        telNumber: parseResult.telNumber || '',
        provinceName: provinceName || '',
        provinceCode: provinceCode || '',
        cityName: cityName || '',
        cityCode: cityCode || '',
        countyName: (area && area.name) || '',
        countyCode: areaCode || '',
        detailInfo: (detail && detail.length > 0 && detail.join('')) || '',
        postalCode: parseResult.postalCode || ''
    }
}

/**
 * 按照省市区县镇排序
 * @param splitAddress
 * @returns {*[]}
 */
const sortAddress = (splitAddress) => {
    const result = [];
    const getIndex = (str) => {
        return splitAddress.findIndex(item => ~item.indexOf(str))
    }
    ['省','自治区', '市', '区', '县', '街道','镇','村'].forEach(item => {
        let index = getIndex(item)
        if (~index) {
            result.push(splitAddress.splice(index, 1)[0])
        }
    })

    return [...result, ...splitAddress];
}

/**
 * 利用正则表达式解析
 * @param fragment
 * @param hasParseResult
 * @returns {{area: (Array|*|string), province: (Array|*|string), city: (Array|*|string|string), detail: (*|Array)}}
 */
const parseRegionWithRegexp = (fragment, hasParseResult) => {
    console.log('----- 当前使用正则匹配模式 -----')
    let province = hasParseResult.province || [], city = hasParseResult.city || [], area = hasParseResult.area || [],
        detail = []

    let matchStr = ''
    // 开始匹配省
    if (province.length === 0) {
        for (let i = 1; i < fragment.length; i++) {
            const str = fragment.substring(0, i + 1)
            // [\u4E00-\u9FA5] 表示中文, 省的code只有2位
            const regexProvince = new RegExp(`\{\"code\":[0-9]{2},\"name\":\"${str}[\u4E00-\u9FA5]*?\"}`, 'g')
            const matchProvince = provinceString.match(regexProvince)
            if (matchProvince) {
                const provinceObj = JSON.parse(matchProvince[0])
                console.log("匹配到省:"+ JSON.stringify(provinceObj))
                // 找到字符串中与省名称相比的最长匹配字符串
                if (matchProvince.length === 1) {
                    province = []
                    matchStr = str
                    province.push(provinceObj)
                }
            } else {
                break
            }
        }

        if (province[0]) {
            fragment = replaceArea(fragment,matchStr,province[0].name)
        }

    }

    // 开始匹配市
    if (city.length === 0) {
        // 找到市区在字符串中的最长匹配,最短两个字
        for (let i = 1; i < fragment.length; i++) {
            const str = fragment.substring(0, i + 1)
            const regexCity = new RegExp(`\{\"code\":[0-9]{4},\"name\":\"${str}[\u4E00-\u9FA5]*?\",\"provinceCode\":${province[0] ? `${province[0].code}` : '[0-9]{2}'}\}`, 'g')
            const matchCity = cityString.match(regexCity)
            if (matchCity) {
                const cityObj = JSON.parse(matchCity[0])
                if (matchCity.length === 1) {
                    city = []
                    matchStr = str
                    city.push(cityObj)
                }
            } else {
                break
            }
        }
        // 如果匹配到了市, 把市的对应省份加到province里面
        if (city[0]) {
            const {provinceCode} = city[0]
            fragment = replaceArea(fragment, matchStr, city[0].name)
            if (province.length === 0) {
                const regexProvince = new RegExp(`\{\"code\":${provinceCode},\"name\":\"[\u4E00-\u9FA5]+?\"}`, 'g')
                const matchProvince = provinceString.match(regexProvince)
                province.push(JSON.parse(matchProvince[0]))
            }
            // 没有匹配到市,看看是不是单字符市名
        } else {
            for(const singleWordCity of singleWordCities){
                if(fragment.indexOf(singleWordCity) !== 0){
                    continue
                }
                const regexCity = new RegExp(`\{\"code\":[0-9]{4},\"name\":\"${singleWordCity}[\u4E00-\u9FA5]*?\",\"provinceCode\":${province[0] ? `${province[0].code}` : '[0-9]{2}'}\}`, 'g')
                const matchCity = cityString.match(regexCity)
                if (matchCity) {
                    const cityObj = JSON.parse(matchCity[0])
                    if (matchCity.length === 1) {
                        city = []
                        matchStr = singleWordCity
                        city.push(cityObj)
                        fragment = fragment.replace(new RegExp(singleWordCity),'')
                    }
                }
            }
        }
    }

    if (area.length === 0) {
        for (let i = 1; i < fragment.length; i++) {
            const str = fragment.substring(0, i + 1)
            const regexArea = new RegExp(`\{\"code\":([0-9]{6}|[0-9]{9}),\"name\":\"${str}[\u4E00-\u9FA5]*?\",\"cityCode\":${city[0] ? city[0].code : '[0-9]{4}'},\"provinceCode\":${province[0] ? `${province[0].code}` : '[0-9]{2}'}\}`, 'g')
            const matchArea = areaString.match(regexArea)
            if (matchArea) {
                const areaObj = JSON.parse(matchArea[0])
                if (matchArea.length === 1) {
                    area = []
                    matchStr = str
                    area.push(areaObj)
                }
            } else {
                break
            }
        }
        if (area[0]) {
            const {provinceCode, cityCode} = area[0]
            fragment = replaceArea(fragment,matchStr,area[0].name)
            if (province.length === 0) {
                const regexProvince = new RegExp(`\{\"code\":${provinceCode},\"name\":\"[\u4E00-\u9FA5]+?\"}`, 'g')
                const matchProvince = provinceString.match(regexProvince)
                province.push(JSON.parse(matchProvince[0]))
            }
            if (city.length === 0) {
                const regexCity = new RegExp(`\{\"code\":${cityCode},\"name\":\"[\u4E00-\u9FA5]+?\",\"provinceCode\":${provinceCode}\}`, 'g')
                const matchCity = cityString.match(regexCity)
                city.push(JSON.parse(matchCity[0]))
            }
        }
    }


    // 解析完省市区如果还存在地址，则默认为详细地址
    if (fragment.length > 0) {
        detail.push(fragment)
    }

    return {
        province,
        city,
        area,
        detail,
    }
}

/**
 * 利用树向下查找解析
 * @param fragment
 * @param hasParseResult
 * @returns {{area: Array, province: Array, city: Array, detail: Array}}
 */
const parseRegion = (fragment, hasParseResult) => {
    console.log('----- 当前使用树查找模式 -----')
    let province = [], city = [], area = [], detail = []

    if (hasParseResult.province[0]) {
        province = hasParseResult.province
    } else {
        // 从省开始查找
        for (const tempProvince of provinces) {
            const {name} = tempProvince
            let replaceName = ''
            for (let i = name.length; i > 1; i--) {
                const temp = name.substring(0, i)
                // 找到省份信息
                if (fragment.indexOf(temp) === 0) {
                    console.log("省份关键字:" + temp)
                    replaceName = temp
                    break
                }
            }
            if (replaceName) {
                province.push(tempProvince)
                fragment = replaceArea(fragment, name, replaceName)
                console.log("去除省份后:" + fragment)
                break
            }
        }
    }

    console.log("开始查找市;省:" + JSON.stringify(province))
    if (hasParseResult.city[0]) {
        city = hasParseResult.city
    } else {
        // 从市区开始查找
        for (const tempCity of cities) {
            const {name, provinceCode} = tempCity
            const currentProvince = province[0]
            // 有省
            if (currentProvince) {
                if (currentProvince.code === provinceCode) {
                    let replaceName = ''
                    for (let i = name.length; i > 1; i--) {
                        const temp = name.substring(0, i)
                        if (fragment.indexOf(temp) === 0) {
                            console.log("市信息关键字:" + temp)
                            replaceName = temp
                            break
                        }
                    }
                    if (replaceName) {
                        city.push(tempCity)
                        fragment = replaceArea(fragment, replaceName, name)
                        break
                    }
                    // 未找到市信息,看看是不是市为"县"
                    for(const singleWordCity of singleWordCities){
                        if (fragment.indexOf(singleWordCity) === 0) {
                            console.log("市信息关键字:" + singleWordCity)
                            fragment = fragment.replace(new RegExp(singleWordCity),'')
                            break
                        }
                    }
                }
            } else {
                // 没有省，市不可能重名
                console.log("未找到省份信息")
                for (let i = name.length; i > 1; i--) {
                    const replaceName = name.substring(0, i)
                    if (fragment.indexOf(replaceName) === 0) {
                        city.push(tempCity)
                        province.push(provinces.find(item => item.code === provinceCode))
                        fragment = fragment.replace(replaceName, '')
                        break
                    }
                }

                if (city.length > 0) {
                    break
                }
            }
        }
    }
    console.log("匹配区县;开始;匹配字符串" + fragment)
    console.log("匹配区县;查找区县;省:" + JSON.stringify(province) + ",市:" + JSON.stringify(city))
    console.log(fragment)
    // 从区市县开始查找
    for (const tempArea of areas) {
        const {name, provinceCode, cityCode} = tempArea
        const currentProvince = province[0]
        const currentCity = city[0]
        // 有省或者市
        if (currentProvince || currentCity) {
            if ((currentProvince && currentProvince.code === provinceCode)
                || (currentCity && currentCity.code === cityCode)) {
                console.log("匹配区县;有省或者市;currentProvince:" + JSON.stringify(currentProvince) + "currentCity:" + JSON.stringify(currentCity))
                let replaceName = ''
                for (let i = name.length; i > 1; i--) {
                    const temp = name.substring(0, i)
                    if (fragment.indexOf(temp) === 0) {
                        replaceName = temp
                        break
                    }
                }
                if (replaceName) {
                    area.push(tempArea)
                    !currentCity && city.push(cities.find(item => item.code === cityCode))
                    !currentProvince && province.push(provinces.find(item => item.code === provinceCode))
                    fragment = replaceArea(fragment, replaceName, name)
                    break
                }
            }
        } else {
            // 没有省市，区县市有可能重名，这里暂时不处理，因为概率极低，可以根据添加市解决
            for (let i = name.length; i > 1; i--) {
                const replaceName = name.substring(0, i)
                if (fragment.indexOf(replaceName) === 0) {
                    area.push(tempArea)
                    city.push(cities.find(item => item.code === cityCode))
                    province.push(provinces.find(item => item.code === provinceCode))
                    fragment = fragment.replace(replaceName, '')
                    break
                }
            }
            if (area.length > 0) {
                break
            }
        }
    }

    // 解析完省市区如果还存在地址，则默认为详细地址
    if (fragment.length > 0) {
        detail.push(fragment)
    }

    console.log("匹配结果:", province, city, area, detail)
    return {
        province,
        city,
        area,
        detail,
    }
}

/**
 * 判断是否是名字
 * @param fragment
 * @param nameMaxLength 名字的最大长度
 * @returns {string}
 * TODO 字符串为姓名的可能分数排序
 */
const judgeFragmentIsName = (fragment, nameMaxLength) => {
    const cleanedFragment = cleanParentheses(fragment)
    console.log("匹配名字;start;",cleanedFragment)
    // 如果为空
    if (!cleanedFragment) {
        return ''
    }

    const isAbsolutelyNotName = absolutelyNotName(cleanedFragment)
    if (isAbsolutelyNotName) {
        // console.log("匹配名字;filtersMatch:" + filtersMatch)
        return '';
    }


    // 如果包含下列称呼，则认为是名字，可自行添加
    const nameCall = ['先生', '小姐', '女士', '老师', '天猫', '旗舰店', '售后', '退货组']
    if (nameCall.find(item => ~cleanedFragment.indexOf(item)) && cleanedFragment.length <= 12) {
        return cleanedFragment
    }

    // 姓名最大不能超过nameMaxLength + 订单尾号[1234]
    if(cleanedFragment.length > nameMaxLength + 4){
        return ''
    }

    for(const lastNamePair of zhCnNames){
        // 字符串是否以百家姓开头
        if(cleanedFragment.indexOf(lastNamePair[0]) === 0 && !isMutuallyExclusiveNameWord(lastNamePair,cleanedFragment, 0)){
            // 名字带订单信息 regex
            console.log("匹配名字;lastNamePair",lastNamePair)
            const regexNameWithOrder = new RegExp(`${lastNamePair[0]}[\u4E00-\u9FA5]{0,3}(分机)?[0-9]{1,4}`, 'g')
            if(cleanedFragment.length <= nameMaxLength){
                console.log("匹配名字;字符串以百家姓开头:" + cleanedFragment)
                return cleanedFragment;
            // 名字带订单信息
            }else  if(cleanedFragment.length <= nameMaxLength + 6 && cleanedFragment.match(regexNameWithOrder)){
                console.log("匹配名字;字符串以百家姓开头而且有订单信息:" + cleanedFragment)
                return cleanedFragment;
            }
        }
    }
    // 百家姓里面没有找到

    // 判断是否纯字符和数字下划线
    const pureLetterNumberMatch = cleanedFragment.match(new RegExp('^\w+$'))
    if(pureLetterNumberMatch){
        console.log("匹配名字;纯字母和数字下划线:" + cleanedFragment)
        return fragment;
    }
    return ''
}

const absolutelyNotName = (cleanedFragment) => {
    // 包含以下字符判定不是姓名
    const filtersReg = /省|市|区|自治|街|县|镇|乡|村|公寓|[0-9a-zA-Z一二三四五六七八九十]+[栋楼]|号|室|幢|门|座|单元|菜鸟驿站|[小中大]学|学院|便利|大厦|广场|馆|医院|路口|超市|产业园|大道|前台/
    const filtersMatch = filtersReg.exec(cleanedFragment)
    if(filtersMatch){
        return true;
    }
    for (const tempProvince of provinces) {
        const {name} = tempProvince
        if (cleanedFragment.includes(name.substring(0,2))){
            return true
        }
    }
    return false;
}

/**
 * 匹配电话
 * @param address
 * @returns {{address: *, telNumber: string}}
 */
const filterTelNumber = (address) => {
    let telNumber = ''
    // 整理电话格式
    address = address.replace(/(\d{3})-(\d{4})-(\d{4})/g, '$1$2$3')
    address = address.replace(/(\d{3}) (\d{4}) (\d{4})/g, '$1$2$3')
    address = address.replace(/(\d{4}) \d{4} \d{4}/g, '$1$2$3')
    address = address.replace(/(\d{4})/g, '$1')

    const mobileReg = /(86-?1[3-9][0-9]{9})|(1[3-9][0-9]{9})|(0\d{2,3}-?\d{7,8})|((4|8)00[0-9]{7})/g
    const telNumbers = mobileReg.exec(address)
    if (telNumbers) {
        telNumber = telNumbers[0]
        const phone86Regex = new RegExp("^86-*")
        // 去除86开头
        const phone86Match = telNumber.match(phone86Regex)
        console.log("匹配电话,phone86Match:" + phone86Match)
        if(phone86Match){
            telNumber = telNumber.replace(phone86Regex,'')
            console.log("匹配电话,删除86:" + telNumber)
        }
        address = address.replace(telNumbers[0], ' ')
    }
    return {address, telNumber}
}

/**
 * 匹配邮编
 * @param address
 * @returns {{address: *, postalCode: string}}
 */
const filterPostalCode = (address) => {
    let postalCode = ''
    const postalCodeReg = /\d{6}/g
    const code = postalCodeReg.exec(address)
    if (code) {
        postalCode = code[0]
        address = address.replace(code[0], ' ')
    }
    return {address, postalCode}
}

/**
 * 地址清洗
 * @param address 待清洗的字符串
 * @param textFilter 删除的正则表达式
 * @returns {*}
 */
const cleanAddress = (address, textFilter = []) => {
    // 去换行等
    address = address
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\t/g, ' ')

    // 自定义去除关键字，可自行添加
    const search = [
        '请.*拒(收|签)?',
        '(不|拒|勿).*到付件?',
        '到付.*(不|拒)(收|签)',
        '(拒|不|建议).*(百世|极兔|信丰|京东|申通|圆通|中通|韵达|平邮|邮政|EMS|顺丰|到付|平邮|联昊通|丹鸟|安能|宅急送|国通)(快递|物流)?',
        '请?(寄|退)回.*(清单|产品)',
        '仓?库?签收.*处理',
        '感?谢.*配合',
        '建议使用官方推荐',
        '(支持.*)?上门取件(服务)?',
        '(详细|收货|收件|寄件|退货|发货|发件|寄回|售后|取件)?地址',
        '(收件|寄件|联系)?电(话|話)',
        '(手机|收件|寄件)号码',
        '所在地区',
        '联系人',
        '(寄|发|退|收)(回|出|件|货|方|\\：|:)(人|方|地)?\d*',
        '(姓名|名字)',
        '邮编',
        '(如?有赠品|人为损坏|已清洗|优先|安排|退款|订单|编号|旺旺名|您|写上)'
    ].concat(textFilter)
    search.forEach(str => {
        address = address.replace(new RegExp(str, 'g'), ' ')
    })

    // 去除特殊字符串
    const pattern = new RegExp("[`~!@#$^&*=|{}':;,\.<>/?！￥…—【】‘；：”“’。，、？☎]", 'g')
    address = address.replace(pattern, ' ')

    // 多个空格replace为一个
    address = address.replace(/ {2,}/g, ' ')

    return address
}

/**
 * 省市区清洗
 * 去除匹配到的省市区全名和短名
 * @param fragment
 * @param shortName
 * @param fullName
 */
const replaceArea = (fragment, shortName, fullName) => {
    return fragment
        // 从字符串里面去除找到的省/市全名
        .replace(new RegExp(fullName, 'g'), '')
        // 从字符串里面去除第一个找到的关键字
        .replace(new RegExp(shortName + '(省|市|自治区|区|自治州|州)?'), '')
}

/**
 * 地址姓名全都都已经解析完了,去除无用词组和单个字
 *
 * @param words
 * @param provinceName 省份名称
 * @returns {*}
 */
const cleanUselessWords = (words, provinceName) => {
    console.log("删除无用词组;start;"  + words)
    // 去除单个字以及无用词组
    const uselessWords = new RegExp("^(.|注意?|否则|不然)$", 'g')

    words = words.filter(item => {
        const cleanedItem = cleanParentheses(item)
        return cleanedItem.length !== 0 && !cleanedItem.match(uselessWords) && cleanedItem !== provinceName.substring(0,2)
    })
    console.log("删除无用词组;end;detail:"  + words)
    return words;
}

/**
 * 删除括号
 * @param word
 * @returns {*}
 */
const cleanParentheses = (word) => {
    const parenthesesPattern = new RegExp("[\\[\\]（） ()]", 'g')
    return word.replace(parenthesesPattern, '')
}

/**
 * 从字符串里面获取名字
 * @param addressDetail
 * @returns {string}
 */
const getNameFromString = (addressDetail, nameMaxLength) => {

    let lastNameIndexs = []

    for(const lastNamePair of zhCnNames){
        // 找到最短的匹配百家姓的名字
        const lastNameIndex = addressDetail.lastIndexOf(lastNamePair[0]);

        // 百家姓里面找到了
        if(lastNameIndex !== -1){
            // 百家姓与前缀字符不组成词组
            if(isMutuallyExclusiveNameWord(lastNamePair, addressDetail, lastNameIndex)){
                console.log("匹配名字;getNameFromString;lastNamePair:",lastNamePair)
                continue;
            }
            if(judgeFragmentIsName(addressDetail.substring(lastNameIndex, addressDetail.length), nameMaxLength)){
                lastNameIndexs.push(lastNameIndex)
            }
        }
    }

    if(lastNameIndexs.length > 0){
        // 从lastIndex大到小排序
        lastNameIndexs.sort(function(a,b){return b-a})
        // 取最短的返回
        return addressDetail.substring(lastNameIndexs[0], addressDetail.length)
    }
}

/**
 *
 * 判断百家姓里面是否有互斥词组
 * @param lastNamePair
 * @param s
 * @param lastNameIndex
 */
const isMutuallyExclusiveNameWord = (lastNamePair,s,lastNameIndex) => {
    const lastName = lastNamePair[0]
    const mutuallyExclusivePrefixWords = lastNamePair[1]
    // console.log("从字符串里面获取名字;mutuallyExclusivePrefixWords",mutuallyExclusivePrefixWords)
    if( mutuallyExclusivePrefixWords ){
        for(let mutuallyExclusiveWord of mutuallyExclusivePrefixWords){
            mutuallyExclusiveWord += lastName
            // console.log("从字符串里面获取名字;mutuallyExclusivePrefixWords;", s.lastIndexOf(mutuallyExclusiveWord),mutuallyExclusiveWord.length, lastName.length, lastNameIndex)
            if(s.lastIndexOf(mutuallyExclusiveWord) + mutuallyExclusiveWord.length - lastName.length === lastNameIndex){
                return true
            }
        }
    }

    const mutuallyExclusiveSuffixWords = lastNamePair[2]
    // console.log("从字符串里面获取名字;mutuallyExclusiveSuffixWords",mutuallyExclusiveSuffixWords)

    if(mutuallyExclusiveSuffixWords) {
        for(let mutuallyExclusiveWord of mutuallyExclusiveSuffixWords){
            mutuallyExclusiveWord = lastName + mutuallyExclusiveWord
            const mutuallyExclusiveWordIndex = s.lastIndexOf(mutuallyExclusiveWord)
            // console.log("从字符串里面获取名字;mutuallyExclusiveSuffixWords;",mutuallyExclusiveWordIndex ,mutuallyExclusiveWord.length, lastNameIndex)
            if(mutuallyExclusiveWordIndex === lastNameIndex){
                return true
            }
        }
    }

    return false
}

export default AddressParse

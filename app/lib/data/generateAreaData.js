const newestAreaData = require('./newestAreaData.json')
const fs = require("fs");


const cleanArea = (area)=>{
    if(area.children){
        area.children = area.children.map((children)=>{
            return cleanArea(children)
        })
    }
    area.code = area.code/1000000
    delete area["level"]
    delete area["pcode"]
    return area;
}

const areaJson = newestAreaData.map((province) => {
    return  cleanArea(province)

})

const areaString = JSON.stringify(areaJson);
fs.writeFile('./area.json', areaString, err => {
    if (err) {
        return
    }
    //文件写入成功。
})

// console.log(JSON.stringify(cleanArea(newestAreaData)))




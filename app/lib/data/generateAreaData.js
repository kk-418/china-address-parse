const newestAreaData = require('./newestAreaData.json')
const fs = require("fs");


const cleanArea = (area)=>{
    if(area.children){
        area.children = area.children.map((children)=>{
            return cleanArea(children)
        })
    }
    if(area.level <= 4 && area.level >= 3){
        area.code = area.code/Math.pow(1000,5-area.level)
    } else if(area.level < 3){
        area.code = area.code/1000000/Math.pow(100,3-area.level)
    }
    // area.code = area.code/1000
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




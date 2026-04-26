const newestAreaData = require('./newestAreaData.json');
const fs = require('fs');


const cleanRegion = (region) => {
    if(region.children){
        region.children = region.children.map((children) => {
            return cleanRegion(children);
        });
    }
    if(region.level <= 4 && region.level >= 3){
        region.code = region.code/Math.pow(1000,5-region.level);
    } else if(region.level < 3){
        region.code = region.code/1000000/Math.pow(100,3-region.level);
    }
    // region.code = region.code/1000
    delete region['level'];
    delete region['pcode'];
    return region;
};

const areaJson = newestAreaData.map((province) => {
    return  cleanRegion(province);

});

const areaString = JSON.stringify(areaJson);
fs.writeFile('./area.json', areaString, err => {
    if (err) {
        return;
    }
    //文件写入成功。
});

// console.log(JSON.stringify(cleanArea(newestAreaData)))




var fs = require("fs");
var d1 = require("./data/data");
var data=d1.d1;
var newData={
    86:data[86]
};

for(var i in data[86]){
    //省份
    data[86][i].forEach(function (item) {
        //二级
        newData[item.code]=data[item.code];
        for(var j in data[item.code]){
            newData[j]=data[j];
        }
    })
}
fs.writeFile("./data/compress.js", JSON.stringify(newData), function (err) {
    if (err) {
        console.log("写入失败");
    }
});

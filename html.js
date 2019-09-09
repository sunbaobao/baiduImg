var fs = require("fs")
var path = require("path");
var cheerio = require("cheerio");
var root = path.join(__dirname + "/baiduP");
var list = [
    "afd", "bbc", "bcc", "bch", "bcm", "blb", "bos", "cdn", "cds", "dcc", "ddos", "dns", "doc", "drds", "dts", "eip", "et", "gpu",
    "hosteye", "lss", "mat", "mct", "pts", "rds", "sms", "ssl", "vod", "vpc", "waf", "antiporn", "antiterror"
];
readDir(path.join(root));

function readDir(path) {
    fs.readdir(path, function (err, menu) {
        if (err) {
            console.log(err);
        }
        if (!menu)
            return;
        menu.forEach(function (ele) {
            fs.stat(path + "/" + ele, function (err, info) {
                if (info.isDirectory()) {
                    // console.log("dir: "+ele);
                    readDir(path + "/" + ele);
                } else {
                    if (/\.html$/.test(ele)) {
                        myFile(path + "/" + ele);
                    }
                }
            })
        })
    })
}

function myFile(filePath) {
    fs.readFile(filePath, 'utf8', function (err, data) {
        // 读取文件失败/错误
        if (err) {
            throw err;
        }
        console.log("file: " + filePath);
        // console.log(data);
        var $ = cheerio.load(data, {decodeEntities: false});
        $("a").each(function (index, item) {
            var href = item.attribs.href;
            if(!href |/javascript|^http/.test(href)){
                return;
            }
            if (/learningSession|solution\/iot|solution\/marketing|\/apply/.test(href)) {
                item.attribs.href = "https://cloud.baidu.com" + href;
            }
            if (href && !/javascript|^http|^\/solution|^\/partner|^\/\//.test(href)) {
                if (/^\./.test(href)) {
                    href = href.slice(2);
                }
                var res = list.every(function (value) {
                    return href.indexOf(value + ".html") === -1;
                });
                //不在本项目里
                if(/product\/apply/.test(href)){
                    item.attribs.href = "https://cloud.baidu.com" + href;
                }
                if (res) {
                    item.attribs.href = "https://cloud.baidu.com" + href;
                }
            }
        });
        fs.writeFile(filePath, $.html(), function (err) {
            if (err) {
                console.log("写入失败");
            }
        })
    });
}

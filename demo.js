var page = require('webpage').create();
var address = /*[
    "https://cloud.baidu.com/",
    "https://cloud.baidu.com/product/bch.html",
    "https://cloud.baidu.com/product/afd.html",
    "https://cloud.baidu.com/product/bbc.html",
    "https://cloud.baidu.com/product/bcc.html",
    "https://cloud.baidu.com/product/bch.html",
    "https://cloud.baidu.com/product/bcm.html",
    "https://cloud.baidu.com/product/blb.html",
    "https://cloud.baidu.com/product/blb.html",
    "https://cloud.baidu.com/product/bos.html",
    "https://cloud.baidu.com/product/cdn.html",
    "https://cloud.baidu.com/product/cds.html",
    "https://cloud.baidu.com/product/dcc.html",
    "https://cloud.baidu.com/product/ddos.html",
    "https://cloud.baidu.com/product/dns.html",
    "https://cloud.baidu.com/product/doc.html",
    "https://cloud.baidu.com/product/drds.html",
    "https://cloud.baidu.com/product/dts.html",
    "https://cloud.baidu.com/product/dts.html",
    "https://cloud.baidu.com/product/eip.html",
    "https://cloud.baidu.com/product/et.html",
    "https://cloud.baidu.com/product/gup.html",
    "https://cloud.baidu.com/product/hosteye.html",
    "https://cloud.baidu.com/product/hosteye.html",
    "https://cloud.baidu.com/product/iss.html",
    "https://cloud.baidu.com/product/mat.html",
    "https://cloud.baidu.com/product/mct.html",
    "https://cloud.baidu.com/product/pts.html",
    "https://cloud.baidu.com/product/rds.html",
    "https://cloud.baidu.com/product/sms.html",
    "https://cloud.baidu.com/product/sll.html",
    "https://cloud.baidu.com/product/vod.html",
    "https://cloud.baidu.com/product/vpc.html"
]*/    "https://cloud.baidu.com/solution/app.html";
var fs = require('fs');
// var path = require("path");
var mypath = './server.txt';
var stream = '';
var streams;
var files = null;
var K = 1;
var file;
var line = '';
var cate = '';
var url = '';
var dragPath = './server_img.txt';
// var request = require("request");

// page.settings.userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko";
page.onConsoleMessage = function (msg) {
    console.log(msg);
};
page.onResourceReceived = function (response) {
    // console.log('Receive ' + JSON.stringify(response, undefined, 4));
    // var res=JSON.stringify(response, undefined, 4);
    var content = response.contentType;
    // console.log(content);
    if (/image/.test(content)) {
        // console.log(!/bh\.gif|hm\.gif/.test(response.url));
        if (!/bh\.gif|hm\.gif|pv\.gif|^data/.test(response.url)) {
            // console.log("event:" + response.url);
            writeFile(response.url + "\r\n");
        }
    }
};

function start(url) {
    var urlArr = [];
    if (!url) {
        return console.log("url参数为空");
    }
    urlArr = urlArr.concat(url);
    console.log("start");
    /*urlArr.forEach(function (value) {
        console.log(value);
        page.open(value, function (status) {
            if (status === "success") {
                console.log(value + "打开成功");
                var title = page.evaluate(function () {
                    return document.title;
                });
                console.log("value:" + value + ",title:" + title);
            } else {
                console.log(value + "打开失败");
                // phamtom.exit();
            }
        });
        // loadPage(value);
        // page.close();
    })*/
    loadPage(urlArr);
    /* page.open(url, function (status) {
         if (status === 'success') {
             console.log('open success!');
             console.log('==========begin work!=============');
             console.log(1);
             stream += url + "\r\n";
             setTimeout(function () {
                 var src = page.evaluate(function () {
                     // console.log("eva");
                     // title = title.replace('图片','');
                     var cont = '';
                     var imgObj = document.getElementsByTagName("img");
                     for (var obj in imgObj) {
                         if (imgObj[obj].src) {
                             cont += imgObj[obj].src + "\r\n";
                         }
                     }
                     /!* document.querySelectorAll('img').forEach(function (item, index) {
                          cont += item.src;
                      });*!/
                     // var imgUrls = document.querySelectorAll('.pics>li>a>img')[0].src;

                     return cont + '\r\n';
                 });
                 console.log(src);
                 // writeFile(src);
                 // phantom.exit();
             }, 4000);
             /!* fs.write(dragPath, stream, function (err) {
                  if (err) {
                      console.log("写入失败");
                      return err;
                  }
                  console.log("写入成功");
              });*!/
         } else {
             console.log('page open fail!');
             /!* phantom.exit();*!/
         }
         // before();
     });*/
}

function loadPage(url) {
    if (url.length !== 0) {
        console.log(url.length, url[0]);
        setTimeout(function () {
            page.open(url[0], function (status) {
                if (status === "success") {
                    var title = page.evaluate(function () {
                        return document.title;
                    });
                    console.log("value:" + url[0] + ",title:" + title);
                    url.shift();
                    if (url.length > 0) {
                        loadPage(url);
                    } else {
                        console.log("完成");
                        phantom.exit();
                    }

                } else {
                    console.log("打开失败");
                    // phamtom.exit();
                }
            });
        }, 3000);

    } else {
        console.log("完成");
        phantom.exit();
    }


}

/*
function readFile(status) {
    steams = fs.open(mypath, 'r', function (err) {
        if (err) return console.log("openErr");
    });
    before();
}

function before() {
    console.log('=========work in befor===========' + K);
    K++;
    if (!streams.atEnd()) {
        console.log('=========work in befor get Next Line===========');
        line = streams.readLine();
        cate = line.split(',');
        var imgUrl = cate[1].replace('http://product.pconline.com.cn/server/', '');
        var imgs = imgUrl.split('/');
        var imgsUrl = imgs[1].split('.');
        imgsUrl = 'http://product.pconline.com.cn/pdlib/' + imgsUrl[0] + '_picture.html';
        console.log(imgsUrl);
        start(imgsUrl);
    } else {
        console.log('end!!!!!!!!!!!!');
        phantom.exit();
    }

}
*/

/*page.open(address, function (status) {
    readFile(status);
});*/
function writeFile(data) {
    var file1 = fs.open(mypath, 'r');
    var stream1 = file1.read();
    file1.close();
    // console.log("stream1:"+stream1);
    var file2 = fs.open(mypath, 'w');
    file2.write(stream1 + data);
    file2.close();
}

start(address);
/*page.open("https://www.baidu.com/", function (state) {
    if (state === "success") {
        console.log(1);
    }
});*/
/*
writeFile("123123");*/

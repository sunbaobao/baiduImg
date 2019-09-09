var request = require("request");
var i = 0;

setInterval(function () {
    // var url=
    request('http://192.168.2.112/helpList/10250.html', function (error, response, body) {

        // console.log(10000+i,'http://192.168.2.112/helpList/' +(10000+i)+
        //     '.html');
        if (!error && response.statusCode == 200) {
            i++;
            console.log("成功：", i++) // 打印google首页
        }
    })
}, 10);

/*var option={
    url:"http://jishi.woniu.com/9yin/findSellingGoods.do?filterItem=4&_=1522043050606",
    headers: {
        'User-Agent': 'request'
    }
}*/
// var j = request.jar();
// var cookie = request.cookie('Hm_lvt_dafaa407fe79b3a3b06f8755395698be=1502951017; __utma=267994833.368386171.1503621173.1515035218.1517879142.13; __utmz=267994833.1504766760.9.2.utmcsr=baidu|utmccn=(organic)|utmcmd=organic; 1TJ_P_10__MEDIA=1__1505977585447_17-08-01-GN-9YIN-JINGJIA-6; WNAD_uid=eIRjn1qRFCa9n2y2DgUEAg==; 1TJ_P_-1_=1522046166611_1522046166611_jishi.woniu.com; 1TJ_P_-1__MEDIA=1__1504750255500_17-08-01-GN-9YIN-360SEM-2; snailPassport=B843677724B; snailAliase=""; bindingEmail="843677724@qq.com"; mobileAuthed=1; bindingMobile=13435606432; emailAuthed=1; naid=91312871; SSOPrincipal=b843677724b; sso.login.account=b843677724b; tradessid=83E59B19CBEF45C5808492AE5E0C86CA; tradecuid=293A4491AC0FDEF362670509D0BEAB0D; route=54f058b44aad24357e52b231140b99c1; JSESSIONID=368B36BC8CB3102AE85E061347221C32; 1TJ_P_0_=1522046168445_1522046455425_jishi.woniu.com; 1TJ_P_0__MEDIA=1__1508390444045_17-08-01-GN-9YIN-JINGJIA-6; 1TJ_D_=1522046166611_1522046455425_jishi.woniu.com; 1TJ_D__MEDIA=1__1508390444045_17-08-01-GN-9YIN-JINGJIA-6; Hm_lvt_5e7e25ab4d3f582093eaa02db58d288c=1520496586,1520566276,1521598775,1522042983; Hm_lpvt_5e7e25ab4d3f582093eaa02db58d288c=1522046455; WNAD_ud=9F6384782614915AB66C9FBD0204050E');
// var url = 'http://jishi.woniu.com/9yin/findSellingGoods.do?filterItem=4';
// j.setCookie(cookie, url);
// request({url: url, jar: j}, function (err,res,body) {
//     console.log(err,res,body);
//    /* request('http://jishi.woniu.com/9yin/findSellingGoods.do?filterItem=4',function (err, response, body) {
//         if (!err && response.statusCode == 200) {
//             console.log("成功：", i++,body); // 打印google首页
//         }
//     });/!**!/*/
// });
/*
function go() {
    setTimeout(function () {
        console.log("setTimeout");
    }, 0);
    request('https://segmentfault.com/q/1010000008745165', function (error, response, body) {

        // console.log(10000+i,'http://192.168.2.112/helpList/' +(10000+i)+
        //     '.html');
        if (!error && response.statusCode == 200) {
            i++;
            console.log("成功：", i++); // 打印google首页
            /!*go();*!/
        }
    });

}

go();*/
/*
request(option,function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log("成功：", i++,body); // 打印google首页
    }
})*/

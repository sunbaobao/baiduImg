const request=require("request");
exports.main= async function () {
    return new Promise((resolve,reject)=>{
        request('http://www.baidu.com', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // console.log(body) // 打印google首页
                resolve(body)

            }
        })
    })
}

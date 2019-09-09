var request = require('request');
var lineReader = require('line-reader');
var fs = require('fs');
var i = 0;
var imgArr = [];
var obj = {};
lineReader.eachLine('./server.txt', {encoding: 'utf8'}, function (line, last) {
    if (!/^data:image/.test(line)&&!obj[line]) {
        request(line).pipe(fs.createWriteStream("img/"+line.slice(line.lastIndexOf("/")+1)));
        obj[line] = "1";
        line=line.slice(line.lastIndexOf("/")+1);
        console.log(line);
        imgArr.push(line);
    }
});

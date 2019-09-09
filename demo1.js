let XLSX=require("xlsx");
let pJson=[];
for(let i=0;i<25;i++){
    pJson.push({
        '姓名':'哈'+i
    })
}
let sheetName = 'sheet1';
let workbook = {
    SheetNames: [sheetName],
    Sheets: {}
};
workbook.Sheets[sheetName] = XLSX.utils.json_to_sheet(pJson);
// 生成excel的配置项
const wopts = {
    bookType: 'xlsx', // 要生成的文件类型
    bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
    type: 'binary'
};
XLSX.writeFile(workbook,"demo2.xlsx",wopts);

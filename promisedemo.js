var pa = []
for (let i = 0; i < 25; i++) {
    var p = new Promise(function (resolve, reject) {
        setTimeout(function () {
            console.log("inner", i);

            resolve(i)
        })
    })
    pa.push(p);
}
console.log("start");
Promise.all(pa).then(function (data) {
    console.log("allSolve")
})


const fs = require("fs");

const process = require("process");

const getFiles = () =>{
    let obj=[];
    
    const folder = fs.readdirSync(`${process.cwd()}/public/final`);
    
    folder.forEach(file =>{
        let s = fs.readFileSync(`${process.cwd()}/public/final/${file}`);
        let d = JSON.parse(s);
        obj.push(d);
    });
    
    return obj
}

module.exports = { getFiles };

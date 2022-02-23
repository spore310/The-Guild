const fs = require("fs");
const process = require("process");
const { createCanvas, loadImage } = require("canvas");
const imageToBase64 = require('image-to-base64');

var array = [];
const test = "four";
const changeImageUrl = () => {
    const dir = fs.readdirSync(`${process.cwd()}/public/outputJSON`, { encoding: "utf-8" });

    dir.forEach(res => {

        let s = fs.readFileSync(`${process.cwd()}/public/outputJSON/${res}`);
        let file = JSON.parse(s);
        file.image_url = `bing.com/${file.name}.png`;
        fs.writeFileSync(`${process.cwd()}/public/outputJSON/${res}`, JSON.stringify(file));


    });

}

const convertImage_SVG = (_name, _username) => {
    imageToBase64(`${process.cwd()}/users/${_username}/images/${_name}.png`).then((res) => {
        let temp = fs.readFileSync(`${process.cwd()}/users/${_username}/metadata/${_name}.json`);
        let temp1 = JSON.parse(temp);

        res = `data:image/png;base64, ` + `${res}`;
        temp1.image_url = res;
        fs.writeFileSync(`${process.cwd()}/users/${_username}/final/${_name}.json`, JSON.stringify(temp1));
        console.log("image converted to baseCode!");
    }).then(result => {
        const itemImage = fs.unlink(`${process.cwd()}/users/${_username}/images/${_name}.png`, err => { if (err) { console.log(err) } });
        const itemJSON = fs.unlink(`${process.cwd()}/users/${_username}/metadata/${_name}.json`, err => { if (err) { console.log(err) } });
        if (!itemImage && !itemJSON) {
            console.log("succesful temp file removal");
            
        } else {
            console.log("error has occured with file deletion");
        }
    }).catch((err) => {
        console.error(err);
    })

}


module.exports = { convertImage_SVG };
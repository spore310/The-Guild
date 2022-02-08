const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const baseurl = "./images/";
const express = require("express");
const app = express();
const path = require("path");
const inputUrl = path.join(__dirname, `/images/`);
const bodyParser = require("body-parser");
const imageToBase64 = require('image-to-base64');
const { getTraits, getDNA } = require("./modules/metadata.js");
const { convertImage_SVG } = require("./modules/ImageData.js");
const { getFiles } = require("./modules/databaseUpload.js");
app.listen(3000);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');



app.get("/", (req, res) => {

  res.render(path.join(__dirname, "/public/home.ejs"));


});
app.get("/create", (req, res) => {

  res.render(path.join(__dirname, "/public/index.ejs"), {
    inputs: layersArray,
    image: ""
  });

});
app.post("/response", (req, res) => {
  const user = req.body;

  console.log(getTraits(user.nftName, `./public/output/${user.nftName}.png`, user.layers));

  res.render(path.join(__dirname, "/public/index.ejs"), {
    inputs: layersArray,
    image: user.nftName
  });

  //console.log(user.nftName);
  //creates image and stores it in local storage
  for (i = 0; i < layersArray.length; i++) {
    //for loop that goes over each layer option selected in /public/index.ejs and draws each layer
    //to the output file
    //drawlayer(_search, _name)
    //@param _search -- the source of the layer(can be configured for remote access)
    //@param _name -- name of new file and license
    drawlayer(`${layersArray[i].folder}${user.layers[i]}`, user.nftName);

  }
});

app.post("/confirm", (req, res) => {
  const member = req.body;

  console.log(getTraits(member.nftName, `./public/output/${member.nftName}.png`, member.layers));

  const info = displaymeta(member.nftName);

  for (i = 0; i < layersArray.length; i++) {
    //for loop that goes over each layer option selected in /public/index.ejs and draws each layer
    //to the output file
    //drawlayer(_search, _name)
    //@param _search -- the source of the layer(can be configured for remote access)
    //@param _name -- name of new file and license
    drawlayer(`${layersArray[i].folder}${member.layers[i]}`, member.nftName);
  }

  res.render(path.join(__dirname, "/public/response-confirm.ejs"), {
    image: member.nftName,
    metaData: info
  });



});

app.post("/result", (req, res) => {
  const name = req.body;

  res.render(path.join(__dirname, "/public/index.ejs"), {
    inputs: layersArray,
    image: ""
  });
  if (name.confirm_operator === 'yes') {
    convertImage_SVG(name.draftName1);

  } else if (name.confirm_operator === 'no') {
    clearTempFiles(name.draftName1);
  }


});

app.get("/pendingUsers", (req, res) => {
  const obj = getFiles();
  console.log("Get:");
  console.log(req.body);
  res.render(path.join(__dirname, "/public/pendingUsers.ejs"), {
    pending: obj
  });
});

app.post("/pendingUsers", (req, res) => {


  const ref = Object.keys(req.body)[0];
  console.log("Post:");
  console.log(req.body); //{ get: 'Delete' }
  console.log(ref); //get
  console.log(req.body[ref]); //Delete

  if (req.body[ref] === "Delete") {
    deleteTableRow(ref);
    console.log("ref == " + ref);

  }

  const obj = getFiles();

  res.render(path.join(__dirname, "/public/pendingUsers.ejs"), {
    pending: obj
  });
});

const canvas = createCanvas(1000, 1000);
const ctx = canvas.getContext('2d');

const saveLayer = (_canvas, _name) => {
  fs.writeFileSync(`./public/output/${_name}.png`, _canvas.toBuffer("image/png"));
  //console.log(`${_name}.png created!`);
};
const drawlayer = async (_search, _name) => {
  const image = await loadImage(_search);
  ctx.drawImage(image, 0, 0, 1000, 1000);
  saveLayer(canvas, _name);
  //console.log("Layer Drawn");
};
function layer(name, folder, assets = []) {
  this.name = name,
    this.folder = folder,
    this.assets = assets

};
let layersArray = [];
let metadataArray = [];

//returns file path to the list of layers set
const getLayers = () => {

  //returns array of folder names
  const sourceFolders = fs.readdirSync("images");


  for (let i = 0; i < sourceFolders.length; i++) {

    const sourceFiles = fs.readdirSync(`images/${sourceFolders[i]}`);

    layersArray.push(new layer(sourceFolders[i], `${baseurl}${sourceFolders[i]}/`, sourceFiles));


  }


};

const displaymeta = (_name) => {
  const meta = fs.readFileSync(`./public/outputJSON/${_name}.json`);
  let display = JSON.parse(meta);
  return display;
};

const clearTempFiles = (_name) => {

  const itemImage = fs.unlink(`${process.cwd()}/public/output/${_name}.png`, err => { if (err) { console.log(err) } });
  const itemJSON = fs.unlink(`${process.cwd()}/public/outputJSON/${_name}.json`, err => { if (err) { console.log(err) } });

  if (!itemImage && !itemJSON) {
    console.log(`${_name}(s) related files have been deleted`)
  } else {
    console.log("error has occured with file deletion");
  }

};

const deleteTableRow = (_target) => {
  let url = `${process.cwd()}/public/final/${_target}.json`
  
  fs.unlinkSync(url);

  

}

getLayers();

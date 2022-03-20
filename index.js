const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const { getTraits } = require("./modules/metadata.js");
const { convertImage_SVG } = require("./modules/ImageData.js");
const { getFiles, uploadSingle } = require("./modules//database/databaseUpload.js");
const { setPassport } = require("./modules/database/login.js")
const { _initUsers } = require("./users/usersTemp.js");


const baseurl = "./images/";

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(flash());
app.use(session({
  secret: 'guild',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
setPassport(passport);
app.use(methodOverride('_method'))

app.use(express.static('public'));
app.set('view engine', 'ejs');




app.get("/", checkAuthenticated, _initUsers, (req, res) => {

  res.render(path.join(__dirname, "/public/index.ejs"));


});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render(path.join(__dirname, "/public/login.ejs"))
});

app.post("/login", checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

app.get("/create", checkAuthenticated, (req, res) => {

  res.render(path.join(__dirname, "/public/create.ejs"), {
    inputs: layersArray
  });

});

app.post("/confirm", checkAuthenticated, (req, res) => {
  const member = req.body;

  drawlayers(member, req.user.username);

  let info = getTraits(req.user.username, member.nftName, `./users/${req.user.username}/images/${member.nftName}.png`, member.layers);



  res.render(path.join(__dirname, "/public/response-confirm.ejs"), {
    metaData: info
  });



});

app.post("/result", checkAuthenticated, (req, res) => {
  const name = req.body;
  


  if (name.confirm_operator === 'yes') {

    convertImage_SVG(name.draftName1, req.user.username);


  }

  if (name.confirm_operator === 'no') {
    clearTempFiles(name.draftName1, req.user.username);
  }

  res.render(path.join(__dirname, "/public/create.ejs"), {
    inputs: layersArray
  });



});

app.get("/pendingUsers", checkAuthenticated, (req, res) => {
  const obj = getFiles(req.user.username);
  console.log("Get:");
  console.log(req.body);
  res.render(path.join(__dirname, "/public/pendingUsers.ejs"), {
    pending: obj
  });
});

app.post("/deleteUser", checkAuthenticated, (req, res) => {
  const ref = Object.keys(req.body)[0];
  //console.log("Post:");
  //console.log(req.body); //{ get: 'Delete' }
  //console.log(ref); //get
  //console.log(req.body[ref]); //Delete

  if (req.body[ref] === "Delete") {
    deleteTableRow(ref, req.user.username);
    console.log("ref == " + ref);
  }

  res.render(path.join(__dirname, "/public/pendingUsers.ejs"), {
    pending: getFiles(req.user.username)
  });
});

app.get("/wallet", checkAuthenticated, (req, res) =>{
  res.render(path.join(__dirname, "/public/wallet.ejs"));
  
})

app.post("/uploadUser", checkAuthenticated, (req, res) => {
  const ref = Object.keys(req.body)[0];
  let obj1 = fs.readFileSync(`${process.cwd()}/users/${req.user.username}/final/${ref}.json`);
  let obj = JSON.parse(obj1);
  res.render(path.join(__dirname, "/public/uploadUser.ejs"), {
    data: obj
  });
});

app.post("/submitUser", checkAuthenticated, async (req, res) => {
  const x = req.body;
  const result = await uploadSingle(x.name, x.email, x.wallet, req.user.username);
  deleteTableRow(x.name, req.user.username);

  res.redirect("/pendingUsers");
})

const canvas = createCanvas(1000, 1000);
const ctx = canvas.getContext('2d');

const saveLayer = (_canvas, _name, _username) => {
  fs.writeFileSync(`${process.cwd()}/users/${_username}/images/${_name}.png`, _canvas.toBuffer("image/png"));
  //console.log(`${_name}.png created!`);
};
const drawlayer = async (_search, _name, _username) => {

  const image = await loadImage(_search);
  ctx.drawImage(image, 0, 0, 1000, 1000);
  saveLayer(canvas, _name, _username);
  //console.log("Layer Drawn");
};
function layer(name, folder, assets = []) {
  this.name = name,
    this.folder = folder,
    this.assets = assets

};
let layersArray = [];

//returns file path to the list of layers set
const getLayers = () => {

  //returns array of folder names
  const sourceFolders = fs.readdirSync("images");


  for (let i = 0; i < sourceFolders.length; i++) {

    const sourceFiles = fs.readdirSync(`images/${sourceFolders[i]}`);

    layersArray.push(new layer(sourceFolders[i], `${baseurl}${sourceFolders[i]}/`, sourceFiles));


  }


};

const drawlayers = (_name, _username) => {

  for (i = 0; i < layersArray.length; i++) {
    drawlayer(`${layersArray[i].folder}${_name.layers[i]}`, _name.nftName, _username);
  }
}


const clearTempFiles = (_name, _username) => {

  const itemImage = fs.unlink(`${process.cwd()}/users/${_username}/images/${_name}.png`, err => { if (err) { console.log(err) } });
  const itemJSON = fs.unlink(`${process.cwd()}/users/${_username}/metadata/${_name}.json`, err => { if (err) { console.log(err) } });

  if (!itemImage && !itemJSON) {
    console.log(`${_name}(s) related files have been deleted`)
  } else {
    console.log("error has occured with file deletion");
  }

};

const deleteTableRow = (_target, _username) => {
  let url = `${process.cwd()}/users/${_username}/final/${_target}.json`

  fs.unlinkSync(url);



}
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}


getLayers();
app.listen(3000);

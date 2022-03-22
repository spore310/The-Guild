const fs = require("fs");

const process = require("process");
const { getDNA } = require("../metadata.js")
const mongoose = require("mongoose");
const req = require("express/lib/request");

//@param @Schema used to store new instances of Schemas on mongoDB
let Schema = mongoose.Schema;

//@param @metaDataSchema used to store new instances of nft metadata Schema 
const metaDataSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    DNA: {
        type: String,
        unique: true,
        required: true,
        immutable: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    social_media: {
        type: String,
        required: true
    },
    attributes: {
        type: [],
        required: true
    }
}, { _id: false });

//@param @admin_stamp used to store new instances of an admin stamp Schema
const admin_stamp = new Schema({
    admin_username: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: Date.now()
    }

}, { _id: false });

//@param @userSchema used to store new instance of a user Schema
//pending implementations
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    wallet:{
        type: String,
        required: true,
        unique: true
    },
    on_chain:{
        type: Boolean,
        required: true,
        default: false
    }

}, { _id: false });

//@param @guildMemberSchema used to store new instances of a Guild member Schema
const guildMemberSchema = new Schema({

    metadata: {
        type: metaDataSchema,
        required: true
    },
    admin: {
        type: admin_stamp,
        required: true
    },
    user: {
        type: userSchema,
        required: true
    }
});



//@param @dbURI connection to mongoDB
const dbURI = "";


//uploades json files stored in path `public/final` to mongoDB
const uploadFiles = () => {

    //@param @temp temporary object array of @getFiles(see line 123)
    const temp = getFiles();

    //@param @TheGuild instance of mongodb connection using @dbURI(see line 77)
    //using reccomended buffering options
    let TheGuild = mongoose.createConnection(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (error) {
        if (error) throw err;

        console.log("database connected: " + Date.now());

        const admin = { admin_username: "spore310" };

        //@param @tempArray a temporary array of the documents to upload
        //@function @forEach() pushes @admin and @temp into an object to pass 
        //validation
        let tempArray = [];

        temp.forEach(metadata => {
            tempArray.push({ metadata, admin });
        });

        //@param @user contains the object to interact with the "users"
        //collection with @guildMemberSchema
        let user = TheGuild.model("users", guildMemberSchema);

        console.log("Uploading MetaData....");
        //@function @create inserts @tempArray into mongoDB using @user
        //@function @try used in case of error. Pending @catch callback update in case 
        //of insertion error
        //@dev @forEach logs the names of each user added 
        //@param @close() closes connection for @TheGuild instance
        try {

            user.create(tempArray).then(res => {
                res.forEach(us => { console.log(`${us?.metadata?.name} has been invited to the Guild!`); });
                TheGuild.close();
            });

        } catch (err) { console.error(err) };

    });


}


const uploadSingle = async (_name, _userEmail, _wallet, _adminUsername) => {
    try {
        const conn = mongoose.createConnection(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, function (err) {
            if (err)
                throw err;
        });
        let nft = fs.readFileSync(`${process.cwd()}/users/${_adminUsername}/final/${_name}.json`);
        let nftObj = JSON.parse(nft);

        const admin = { admin_username: _adminUsername };

        const userInfo = { name: _name, email: _userEmail, wallet: _wallet };

        let Users = conn.model("users", guildMemberSchema);
        let Checker = conn.model("users", guildMemberSchema);

        let check = Users.find({ metadata: { DNA: nftObj.DNA } })
        if (!check) {
            nftObj.DNA = getDNA();
        }
        const entry = { metadata: nftObj, admin: admin, user: userInfo };

        let insert = await Users.create(entry);
        
        conn.close();

    } catch (e) {
        console.error(e);
    };
}

//@param @getFiles() returns an object array of all the draft nft json files
const getFiles = (_username) => {

    //@param @obj A temporary array to hold the objects
    let obj = [];

    //@param @folder An array containing the names of the json file names
    const folder = fs.readdirSync(`${process.cwd()}/users/${_username}/final`);

    //@function @forEach() Iterates through @folder to read the json files in the @final folder
    //located at path `public/final` and pushes each json file into @obj 
    //@param @file the json file in iteration
    //@param @s an object that contains the current @file
    //@param @d converted @s into a javascript object
    folder.forEach(file => {
        let s = fs.readFileSync(`${process.cwd()}/users/${_username}/final/${file}`);
        let d = JSON.parse(s);
        obj.push(d);
    });

    return obj
}

//debugging space
try {

} catch (err) { console.error(err) }


module.exports = { getFiles, uploadFiles, uploadSingle };

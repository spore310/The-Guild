const bcrypt = require('bcrypt');

const localStrategy = require("passport-local").Strategy;

const mongoose = require("mongoose");

const dbURI = "mongodb+srv://user:Y3abUp73B1DYTybb@cluster0.qhkz6.mongodb.net/TheGuild?retryWrites=true&w=majority";

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => { console.log("connected to database"); });
//@param @Schema used to store new instances of Schemas on mongoDB
let Schema = mongoose.Schema;

const adminSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

const setPassport = (passport) => {

    const adminSign = mongoose.model("admins", adminSchema);
    passport.use(new localStrategy((username, password, done) => {
        adminSign.findOne({ username: username }, (err, user) => {
            if (err) throw err;

            if (!user) return done(null, false, { message: "Username or Password Incorrect!" });

            bcrypt.compare(password, user.password, (err, result) => {

                if (err) throw err;

                if (result) {

                    return done(null, user);

                } 
                
                return done(null, false, { message: "Username or Password Incorrect!" });
            })

        });
        
    })

    )

    passport.serializeUser((user, cb) => {
        cb(null, user.id);
    });
    passport.deserializeUser((id, cb) => {
        adminSign.findOne({ _id: id }, (err, user) => {
            const userInformation = {
                username: user.username,
            };
            cb(err, userInformation);
        });
    });
};


const registerAdmin = async (_user, _pass) => {
    let test;
    let hash = await bcrypt.hash(_pass, 10);
    let register = mongoose.createConnection(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err) {
        if (err) throw err;

    });

    let admin = register.model("admins", adminSchema)
    const check = await admin.findOne({ username: _user });
    if (check) {
        register.close();
        return { message: "user already exists" }
    }
    if (!check) {
        const newadmin = await admin.create({ username: _user, password: hash });
        register.close();
        return newadmin
    }

}

module.exports = { setPassport }
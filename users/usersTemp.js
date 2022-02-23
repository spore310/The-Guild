const fs = require("fs");
const process = require("process");

const _initUsers = async (req, res, next) => {
    const user = req.user.username;
    const userBaseUrl = `${process.cwd()}/users/${user}`;

    try {
        if (!fs.existsSync(userBaseUrl)) {
            fs.mkdir(userBaseUrl, function (err) {
                if (err) throw err;
                fs.mkdir(`${userBaseUrl}/metadata`, function (err) {
                    if (err) throw err;
                    fs.mkdir(`${userBaseUrl}/images`, function (err) {
                        if (err) throw err;
                        fs.mkdir(`${userBaseUrl}/final`, function (err) {
                            if (err) throw err;
                            return next();
                        })
                    })
                })
            })
        }
        return next();
    } catch (e) {
        console.error(e);
    }
}

module.exports = { _initUsers };
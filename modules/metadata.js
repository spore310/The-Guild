const fs = require("fs");
const process = require('process');
//constructor for the metadata format
function metadata(_name,_dna, _imageurl, _desc, _social, _atr = []) {
        this.name = _name,
                this.DNA = _dna,
                this.image_url = _imageurl,
                this.description = _desc
        this.social_media = _social,
                this.attributes = _atr
}


const getTraits = (_username, _name, _imageurl, _layers = []) => {
        let temp = [];
        let s;


        _layers.forEach(res => {

                switch (res.substring(0, 4)) {
                        case 'exp_':
                                temp.push({ "trait_type": "Rank", "value": "3 Star" });
                                break;
                        case 'jor_':
                                temp.push({ "trait_type": "Rank", "value": "2 Star" });
                                break;
                        case 'nor_':
                                temp.push({ "trait_type": "Rank", "value": "1 Star" });
                                break;
                        case 'dig_':
                                temp.push({ "trait_type": "Format", "value": "Digital" });
                                break;
                        case 'phs_':
                                temp.push({ "trait_type": "Format", "value": "Physical" });
                                break;
                        case 'mus_':
                                temp.push({ "trait_type": "Class", "value": "Musician" });
                                break;
                        case 'art_':
                                temp.push({ "trait_type": "Class", "value": "Artist" });
                                break;
                        case 'adm_':
                                temp.push({ "trait_type": "Authorization", "value": "Administrator" });
                                break;
                        case 'gld_':
                                temp.push({ "trait_type": "Authorization", "value": "Guild Member" });
                                break;
                        case 'ped_':
                                temp.push({ "trait_type": "Status", "value": "Pending" });
                                break;
                        case 'ver_':
                                temp.push({ "trait_type": "Status", "value": "Verification" });
                                break;
                        default:
                                console.log(`${res} is not a valid layer!`);
                                break;
                }
        });

        console.log(`${_layers.length} attributes have been proccesed!`);

        s = new metadata(_name, getDNA(), _imageurl, `${_name} is an offical member!`, "TheGuild.io", temp);

        fs.writeFileSync(`${process.cwd()}/users/${_username}/metadata/${s.name}.json`, JSON.stringify(s));

        console.log(`${s.name} has had their metadata proccessed`);

        return s;
}

const getDNA = () => {
        let array = [32];

        for (i = 0; i < 32; i++) {
                array[i] = Math.floor(Math.random() * 10);
        }

        return array.join("");
}






module.exports = { getTraits, getDNA };
const res = require("express/lib/response");
const fs = require("fs");
const mongoose = require("mongoose");
const pinataSDK = require("@pinata/sdk");
const { MemoryStore } = require("express-session");
const Web3 = require("web3");
const HDWallet = require("@truffle/hdwallet-provider");
const moralisUrl = "https://speedy-nodes-nyc.moralis.io/c3486ca37909d33b4dee3426/polygon/mumbai";
const memonicPhrase = "";
const address= "0x5b140AeF8eb5C9a775c05dD9408AB241FC9E7e18";
const provider = new HDWallet({
    mnemonic: memonicPhrase,
    providerOrUrl: moralisUrl,
    addressIndex: 0
  });
const web3 = new Web3(provider);
const pinata = pinataSDK('', '');
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
    image_url: {
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

const wallets = new Schema({
    user: {
        type: String,
        required: true
    },
    wallet: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    }
})
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
    wallet: {
        type: String,
        required: true,
        unique: true
    },
    on_chain: {
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

const dbURI = "mongodb+srv://user:Y3abUp73B1DYTybb@cluster0.qhkz6.mongodb.net/TheGuild?retryWrites=true&w=majority";

const walletChecker = async () => {
    let Users = mongoose.model("users", guildMemberSchema);
    let Updater = mongoose.model("users", guildMemberSchema);
    let PassedUsers = mongoose.model("wallets", wallets);
    let returnArray = [];
    let addressArray = [];
    let hashArray = [];
    let response = await Users.find({ 'user.on_chain': false }, 'user metadata');
    if (response) {
        console.log('Qued Users: ', response.length);
        for (let i = 0; i < response.length; i++) {

            let Hash = await hash(response[i]);
            let userName = response[i].metadata.name;
            let userWallet = response[i].user.wallet;

            returnArray.push({ user: userName, wallet: userWallet, hash: Hash });
            addressArray.push(userWallet);
            hashArray.push(Hash);
        }
        console.log("User Wallets: ");
        console.log(addressArray);
        console.log("User Wallets: ");
        console.log(hashArray);

        const transaction = await whiteList(addressArray, hashArray);
            if(!transaction) {
                console.log("something went wrong")
            };
        
        PassedUsers.create(returnArray, function (err, user) {
            if (err) throw err;
            if (user) {
                Updater.updateMany({ 'user.on_chain': false }, { 'user.on_chain': true }, function (err, user) {
                    if (err) throw err;
                    if (user) {
                        console.log('Modified Count: ', user.modifiedCount);
                        console.log('Matched Documents Count: ', user.matchedCount);
                    }
                })
            }
        });
    
    }
};

const getWalletBalance = () =>{
    web3.eth.getBalance("0xa913BEec3fEFf94b77A4aAE1f719e7C427aA55f9", function(err, result) {
        if (err) {
          console.log(err)
        } else {
          console.log(web3.utils.fromWei(result, "ether") + " MATIC")
        }
      })
}

const whiteList = async(_address, _hash) =>{
    let NFTABI = fs.readFileSync("./DevScripts/contracts/NFT.json");
    NFTABI = JSON.parse(NFTABI);
    guild = new web3.eth.Contract(NFTABI, '0xB753b64B4C4F611dA4e07891b34a0a4714546413');
    const tx = await guild.methods.whitelistBatch(_address, _hash).send({from: address});
    console.log(`Transcation hash: ${tx.transactionHash}`);
    console.log(`Gas used: ${tx.cumulativeGasUsed}`);
    return tx
}

const hash = async (user) => {
    let hash = await pinata.pinJSONToIPFS(user.metadata, {
        pinataMetadata: {
            name: user.metadata.name,
            keyvalues: {
                Wallet: user.user.wallet,
                DNA: user.metadata.DNA
            }
        }
    });
    return hash.IpfsHash
}

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, async function (err) {
    if (err) throw err;
    //let mig = mongoose.model("users", guildMemberSchema);

    let walletToSend = await walletChecker();
    walletToSend?mongoose.close():console.log('bitcho');    

});





provider.engine.stop();

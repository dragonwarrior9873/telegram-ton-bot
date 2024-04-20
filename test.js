const Telegraf = require('telegraf'); //includeing telegraf lib

const bot = new Telegraf('7134153113:AAF04tcxnKMN-A7x3L9TI6jsxeX5719OUQY'); // add your bot token

const axios = require('axios');  // send HTTP/s request and gets respond (info)
const fs = require('fs');  // reading json files
const TonWeb = require("tonweb");
const nacl = require("tweetnacl");
const { mnemonicToWalletKey, mnemonicNew, mnemonicToPrivateKey } = require("@ton/crypto") ;
const { TonClient, WalletContractV4, internal } = require("@ton/ton");

let wallet, walletAddress = "";
let mnemonics  = [];

async function test1() {
 // Generate new key
 mnemonics = await mnemonicNew();
 console.log(mnemonics)
 console.log(JSON.stringify(mnemonics));
 let keyPair = await mnemonicToPrivateKey(mnemonics);
 console.log(keyPair)
 // Create wallet contract
 let workchain = 0; // Usually you need a workchain 0
 wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
 walletAddress = wallet.address.toString({ testOnly: true })
 console.log(walletAddress);
}

async function test2() {
    mnemonics = input.slice(1);
    const key = await mnemonicToWalletKey(mnemonics);
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    walletAddress = wallet.address.toString({ testOnly: true })

    // print wallet address
    console.log(walletAddress);
    console.log(key.privateKey);
    // print wallet workchain
    console.log("workchain:", wallet.address.workChain);
}

test1();
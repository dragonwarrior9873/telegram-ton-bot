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

// Create Client
const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  });

const helpMessage = `
*TON Controlling API Bot*
/create - create ton wallet and return privatekey of that wallet.
/import \`<mnemonicKey>\` - import wallet from wallet address.
/showkey - show mnemonicKey of ton wallet address of bot.
/showaddress - show wallet address of bot.
/getBalance - show balance that address has.
/pair \`<pair_address>\` \`<sell_limit>\` \`<buy_limit>\` - get pair address and get sell and buy limit.
/run - run bot.
/stop - stop bot.
`;

bot.help(ctx => {
    bot.telegram.sendMessage(ctx.chat.id, helpMessage, {
        parse_mode: "markdown"
    });
})

bot.command('create', async ctx => {
    // Generate new key
    mnemonics = await mnemonicNew();
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    // Create wallet contract
    let workchain = 0; // Usually you need a workchain 0
    wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    walletAddress = wallet.address.toString({ testOnly: true })
    const response = axios
    ctx.reply(walletAddress);
})  

bot.command('import', async ctx => {
    let input = ctx.message.text.split(/\s+/);
    if(input.length != 25){
        ctx.reply("Wrong Input");
        return;
    }
    mnemonics = input.slice(1);
    const key = await mnemonicToWalletKey(mnemonics);
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    walletAddress = wallet.address.toString({ testOnly: true })

    // print wallet address
    console.log(walletAddress);
    console.log(key.privateKey);
    // print wallet workchain
    console.log("workchain:", wallet.address.workChain);
    ctx.reply(walletAddress);
})

bot.command('showaddress', ctx => {
    ctx.reply(walletAddress);
})

bot.command('showkey', ctx => {
    ctx.reply(mnemonics);
})

bot.command('getBalance', async ctx => {
    // Get balance
    if(wallet){
        let contract = client.open(wallet);
        let balance = await contract.getBalance();
        console.log(balance);
        ctx.reply(BigInt(balance));
    }
    else {
        ctx.reply("Wallet not Connected. Please connect Wallet first!");
    }
})

bot.command('run', ctx => {
    // at the end of your script remmember to add this, else yor bot will not run
    // bot.launch();
    ctx.reply("Bot successfully launched...");
    bot.telegram.sendMessage(ctx.chat.id, helpMessage, {
        parse_mode: "markdown"
    });
})

bot.command('stop', ctx => {
    // at the end of your script remmember to add this, else yor bot will not run
    // bot.stop();
    ctx.reply("Bye....");
})

bot.launch();
const Telegraf = require('telegraf'); //includeing telegraf lib

const bot = new Telegraf('7134153113:AAF04tcxnKMN-A7x3L9TI6jsxeX5719OUQY'); // add your bot token

const axios = require('axios');  // send HTTP/s request and gets respond (info)
const fs = require('fs');  // reading json files
const TonWeb = require("tonweb");
const nacl = require("tweetnacl");
const { mnemonicToWalletKey, mnemonicNew, mnemonicToPrivateKey } = require("@ton/crypto");
const { TonClient, WalletContractV4, internal } = require("@ton/ton");
const { url_pair_info } = require('./constant');
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

let isWorkerDead = true;
let wallet, walletAddress = "";
let mnemonics = [];

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
/addPair \`<pair_address>\` \`<sell_limit>\` \`<buy_limit>\` - get pair address and get sell and buy limit.
/updatePair \`<pair_ID>\` \`<pair_address>\` \`<sell_limit>\` \`<buy_limit>\` - get pair address and get sell and buy limit.
/deletePair \`<pair_ID>\` - delete pair from DB using id.
/deleteAll - delete all pairs from DB.
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
  ctx.reply(walletAddress);
})

bot.command('import', async ctx => {
  let input = ctx.message.text.split(/\s+/);
  if (input.length != 25) {
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


bot.command('addPair', async ctx => {
  let input = ctx.message.text.split(/\s+/);
  if (input.length != 4) {
    ctx.reply("Wrong Input");
    return;
  }
  let pairAddress = input[1];
  let sell_limit = input[2];
  let buy_limit = input[3];

  let pairData = {
    pairContract: pairAddress,
    sell_limit: sell_limit,
    buy_limit: buy_limit
  };
  // Making a POST request using Axios
  axios.post(url_pair_info, pairData)
    .then(response => {
      ctx.reply(`Pair Information successfully saved. Saved Pair Information id is ${response.data.id}`);
    })
    .catch(error => {
      console.error('Error:', error);
      ctx.reply("Failed to save Pair Information");
    });
})

bot.command('deletePair', async ctx => {
  let input = ctx.message.text.split(/\s+/);
  if (input.length != 2) {
    ctx.reply("Wrong Input");
    return;
  }
  let pairID = input[1];

  // Making a POST request using Axios
  axios.delete(`${url_pair_info}/${pairID}`)
    .then(response => {
      console.log('Response:', response.data);
      ctx.reply("Pair Information successfully deleted...");
    })
    .catch(error => {
      console.error('Error:', error);
      ctx.reply("Failed to delete Pair Information");
    });
})

bot.command('deleteAll', async ctx => {
  // Making a POST request using Axios
  if (!isWorkerDead) {
    ctx.reply("Worker is running. Please stop Worker before changing pair infos");
  } else {
    axios.delete(url_pair_info)
    .then(response => {
      ctx.reply("Pair Informations successfully deleted...");
    })
    .catch(error => {
      console.error('Error:', error);
      ctx.reply("Failed to delete Pairs Information");
    });
  }
})



bot.command('updatePair', async ctx => {
  let input = ctx.message.text.split(/\s+/);
  if (input.length != 5) {
    ctx.reply("Wrong Input");
    return;
  }
  let pairID = input[1];
  let pairAddress = input[2];
  let sell_limit = input[3];
  let buy_limit = input[4];

  let pairData = {
    pairContract: pairAddress,
    sell_limit: sell_limit,
    buy_limit: buy_limit
  };
  // Making a POST request using Axios
  axios.put(`${url_pair_info}/${pairID}`, pairData)
    .then(response => {
      ctx.reply(`Pair Information successfully updated. Saved Pair Information id is ${response.data.id} and Pair Contract Address is ${response.data.pairContract} `);
    })
    .catch(error => {
      console.error('Error:', error);
      ctx.reply("Failed to update Pair Information");
    });
})

bot.command('getBalance', async ctx => {
  // Get balance
  if (wallet) {
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
  if( !walletAddress ){
    ctx.reply("Please Connect Wallet First"); 
  }
  worker.postMessage('Start Worker...');
  worker.on('message', (message) => {
    console.log(`Main received message: ${message}`);
    isWorkerDead = false;
    ctx.reply("Now Worker is Running on Ton Chain"); 
  });
})

bot.command('stop', ctx => {
  worker.terminate();
  worker.on('exit', (code) => {
    isWorkerDead = true;
    console.log(`Worker exited with code ${code}`);
    ctx.reply("Worker exited. Bye....");
  });
})

bot.launch();
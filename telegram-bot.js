const Telegraf = require('telegraf'); //includeing telegraf lib

const bot = new Telegraf('7134153113:AAF04tcxnKMN-A7x3L9TI6jsxeX5719OUQY'); // add your bot token

const axios = require('axios');  // send HTTP/s request and gets respond (info)
const fs = require('fs');  // reading json files
const TonWeb = require("tonweb");
const nacl = require("tweetnacl");
const { mnemonicToWalletKey, mnemonicNew, mnemonicToPrivateKey } = require("@ton/crypto");
const { TonClient, WalletContractV4, internal } = require("@ton/ton");
const { url_pair_info, url_wallet_info } = require('./constant');
const { Worker } = require('worker_threads');
let worker;

let isWorkerDead = true;
let wallet, walletAddress = "";
let mnemonics = [];
let wallet_info ;
let workchain = 0; // Usually you need a workchain 0
// Create Client
const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
});

const testClient = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
})

const helpMessage = `
*TON Controlling API Bot*
/create - create ton wallet and return address of that wallet.
/import \`<mnemonicKey>\` - import wallet from wallet address.
/showkey - show mnemonicKey of ton wallet address of bot.
/showaddress - show wallet address of bot.
/getBalance - show balance that address has.
/addPair \`<jetton0_address>\` \`<jetton1_address>\` \`<sell_limit>\` \`<buy_limit>\` - get pair address and get sell and buy limit.
/updatePair \`<pair_ID>\` \`<jetton0_address>\` \`<jetton1_address>\` \`<sell_limit>\` \`<buy_limit>\` - get pair address and get sell and buy limit.
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
  
  wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
  walletAddress = wallet.address.toString({ testOnly: true })  

  walletData = {
    wallet_address : walletAddress,
    mnemonics : JSON.stringify(mnemonics),
  }
  axios.post(url_wallet_info, walletData)
  .then(response => {
    ctx.reply(`Wallet Information successfully saved. Saved Wallet Information id is ${response.data.id}`);
  })
  .catch(error => {
    console.error('Error:', error);
    ctx.reply("Failed to save Wallet Information");
  });

  ctx.reply(`Created Wallet Address is ${walletAddress}`);
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
  
  walletData = {
    wallet_address : walletAddress,
    mnemonics : JSON.stringify(mnemonics),
  }
  axios.post(url_wallet_info, walletData)
  .then(response => {
    ctx.reply(`Wallet Information successfully saved. Saved Wallet Information id is ${response.data.id}`);
  })
  .catch(error => {
    console.error('Error:', error);
    ctx.reply("Failed to save Wallet Information");
  });

  console.log("workchain:", wallet.address.workChain);
  ctx.reply(`Imported Wallet Address is ${walletAddress}`);
})

bot.command('showaddress', ctx => {
  ctx.reply(walletAddress);
})

bot.command('showkey', ctx => {
  ctx.reply(mnemonics);
})


bot.command('addPair', async ctx => {
  let input = ctx.message.text.split(/\s+/);
  if (input.length != 5) {
    ctx.reply("Wrong Input");
    return;
  }
  let jetton0Address = input[1];
  let jetton1Address = input[2];
  let sell_limit = input[3];
  let buy_limit = input[4];

  let pairData = {
    jetton0: jetton0Address,
    jetton1: jetton1Address,
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
  if (input.length != 6) {
    ctx.reply("Wrong Input");
    return;
  }
  let pairID = input[1];
  let jetton0Address = input[2];
  let jetton1Address = input[3];
  let sell_limit = input[4];
  let buy_limit = input[5];

  let pairData = {
    jetton0: jetton0Address,
    jetton1: jetton1Address,
    sell_limit: sell_limit,
    buy_limit: buy_limit
  };
  // Making a POST request using Axios
  axios.put(`${url_pair_info}/${pairID}`, pairData)
    .then(response => {
      ctx.reply(`Pair Information successfully updated. Saved Pair Information id is ${response.data.id} and Pair Contract Address is ${response.data.jetton0} and  ${response.data.jetton1}`);
    })
    .catch(error => {
      console.error('Error:', error);
      ctx.reply("Failed to update Pair Information");
    });
})

bot.command('getBalance', async ctx => {
  // Get balance
  if (walletAddress && mnemonics) {
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    // Create wallet contract
    
    wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    const sender = wallet.sender(keyPair.secretKey);
    let contract = client.open(wallet);
    sleep(1000);
    let balance = await contract.getBalance();
    console.log(BigInt(balance).toString());
    ctx.reply(BigInt(balance).toString());
  }
  else {
    ctx.reply("Wallet not Connected. Please connect Wallet first!");
  }
})

bot.command('run', async ctx => {
  if( !walletAddress || !mnemonics) {
    ctx.reply("Please Connect Wallet First"); 
    return;
  }
  // worker = new Worker('./worker.js');
  if( isWorkerDead ){
    worker = new Worker('./worker.js');
    worker.postMessage(walletAddress);
    isWorkerDead = false;
    ctx.reply("Now Worker is Running on Ton Chain");
  }
  else {
    ctx.reply("A Worker is Already Running on Ton Chain"); 
  }
  // worker.on('message', (message) => {
  //   console.log(`Main received message: ${message}`);
  // });
})

bot.command('stop', ctx => {
  worker.terminate();
  isWorkerDead = true;
  worker.on('exit', (code) => {
    console.log(`Worker exited with code ${code}`);
    ctx.reply("Worker exited. Bye....");
  });
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function init() {
  await axios.get(url_wallet_info)
  .then(response => {
    if (response.data) {
      walletAddress = response.data.wallet_address;
      mnemonics = JSON.parse(response.data.mnemonics);
    }
  })
  .catch(error => {
    console.error('No Wallet found in database.');
  });
}
init();
bot.launch();
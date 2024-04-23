const { parentPort } = require('worker_threads');
const TonWeb = require("tonweb");
const { Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS, PoolRevisionV1 } = require('@ston-fi/sdk');
const { Factory, MAINNET_FACTORY_ADDR, ReadinessStatus, Asset, VaultNative, JettonRoot, JettonWallet, PoolType, DeDustClient, Pool } = require('@dedust/sdk');
const { Address, TonClient4, WalletContractV4 } = require("@ton/ton");
const { url_pair_info } = require('./constant');
const { toNano } = require('@ton/core');
const axios = require('axios');  // send HTTP/s request and gets respond (info)
const { mnemonicToPrivateKey } = require('@ton/crypto');
let pair_infos = [];
/*
parentPort.on('message', async (message) => {
  console.log(`Worker received message: ${message}`);
  await axios.get(url_pair_info)
    .then(response => {
      if (response.data) {
        pair_infos = Array.from(response.data);
        console.log(pair_infos);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  // parentPort.postMessage("Bot is Successfully Running");
  while (true) {
    await mainloop(message);
    sleep(1000);
    if (message === 'terminate') break;
  }
  // setInterval( mainloop(walletAddress), 1000);
});

async function mainloop(walletAddress) {
  for (let i = 0; i < pair_infos.length; i++) {
    await evaluate_ston_fi_limit(walletAddress, pair_infos[i].jetton0, pair_infos[i].jetton1, pair_infos[i].sell_limit, pair_infos[i].buy_limit);
    sleep(1000);
    await evaluate_dedust_limit(walletAddress, pair_infos[i].jetton0, pair_infos[i].jetton1, pair_infos[i].sell_limit, pair_infos[i].buy_limit);
    sleep(1000);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function evaluate_ston_fi_limit(walletAddress, jetton0, jetton1, sell_limit, buy_limit) {
  console.log("...............evaluate_ston_fi_limit...................");
  const WALLET_ADDRESS = walletAddress; // ! replace with your address
  // const OWNER_ADDRESS = '0QC3-tDA6CQt6qJ8jZ3StmJmaleEKs896GxT8BrrfUstslMW';

  const JETTON0 = jetton0;
  const JETTON1 = jetton1;
  // const JETTON0 = jetton0;
  // const JETTON1 = jetton1;

  const provider = new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: "eb60bdf9abb69408d86f64a8cf18d98e0267a079b6f7941328e5085122151a01",
  });

  const router = new Router(provider, {
    revision: ROUTER_REVISION.V1,
    address: ROUTER_REVISION_ADDRESS.V1,
  });
  console.log(router.address);
  console.log("____________________________________________________________________________________");
  console.log(ROUTER_REVISION_ADDRESS.V1);
  await sleep(1000); // Sleep for 2 seconds
  try {
    // const address = await router.getPoolAddress({token0 : JETTON0, token1: JETTON1});
    console.log(`+++++++++++${address}`);
    const pool = await router.getPool({
      jettonAddresses: [JETTON0, JETTON1],
    });
    const poolData = await pool.getData();
    // const pool = new Pool(provider, {
    //   revision : PoolRevisionV1,
    //   address: address,
    // })
    // const poolData = await pool.getData();

    const {
      reserve0,
      reserve1,
      token0WalletAddress,
      token1WalletAddress,
      lpFee,
      protocolFee,
      refFee,
      protocolFeeAddress,
      collectedToken0ProtocolFee,
      collectedToken1ProtocolFee,
    } = poolData;

    console.log(BigInt(poolData.reserve0).toString());
    console.log(BigInt(poolData.reserve1).toString());
    let reserveA = Number(BigInt(poolData.reserve0));
    let reserveB = Number(BigInt(poolData.reserve1));
    console.log("------------------");
    console.log(reserveB / reserveA);
    if (reserveB / reserveA > sell_limit) {
      console.log("sell_limit");
      await sleep(1000); // Sleep for 2 seconds
      // transaction to swap 1.0 JETTON0 to JETTON1 but not less than 1 nano JETTON1
      const swapTxParams = await router.buildSwapJettonTxParams({
        // address of the wallet that holds offerJetton you want to swap
        userWalletAddress: WALLET_ADDRESS,
        // address of the jetton you want to swap
        offerJettonAddress: JETTON0,
        // amount of the jetton you want to swap
        offerAmount: new TonWeb.utils.BN('100000'),
        // address of the jetton you want to receive
        askJettonAddress: JETTON1,
        // minimal amount of the jetton you want to receive as a result of the swap.
        // If the amount of the jetton you want to receive is less than minAskAmount
        // the transaction will bounce
        minAskAmount: new TonWeb.utils.BN(1),
        // query id to identify your transaction in the blockchain (optional)
        queryId: 12345,
        // address of the wallet to receive the referral fee (optional)
        referralAddress: undefined,
      });

      // to execute the transaction you need to send transaction to the blockchain
      // (replace with your wallet implementation, logging is used for demonstration purposes)
      console.log({
        to: swapTxParams.to,
        amount: swapTxParams.gasAmount,
        payload: swapTxParams.payload,
      });
    }
    else if (reserveB / reserveA < buy_limit) {
      console.log("buy_limit");
      await sleep(1000); // Sleep for 2 seconds
      // transaction to swap 1.0 JETTON0 to JETTON1 but not less than 1 nano JETTON1
      const swapTxParams = await router.buildSwapJettonTxParams({
        // address of the wallet that holds offerJetton you want to swap
        userWalletAddress: WALLET_ADDRESS,
        // address of the jetton you want to swap
        offerJettonAddress: JETTON1,
        // amount of the jetton you want to swap
        offerAmount: new TonWeb.utils.BN('100000'),
        // address of the jetton you want to receive
        askJettonAddress: JETTON0,
        // minimal amount of the jetton you want to receive as a result of the swap.
        // If the amount of the jetton you want to receive is less than minAskAmount
        // the transaction will bounce
        minAskAmount: new TonWeb.utils.BN(1),
        // query id to identify your transaction in the blockchain (optional)
        queryId: 12345,
        // address of the wallet to receive the referral fee (optional)
        referralAddress: undefined,
      });

      // to execute the transaction you need to send transaction to the blockchain
      // (replace with your wallet implementation, logging is used for demonstration purposes)
      console.log({
        to: swapTxParams.to,
        amount: swapTxParams.gasAmount,
        payload: swapTxParams.payload,
      });
    }
  } catch (err) {
    console.log(`ston.fi Pool doen't exist for ${jetton0} and ${jetton1}`);
  }

}

async function evaluate_dedust_limit(walletAddress, jetton0, jetton1, sell_limit, buy_limit) {
  console.log("...............evaluate_dedust_limit...................");
  // NOTE: We will use tonVault to send a message.
  const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
  const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
  const tonVault = tonClient.open(await factory.getNativeVault());
  const JETTON0 = Address.parse(jetton0);
  const JETTON1 = Address.parse(jetton1);
  const SCALE = Asset.jetton(JETTON1);
  const TON = Asset.jetton(JETTON0);

  // const TON = Asset.native();

  try {
    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, SCALE]));

    let reserve = await pool.get_reserves();
    let reserveA = Number(BigInt(reserve.reserve0));
    let reserveB = Number(BigInt(reserve.reserve1));
    console.log(reserveA);
    console.log(reserveB);

    let mnemonics = [];
    await axios.get(url_wallet_info)
      .then(response => {
        if (response.data) {
          mnemonics = JSON.parse(response.data.mnemonics);
        }
      })
      .catch(error => {
        console.error('No Wallet found in database.');
      });

    let keyPair = await mnemonicToPrivateKey(mnemonics);
    let workchain = 0; // Usually you need a workchain 0
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    let sender = wallet.sender(keyPair.secretKey);

    if (reserveB / reserveA > sell_limit) {
      const amountIn = toNano('5'); // 5 TON
      await tonVault.sendSwap(sender, {
        poolAddress: pool.address,
        amount: amountIn,
        gasAmount: toNano("0.25"),
      });
    }

    else (reserveB / reserveA < buy_limit)
    {
      const scaleVault = tonClient.open(await factory.getJettonVault(SCALE));
      const scaleWallet = tonClient.open(await scaleRoot.getWallet(walletAddress));
      const amountIn = toNano('50'); // 50 SCALE
      await scaleWallet.sendTransfer(sender, toNano("0.3"), {
        amount: amountIn,
        destination: scaleVault.address,
        responseAddress: sender.address, // return gas to user
        forwardAmount: toNano("0.25"),
        forwardPayload: VaultJetton.createSwapPayload({ poolAddress }),
      });
    }
  } catch (err) {
    console.log(`Dedust Pool doen't exist for ${jetton0} and ${jetton1}`);
  }

}

*/
// async function test() {
//   console.log("____________________________________________________________________________________");
//   const provider = new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
//     apiKey: "eb60bdf9abb69408d86f64a8cf18d98e0267a079b6f7941328e5085122151a01",
//   });

//   const router = new Router(provider, {
//     revision: ROUTER_REVISION.V1,
//     address: ROUTER_REVISION_ADDRESS.V1,
//   });
//   console.log(router.address);
//   console.log("____________________________________________________________________________________");
//   console.log(ROUTER_REVISION_ADDRESS.V1);
//   try {
//     // const address = await router.getPoolAddress({token0 : JETTON0, token1: JETTON1});
//     const JETTON0 = 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA';
//     const JETTON1 = 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO';
//     // console.log(`+++++++++++${address}`);
//     const pool = await router.getPool({
//       jettonAddresses: [JETTON0, JETTON1],
//     });

//     console.log(`+++++++++++${pool}`);
//     const poolData = await pool.getData();
//     console.log(poolData);
//   } catch (err) {
//     console.log(err);
//   }
// }

// test();
async function evaluate_dedust_limit() {
    console.log("...............evaluate_dedust_limit...................");
    // NOTE: We will use tonVault to send a message.
    const jetton0 = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'
    const jetton1 = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
    const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
    const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
    // const tonVault = tonClient.open(await factory.getNativeVault());
    // const JETTON0 = Address.parse(jetton0);
    const JETTON1 = Address.parse(jetton1);
    const SCALE = Asset.jetton(JETTON1);
    // const TON = Asset.jetton(JETTON0);
    const TON = Asset.native();

    
    // const TON = Asset.native();
    
    try {
        const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, SCALE]));
        
        const reserve = await pool.getReserves();
        let reserveA = Number(BigInt(reserve[0]));
      let reserveB = Number(BigInt(reserve[1]));
      console.log(reserveA);
      console.log(reserveB);
        
        //   let mnemonics = [];
        //   await axios.get(url_wallet_info)
    //     .then(response => {
    //       if (response.data) {
    //         mnemonics = JSON.parse(response.data.mnemonics);
    //       }
    //     })
    //     .catch(error => {
    //       console.error('No Wallet found in database.');
    //     });
  
    //   let keyPair = await mnemonicToPrivateKey(mnemonics);
    //   let workchain = 0; // Usually you need a workchain 0
    //   let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    //   let sender = wallet.sender(keyPair.secretKey);
    
    //   if (reserveB / reserveA > sell_limit) {
        //     const amountIn = toNano('5'); // 5 TON
        //     await tonVault.sendSwap(sender, {
            //       poolAddress: pool.address,
            //       amount: amountIn,
            //       gasAmount: toNano("0.25"),
            //     });
            //   }
            
            //   else (reserveB / reserveA < buy_limit)
            //   {
                //     const scaleVault = tonClient.open(await factory.getJettonVault(SCALE));
                //     const scaleWallet = tonClient.open(await scaleRoot.getWallet(walletAddress));
                //     const amountIn = toNano('50'); // 50 SCALE
                //     await scaleWallet.sendTransfer(sender, toNano("0.3"), {
                    //       amount: amountIn,
                    //       destination: scaleVault.address,
                    //       responseAddress: sender.address, // return gas to user
                    //       forwardAmount: toNano("0.25"),
                    //       forwardPayload: VaultJetton.createSwapPayload({ poolAddress }),
                    //     });
                    //   }
                } catch (err) {
                    console.log(`Dedust Pool doen't exist for ${jetton0} and ${jetton1}`);
                }
                
                //   }
                // async function main() {
                    
                    //     const dedustClient = new DeDustClient({ endpointUrl: 'https://api.dedust.io' });
                    //     const pools = await dedustClient.getPools();
                    //     console.log('Pools:', pools.assets[0]);
                    // }
                    // main();
            }
evaluate_dedust_limit();


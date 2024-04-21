const { parentPort } = require('worker_threads');
const TonWeb = require("tonweb");
const { Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS } = require('@ston-fi/sdk');
const { Factory, MAINNET_FACTORY_ADDR } = requrire('@dedust/sdk');
const { Address, TonClient4 } = require("@ton/ton");
const { url_pair_info } = require('./constant');
const { ReadinessStatus } = require('@dedust/sdk');
const { toNano } = require('@ton/core');
const axios = require('axios');  // send HTTP/s request and gets respond (info)
let pair_infos = [];

parentPort.on('message', async (walletAddress) => {
  console.log(`Worker received message: ${walletAddress}`);
  await axios.get(url_pair_info)
  .then(response => {
    if( response.data ) {
      pair_infos = Array.from(response.data);
      console.log(pair_infos);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
  mainloop(walletAddress)
  // setInterval( mainloop(walletAddress), 1000);
  parentPort.postMessage("Bot is Successfully Running");
});

function mainloop(walletAddress) {
  console.log("mainloop");
  for( let i = 0 ; i < pair_infos.length; i ++){
    evaluate_ston_fi_limit(walletAddress, pair_infos[i].jetton0, pair_infos[i].jetton1, pair_infos[i].sell_limit, pair_infos[i].buy_limit);
    evaluate_dedust_limit(walletAddress, pair_infos[i].jetton0, pair_infos[i].jetton1, pair_infos[i].sell_limit, pair_infos[i].buy_limit);
  }
}

async function evaluate_ston_fi_limit(walletAddress, jetton0, jetton1, sell_limit, buy_limit){
  console.log("evaluate_limit");
  const WALLET_ADDRESS = walletAddress; // ! replace with your address
  // const OWNER_ADDRESS = '0QC3-tDA6CQt6qJ8jZ3StmJmaleEKs896GxT8BrrfUstslMW';

  const JETTON0 = 'EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv';
  const JETTON1 = 'EQC_1YoM8RBixN95lz7odcF3Vrkc_N8Ne7gQi7Abtlet_Efi';
  // const JETTON0 = jetton0;
  // const JETTON1 = jetton1;

  const provider = new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: "eb60bdf9abb69408d86f64a8cf18d98e0267a079b6f7941328e5085122151a01",
  });

  const router = new Router(provider, {
    revision: ROUTER_REVISION.V1,
    address: ROUTER_REVISION_ADDRESS.V1,
  });

  const pool = await router.getPool({
    jettonAddresses: [JETTON0, JETTON1],
  });
  const poolData = await pool.getData();
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
  if ( reserveB / reserveA > sell_limit)
  {
    console.log("sell_limit");
      
    // transaction to swap 1.0 JETTON0 to JETTON1 but not less than 1 nano JETTON1
    const swapTxParams = await router.buildSwapJettonTxParams({
      // address of the wallet that holds offerJetton you want to swap
      userWalletAddress: WALLET_ADDRESS,
      // address of the jetton you want to swap
      offerJettonAddress: JETTON0,
      // amount of the jetton you want to swap
      offerAmount: new TonWeb.utils.BN('1000000000'),
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
  else if ( reserveB / reserveA < buy_limit){
    console.log("buy_limit");
      
    // transaction to swap 1.0 JETTON0 to JETTON1 but not less than 1 nano JETTON1
    const swapTxParams = await router.buildSwapJettonTxParams({
      // address of the wallet that holds offerJetton you want to swap
      userWalletAddress: WALLET_ADDRESS,
      // address of the jetton you want to swap
      offerJettonAddress: JETTON1,
      // amount of the jetton you want to swap
      offerAmount: new TonWeb.utils.BN('1000000000'),
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
}

async function evaluate_dedust_limit(walletAddress, jetton0, jetton1, sell_limit, buy_limit){

  const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
  const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
  const Jetton0 = 'EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv';
  const Jetton1 = 'EQC_1YoM8RBixN95lz7odcF3Vrkc_N8Ne7gQi7Abtlet_Efi';
  const tonVault = tonClient.open(await factory.getJettonVault(Jetton0));
  // const Jetton0 = Address.parse('EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE');
  // const Jetton1 = Address.parse('EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE');

  const Jetton0_Asset = Asset.jetton(Jetton0);
  const Jetton1_Asset = Asset.jetton(Jetton1);

  const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [Jetton0_Asset, Jetton1_Asset]));
    // Check if pool exists:
  if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
    throw new Error('Pool (TON, SCALE) does not exist.');
  }

  // Check if vault exits:
  if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
    throw new Error('Vault (TON) does not exist.');
  }

  let reserve = await pool.get_reserves();
  let reserveA = Number(BigInt(reserve.reserve0));
  let reserveB = Number(BigInt(reserve.reserve1));
  if ( reserveB / reserveA > sell_limit)
  {
    const amountIn = toNano('5'); // 5 TON

    await tonVault.sendSwap(sender, {
      poolAddress: pool.address,
      amount: amountIn,
      gasAmount: toNano("0.25"),
    });
  }
  else ( reserveB / reserveA < buy_limit)
  {

  }

}

const { parentPort } = require('worker_threads');
const TonWeb = require("tonweb");
const { Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS } = require('@ston-fi/sdk');
const { url_pair_info } = require('./constant');
const axios = require('axios');  // send HTTP/s request and gets respond (info)
let pair_infos = [];

parentPort.on('message', (walletAddress) => {
  console.log(`Worker received message: ${walletAddress}`);
  axios.get(url_pair_info)
  .then(response => {
    if( response.data ) {
      pair_infos = Array.from(response.data);
      console.log(pair_infos);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
  
  setInterval( mainloop(walletAddress), 1000);
  parentPort.postMessage("Bot is Successfully Running");
});

function mainloop(walletAddress) {
  for( let i = 0 ; i < pair_infos.length; i ++){
    evaluate_limit(walletAddress, pair_infos[i].jetton0, pair_infos[i].jetton1, pair_infos[i].sell_limit, pair_infos[i].buy_limit);
  }
}

async function evaluate_limit(walletAddress, jetton0, jetton1, sell_limit, buy_limit){
  const WALLET_ADDRESS = walletAddress; // ! replace with your address
  // const OWNER_ADDRESS = '0QC3-tDA6CQt6qJ8jZ3StmJmaleEKs896GxT8BrrfUstslMW';

  const JETTON0 = jetton0;
  const JETTON1 = jetton1;

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
}
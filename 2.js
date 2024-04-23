const TonWeb = require("tonweb");

const { Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS } = require('@ston-fi/sdk');

async function main () {
  const WALLET_ADDRESS = 'kQDLNnckpP-gJeTcrs1BA0gHVMBzplXg2EPDoPL-_EIYnfof'; // ! replace with your address
  const JETTON0 = 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO'; // STON
  const PROXY_TON = 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez'; // ProxyTON

  const provider = new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: "eb60bdf9abb69408d86f64a8cf18d98e0267a079b6f7941328e5085122151a01",
  });

  const router = new Router(provider, {
    revision: ROUTER_REVISION.V1,
    address: ROUTER_REVISION_ADDRESS.V1,
  });

  const pool = await router.getPool({
    jettonAddresses: [JETTON0, PROXY_TON],
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
  console.log(poolData)
  // const expectedLiquidityData = await pool.getExpectedLiquidity({
  //   jettonAmount: new TonWeb.utils.BN(500000000),
  // });

  // const { amount0, amount1 } = expectedLiquidityData;

  // const expectedLpTokensAmount = await pool.getExpectedTokens({
  //   amount0: new TonWeb.utils.BN(500000000),
  //   amount1: new TonWeb.utils.BN(200000000),
  // });

  // if (token0WalletAddress) {
  //   const expectedOutputsData = await pool.getExpectedOutputs({
  //     amount: new TonWeb.utils.BN(500000000),
  //     jettonWallet: token0WalletAddress,
  //   });

  //   const { jettonToReceive, protocolFeePaid, refFeePaid } =
  //     expectedOutputsData;
  // }

  // const lpAccountAddress = await pool.getLpAccountAddress({
  //   ownerAddress: OWNER_ADDRESS,
  // });

  // const lpAccount = await pool.getLpAccount({ ownerAddress: OWNER_ADDRESS });

  // if (lpAccount) {
  //   const lpAccountData = await lpAccount.getData();
  //   const { userAddress, poolAddress, amount0, amount1 } = lpAccountData;
  // }
  };

  main();
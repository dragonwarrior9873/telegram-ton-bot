const { parentPort } = require('worker_threads');
const TonWeb = require("tonweb");
const { Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS, Pool, PoolRevisionV1 } = require('@ston-fi/sdk');
const { Factory, MAINNET_FACTORY_ADDR, ReadinessStatus, Asset, VaultNative, JettonRoot, JettonWallet, PoolType, VaultJetton } = require('@dedust/sdk');
const { Address, TonClient4, TonClient, WalletContractV4, internal, WalletContractV3R2, } = require("@ton/ton");
const { url_pair_info, url_wallet_info } = require('./constant');
const { toNano } = require('@ton/core');
const axios = require('axios');  // send HTTP/s request and gets respond (info)
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { getHttpEndpoint } = require("@orbs-network/ton-access");

let pair_infos = [];

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
    // await evaluate_ston_fi_limit(walletAddress, pair_infos[i].jetton0, pair_infos[i].jetton1, pair_infos[i].sell_limit, pair_infos[i].buy_limit);
    // sleep(1000);
    await evaluate_dedust_limit(walletAddress, pair_infos[i].jetton0, pair_infos[i].jetton1, pair_infos[i].sell_limit, pair_infos[i].buy_limit);
    sleep(3000);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function evaluate_ston_fi_limit(walletAddress, jetton0, jetton1, sell_limit, buy_limit) {
  console.log("...............evaluate_ston_fi_limit...................");
  const WALLET_ADDRESS = walletAddress;
  const JETTON0 = jetton0;
  const JETTON1 = jetton1;

  await sleep(1000); // Sleep for 2 seconds

  if (JETTON0 == "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez" || JETTON1 == "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez") {
    try {
      const JETTON2 = (JETTON0 == "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez") ? JETTON1 : JETTON0
      const PROXY_TON = 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez'; // ProxyTON
      // const JETTON2 = 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO'; // STON

      const provider = new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
        apiKey: "eb60bdf9abb69408d86f64a8cf18d98e0267a079b6f7941328e5085122151a01",
      });

      const router = new Router(provider, {
        revision: ROUTER_REVISION.V1,
        address: ROUTER_REVISION_ADDRESS.V1,
      });

      const pool = await router.getPool({
        jettonAddresses: [JETTON2, PROXY_TON],
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
      console.log("------------------");
      console.log(reserveB / reserveA);
      if (reserveB / reserveA > sell_limit) {
        console.log("sell_limit");
        await sleep(1000); // Sleep for 2 seconds

        const tonToJettonTxParams = await router.buildSwapProxyTonTxParams({
          // address of the wallet that holds TON you want to swap
          userWalletAddress: WALLET_ADDRESS,
          proxyTonAddress: PROXY_TON,
          // amount of the TON you want to swap
          offerAmount: new TonWeb.utils.BN('10000'),
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

        // open wallet v4 (notice the correct wallet version here)
        
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

        let key = await mnemonicToPrivateKey(mnemonics);
        let workchain = 0; // Usually you need a workchain 0
        let wallet = WalletContractV4.create({ workchain, publicKey: key.publicKey});

        // const mnemonic = "unfold sugar water ..."; // your 24 secret words (replace ... with the rest of the words)
        // const key = await mnemonicToWalletKey(mnemonic.split(" "));
        // const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

        // initialize ton rpc client on testnet
        const endpoint = await getHttpEndpoint({ network: "mainnet" });
        const client = new TonClient({ endpoint });

        // make sure wallet is deployed
        if (!await client.isContractDeployed(wallet.address)) {
          return console.log("wallet is not deployed");
        }

        // send 0.05 TON to EQA4V9tF4lY2S_J-sEQR7aUj9IwW-Ou2vJQlCn--2DLOLR5e
        const walletContract = client.open(wallet);
        const seqno = await walletContract.getSeqno();
        // await walletContract.send()
        await walletContract.sendTransfer({
          secretKey: key.secretKey,
          seqno: seqno,
          messages: [
            internal({
              to: tonToJettonTxParams.to,
              amount: tonToJettonTxParams.gasAmount,
              payload: tonToJettonTxParams.payload,
            })
          ]
        });

        // wait until confirmed
        let currentSeqno = seqno;
        while (currentSeqno == seqno) {
          console.log("waiting for transaction to confirm...");
          await sleep(1500);
          currentSeqno = await walletContract.getSeqno();
        }
        console.log("transaction confirmed!");

        console.log({
          to: tonToJettonTxParams.to,
          amount: tonToJettonTxParams.gasAmount,
          payload: tonToJettonTxParams.payload,
        });
        await sleep(30000);
      }
      else if (reserveB / reserveA < buy_limit) {
        console.log("buy_limit");
        await sleep(1000); // Sleep for 2 seconds
        // transaction to swap 1.0 JETTON0 to JETTON1 but not less than 1 nano JETTON1
        const tonToJettonTxParams = await router.buildSwapProxyTonTxParams({
          // address of the wallet that holds TON you want to swap
          userWalletAddress: WALLET_ADDRESS,
          proxyTonAddress: PROXY_TON,
          // amount of the TON you want to swap
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

        let key = await mnemonicToPrivateKey(mnemonics);
        let workchain = 0; // Usually you need a workchain 0
        let wallet = WalletContractV4.create({ workchain, publicKey: key.publicKey});

        // const mnemonic = "unfold sugar water ..."; // your 24 secret words (replace ... with the rest of the words)
        // const key = await mnemonicToWalletKey(mnemonic.split(" "));
        // const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

        // initialize ton rpc client on testnet
        const endpoint = await getHttpEndpoint({ network: "mainnet" });
        const client = new TonClient({ endpoint });

        // make sure wallet is deployed
        if (!await client.isContractDeployed(wallet.address)) {
          return console.log("wallet is not deployed");
        }

        // send 0.05 TON to EQA4V9tF4lY2S_J-sEQR7aUj9IwW-Ou2vJQlCn--2DLOLR5e
        const walletContract = client.open(wallet);
        const seqno = await walletContract.getSeqno();
        const cell = await walletContract.createTransfer({
          secretKey: key.secretKey,
          seqno: seqno,
          messages: [
            internal({
              to: tonToJettonTxParams.to,
              amount: tonToJettonTxParams.gasAmount,
              payload: tonToJettonTxParams.payload,
            })
          ]
        })

        await walletContract.send(cell);


        // await walletContract.sendTransfer({
        //   secretKey: key.secretKey,
        //   seqno: seqno,
        //   messages: [
        //     internal({
        //       to: tonToJettonTxParams.to,
        //       amount: tonToJettonTxParams.gasAmount,
        //       payload: tonToJettonTxParams.payload,
        //     })
        //   ]
        // });

        // wait until confirmed
        let currentSeqno = seqno;
        while (currentSeqno == seqno) {
          console.log("waiting for transaction to confirm...");
          await sleep(1500);
          currentSeqno = await walletContract.getSeqno();
        }
        console.log("transaction confirmed!");


        // to execute the transaction you need to send transaction to the blockchain
        // (replace with your wallet implementation, logging is used for demonstration purposes)
        console.log({
          to: tonToJettonTxParams.to,
          amount: tonToJettonTxParams.gasAmount,
          payload: tonToJettonTxParams.payload,
        });
      }
    } catch (err) {
      console.log(`ston.fi Pool doen't exist for ${jetton0} and ${jetton1}`);
    }
  }
  else {

    try {

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

}

async function evaluate_dedust_limit(walletAddress, jetton0, jetton1, sell_limit, buy_limit) {
  console.log("...............evaluate_dedust_limit...................");
  // NOTE: We will use tonVault to send a message.
  const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
  const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
  const tonVault = tonClient.open(await factory.getNativeVault());
  if (jetton0 == "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez" || jetton1 == "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez") {
    const JETTON1 = (jetton0 == "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez") ? Address.parse(jetton1) : Address.parse(jetton0);
    const SCALE = Asset.jetton(JETTON1);
    const TON = Asset.native();

    try {
      const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, SCALE]));
      
      let reserve = await pool.getReserves();
      let reserveA = Number(BigInt(reserve[0]));
      let reserveB = Number(BigInt(reserve[1]));
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

      let key = await mnemonicToPrivateKey(mnemonics);
      let workchain = 0; // Usually you need a workchain 0
      const wallet = tonClient.open(
        WalletContractV4.create({
            workchain: 0,
            publicKey: key.publicKey,
        }),
      );

      const address = await wallet.address.toString();
      const balance = await wallet.getBalance();
      console.log('balance:', balance);

      const sender = wallet.sender(key.secretKey);

      if (reserveB / reserveA > sell_limit) {
        console.log("Sell Limit arrived....", reserveB / reserveA, sell_limit);
        const swap_ = Number(BigInt(balance));
        const amountIn = toNano(BigInt(Math.floor(swap_ * 0.7))); // 5 TON
        await tonVault.sendSwap(sender, {
          poolAddress: pool.address,
          amount: amountIn,
          gasAmount: toNano("0.01"),
        });
        await sleep(30000);
        console.log('Swap Ton to Jetton Success!');
      }
      else if (reserveB / reserveA < buy_limit)
      {
        console.log("Buy Limit arrived....", reserveB / reserveA, buy_limit);
        amountIn = toNano('50'); // 50 SCALE
        const scaleRoot = tonClient.open(JettonRoot.createFromAddress(JETTON1));
        const scaleWallet = tonClient.open(await scaleRoot.getWallet(sender.address));
        const scaleVault = tonClient.open(await factory.getJettonVault(JETTON1));
        await scaleWallet.sendTransfer(sender, toNano("0.3"), {
          amount: amountIn,
          destination: scaleVault.address,
          responseAddress: sender.address, // return gas to user
          forwardAmount: toNano("0.01"),
          forwardPayload: VaultJetton.createSwapPayload({
            poolAddress:  pool.address
          }),
        });
        console.log('==================**********************=====================');
      }
    } catch (err) {
      console.log(`Dedust Pool doen't exist for ${jetton0} and ${jetton1}`);
    }
  }
  else {
    /* ... */
    const JETTON0 = Address.parse(jetton0);
    const JETTON1 = Address.parse(jetton1);
    const SCALE = Asset.jetton(JETTON1);
    const TON = Asset.native();
    const BOLT = Asset.jetton(JETTON0);

    const TON_SCALE = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, SCALE]));
    const TON_BOLT = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, BOLT]));

    // const TON = Asset.native();

    try {
      const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [BOLT, SCALE]));

      let reserve = await pool.getReserves();
      let reserveA = Number(BigInt(reserve[0]));
      let reserveB = Number(BigInt(reserve[1]));
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

      let key = await mnemonicToPrivateKey(mnemonics);
      let workchain = 0; // Usually you need a workchain 0
      const wallet = tonClient.open(
        WalletContractV4.create({
            workchain: 0,
            publicKey: key.publicKey,
        }),
      );

      const address = await wallet.address.toString();
      const balance = await wallet.getBalance();
      console.log('balance:', balance);

      const sender = wallet.sender(key.secretKey);

      if (reserveB / reserveA > sell_limit) {
        console.log("Sell Limit arrived....", reserveB / reserveA, sell_limit);
        const scaleRoot = tonClient.open(JettonRoot.createFromAddress(JETTON1));
        const scaleWallet = tonClient.open(await scaleRoot.getWallet(sender.address));
        const scaleVault = tonClient.open(await factory.getJettonVault(JETTON1));
        const amountIn = toNano('50'); // 50 SCALE
        await scaleWallet.sendTransfer(
          sender,
          toNano("0.3"), // 0.3 TON
          {
            amount: amountIn,
            destination: scaleVault.address,
            responseAddress: walletAddress, // return gas to user
            forwardAmount: toNano("0.25"),
            forwardPayload: VaultJetton.createSwapPayload({
              poolAddress: TON_SCALE.address, // first step: SCALE -> TON
              limit: toNano("0.001"),
              next: {
                poolAddress: TON_BOLT.address, // next step: TON -> BOLT
              },
            }),
          },
        );
      }

      else if (reserveB / reserveA < buy_limit)
      {
        const boltRoot = tonClient.open(JettonRoot.createFromAddress(JETTON0));
        const boltVault = tonClient.open(await factory.getJettonVault(JETTON0));
        const boltWallet = tonClient.open(await boltRoot.getWallet(sender.address));
        const amountIn = toNano('50'); // 50 SCALE
        await boltWallet.sendTransfer(
          sender,
          toNano("0.3"), // 0.3 TON
          {
            amount: amountIn,
            destination: boltVault.address,
            responseAddress: walletAddress, // return gas to user
            forwardAmount: toNano("0.25"),
            forwardPayload: VaultJetton.createSwapPayload({
              poolAddress: TON_BOLT.address, // first step: SCALE -> TON
              limit: toNano("0.001"),
              next: {
                poolAddress: TON_SCALE.address, // next step: TON -> BOLT
              },
            }),
          },
        );
      }
    } catch (err) {
      console.log(`Dedust Pool doen't exist for ${jetton0} and ${jetton1}`);
    }

  }

}

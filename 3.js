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
        const amountIn = toNano('0.2'); // 5 TON
        await tonVault.sendSwap(sender, {
          poolAddress: pool.address,
          amount: amountIn,
          gasAmount: toNano("0.25"),
        });
        console.log('Swap Ton to Jetton Success!');
      }
      else (reserveB / reserveA < buy_limit)
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
          forwardAmount: toNano("0.25"),
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
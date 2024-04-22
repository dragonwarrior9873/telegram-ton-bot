(function(r, a) {
    typeof exports == "object" && typeof module < "u" ? a(exports, require("tonweb")) : typeof define == "function" && define.amd ? define(["exports", "tonweb"], a) : (r = typeof globalThis < "u" ? globalThis : r || self, a(r["ston-sdk"] = {}, r.TonWeb))
})(this, function(r, a) {
    "use strict";
    const A = {
            ADD_LIQUIDITY: 1935855772,
            SWAP: 630424929,
            PROVIDE_LIQUIDITY: 4244235663,
            DIRECT_ADD_LIQUIDITY: 1291331587,
            REFUND: 200537159,
            RESET_GAS: 1117846339,
            COLLECT_FEES: 533429565,
            REQUEST_BURN: 1499400124
        },
        S = {
            V1: "V1"
        },
        nt = {
            [S.V1]: "EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt"
        },
        {
            Address: ot
        } = a,
        L = (o, t, s) => {
            let e = BigInt(0);
            for (let n = 0; n < s; n++) e *= BigInt(2), e += BigInt(o.get(t + n));
            return e
        },
        u = o => {
            try {
                let t = L(o.bits, 3, 8);
                t > BigInt(127) && (t = t - BigInt(256));
                const s = L(o.bits, 3 + 8, 256);
                if (t.toString(10) + ":" + s.toString(16) == "0:0") return null;
                const e = t.toString(10) + ":" + s.toString(16).padStart(64, "0");
                return new ot(e)
            } catch {
                return null
            }
        },
        {
            boc: {
                Cell: b
            },
            utils: {
                BN: h
            }
        } = a;
    class _ {
        constructor() {
            this.createRefundBody = async (t, s) => {
                const e = new b;
                return e.bits.writeUint(A.REFUND, 32), e.bits.writeUint((s == null ? void 0 : s.queryId) ?? 0, 64), e
            }, this.createDirectAddLiquidityBody = async (t, s) => {
                const e = new b;
                return e.bits.writeUint(A.DIRECT_ADD_LIQUIDITY, 32), e.bits.writeUint(s.queryId ?? 0, 64), e.bits.writeCoins(new h(s.amount0)), e.bits.writeCoins(new h(s.amount1)), e.bits.writeCoins(new h(s.minimumLpToMint ?? 1)), e
            }, this.createResetGasBody = async (t, s) => {
                const e = new b;
                return e.bits.writeUint(A.RESET_GAS, 32), e.bits.writeUint((s == null ? void 0 : s.queryId) ?? 0, 64), e
            }, this.getData = async t => {
                const s = await t.getAddress(),
                    e = await t.provider.call2(s.toString(), "get_lp_account_data");
                return {
                    userAddress: u(e[0]),
                    poolAddress: u(e[1]),
                    amount0: e[2],
                    amount1: e[3]
                }
            }
        }
        get gasConstants() {
            return {
                refund: new h(5e8),
                directAddLp: new h(3e8),
                resetGas: new h(3e8)
            }
        }
    }
    const {
        Contract: rt,
        utils: {
            BN: k
        }
    } = a, F = {
        [S.V1]: _
    };
    class W extends rt {
        constructor(t, {
            revision: s,
            ...e
        }) {
            if (super(t, e), typeof s == "string") {
                if (!F[s]) throw Error(`Unknown account revision: ${s}`);
                this.revision = new F[s]
            } else this.revision = s
        }
        get gasConstants() {
            return this.revision.gasConstants
        }
        async createRefundBody(t) {
            return this.revision.createRefundBody(this, t)
        }
        async createDirectAddLiquidityBody(t) {
            return this.revision.createDirectAddLiquidityBody(this, t)
        }
        async createResetGasBody(t) {
            return this.revision.createResetGasBody(this, t)
        }
        async getData() {
            return await this.revision.getData(this)
        }
        async buildRefundTxParams(t) {
            const s = await this.getAddress(),
                e = await this.createRefundBody({
                    queryId: t == null ? void 0 : t.queryId
                }),
                n = new k((t == null ? void 0 : t.gasAmount) ?? this.gasConstants.refund);
            return {
                to: s,
                payload: e,
                gasAmount: n
            }
        }
        async buildDirectAddLiquidityTxParams(t) {
            const s = await this.getAddress(),
                e = await this.createDirectAddLiquidityBody({
                    amount0: t.amount0,
                    amount1: t.amount1,
                    minimumLpToMint: t.minimumLpToMint,
                    queryId: t.queryId
                }),
                n = new k(t.gasAmount ?? this.gasConstants.directAddLp);
            return {
                to: s,
                payload: e,
                gasAmount: n
            }
        }
        async buildResetGasTxParams(t) {
            const s = await this.getAddress(),
                e = await this.createResetGasBody({
                    queryId: t == null ? void 0 : t.queryId
                }),
                n = new k((t == null ? void 0 : t.gasAmount) ?? this.gasConstants.resetGas);
            return {
                to: s,
                payload: e,
                gasAmount: n
            }
        }
    }
    const {
        utils: {
            BN: E,
            bytesToBase64: J
        },
        boc: {
            Cell: C
        },
        Address: D
    } = a;
    class P {
        constructor() {
            this.createCollectFeesBody = async (t, s) => {
                const e = new C;
                return e.bits.writeUint(A.COLLECT_FEES, 32), e.bits.writeUint((s == null ? void 0 : s.queryId) ?? 0, 64), e
            }, this.createBurnBody = async (t, s) => {
                const e = new C;
                return e.bits.writeUint(A.REQUEST_BURN, 32), e.bits.writeUint(s.queryId ?? 0, 64), e.bits.writeCoins(new E(s.amount)), e.bits.writeAddress(new D(s.responseAddress)), e
            }, this.getExpectedOutputs = async (t, s) => {
                const e = new C;
                e.bits.writeAddress(new D(s.jettonWallet));
                const n = J(await e.toBoc(!1)),
                    i = await t.getAddress(),
                    d = await t.provider.call2(i.toString(), "get_expected_outputs", [
                        ["int", s.amount.toString()],
                        ["tvm.Slice", n]
                    ]);
                return {
                    jettonToReceive: d[0],
                    protocolFeePaid: d[1],
                    refFeePaid: d[2]
                }
            }, this.getExpectedTokens = async (t, s) => {
                const e = await t.getAddress();
                return await t.provider.call2(e.toString(), "get_expected_tokens", [
                    ["int", s.amount0.toString()],
                    ["int", s.amount1.toString()]
                ])
            }, this.getExpectedLiquidity = async (t, s) => {
                const e = await t.getAddress(),
                    n = await t.provider.call2(e.toString(), "get_expected_liquidity", [
                        ["int", s.jettonAmount.toString()]
                    ]);
                return {
                    amount0: n[0],
                    amount1: n[1]
                }
            }, this.getLpAccountAddress = async (t, s) => {
                const e = new C;
                e.bits.writeAddress(new D(s.ownerAddress));
                const n = J(await e.toBoc(!1)),
                    i = await t.getAddress(),
                    d = await t.provider.call2(i.toString(), "get_lp_account_address", [
                        ["tvm.Slice", n]
                    ]);
                return u(d)
            }, this.constructLpAccountRevision = t => new _, this.getData = async t => {
                const s = await t.getAddress(),
                    e = await t.provider.call2(s.toString(), "get_pool_data");
                return {
                    reserve0: e[0],
                    reserve1: e[1],
                    token0WalletAddress: u(e[2]),
                    token1WalletAddress: u(e[3]),
                    lpFee: e[4],
                    protocolFee: e[5],
                    refFee: e[6],
                    protocolFeeAddress: u(e[7]),
                    collectedToken0ProtocolFee: e[8],
                    collectedToken1ProtocolFee: e[9]
                }
            }
        }
        get gasConstants() {
            return {
                collectFees: new E(11e8),
                burn: new E(5e8)
            }
        }
    }
    const {
        Address: $,
        utils: {
            BN: O
        },
        token: {
            jetton: {
                JettonMinter: it,
                JettonWallet: dt
            }
        }
    } = a, V = {
        [S.V1]: P
    };
    class M extends it {
        constructor(t, {
            revision: s,
            ...e
        }) {
            if (super(t, e), typeof s == "string") {
                if (!V[s]) throw Error(`Unknown pool revision: ${s}`);
                this.revision = new V[s]
            } else this.revision = s
        }
        get gasConstants() {
            return this.revision.gasConstants
        }
        async createCollectFeesBody(t) {
            return this.revision.createCollectFeesBody(this, t)
        }
        async createBurnBody(t) {
            return this.revision.createBurnBody(this, t)
        }
        async getExpectedOutputs(t) {
            return this.revision.getExpectedOutputs(this, t)
        }
        async getExpectedTokens(t) {
            return this.revision.getExpectedTokens(this, t)
        }
        async getExpectedLiquidity(t) {
            return this.revision.getExpectedLiquidity(this, t)
        }
        async getJettonWallet(t) {
            const s = await this.getJettonWalletAddress(new $(t.ownerAddress));
            return new dt(this.provider, {
                address: s
            })
        }
        async getLpAccountAddress(t) {
            return await this.revision.getLpAccountAddress(this, t)
        }
        async getLpAccount(t) {
            const s = await this.getLpAccountAddress(t);
            return s ? new W(this.provider, {
                address: s,
                revision: this.revision.constructLpAccountRevision(this)
            }) : null
        }
        async getData() {
            return this.revision.getData(this)
        }
        async buildCollectFeeTxParams(t) {
            const s = await this.getAddress(),
                e = await this.createCollectFeesBody({
                    queryId: t == null ? void 0 : t.queryId
                }),
                n = new O((t == null ? void 0 : t.gasAmount) ?? this.gasConstants.collectFees);
            return {
                to: s,
                payload: e,
                gasAmount: n
            }
        }
        async buildBurnTxParams(t) {
            const s = await this.getJettonWalletAddress(new $(t.responseAddress)),
                e = await this.createBurnBody({
                    amount: t.amount,
                    responseAddress: t.responseAddress,
                    queryId: t.queryId
                }),
                n = new O((t == null ? void 0 : t.gasAmount) ?? this.gasConstants.burn);
            return {
                to: s,
                payload: e,
                gasAmount: n
            }
        }
    }
    const {
        utils: {
            BN: j
        },
        boc: {
            Cell: at
        },
        Address: x
    } = a;

    function f(o) {
        const t = new at;
        return t.bits.writeUint(260734629, 32), t.bits.writeUint(o.queryId, 64), t.bits.writeCoins(new j(o.amount)), t.bits.writeAddress(new x(o.destination)), t.bits.writeAddress(o.responseDestination ? new x(o.responseDestination) : void 0), o.customPayload ? (t.refs.push(o.customPayload), t.bits.writeBit(!0)) : t.bits.writeBit(!1), t.bits.writeCoins(new j(o.forwardTonAmount)), o.forwardPayload ? (t.refs.push(o.forwardPayload), t.bits.writeBit(!0)) : t.bits.writeBit(!1), t
    }

    function B(o) {
        return !o.isZero()
    }
    const {
        Address: I,
        utils: {
            BN: v,
            bytesToBase64: G
        },
        boc: {
            Cell: R
        }
    } = a;
    class m {
        constructor() {
            this.createSwapBody = async (t, s) => {
                const e = new R;
                return e.bits.writeUint(A.SWAP, 32), e.bits.writeAddress(new I(s.askJettonWalletAddress)), e.bits.writeCoins(new v(s.minAskAmount)), e.bits.writeAddress(new I(s.userWalletAddress)), s.referralAddress ? (e.bits.writeUint(1, 1), e.bits.writeAddress(new I(s.referralAddress))) : e.bits.writeUint(0, 1), e
            }, this.createProvideLiquidityBody = async (t, s) => {
                const e = new R;
                return e.bits.writeUint(A.PROVIDE_LIQUIDITY, 32), e.bits.writeAddress(new I(s.routerWalletAddress)), e.bits.writeCoins(new v(s.minLpOut)), e
            }, this.getPoolAddress = async (t, s) => {
                const e = new R;
                e.bits.writeAddress(new I(s.token0));
                const n = new R;
                n.bits.writeAddress(new I(s.token1));
                const i = G(await e.toBoc(!1)),
                    d = G(await n.toBoc(!1)),
                    c = await t.getAddress(),
                    w = await t.provider.call2(c.toString(), "get_pool_address", [
                        ["tvm.Slice", i],
                        ["tvm.Slice", d]
                    ]);
                return u(w)
            }, this.getData = async t => {
                const s = await t.getAddress(),
                    e = await t.provider.call2(s.toString(), "get_router_data", []);
                return {
                    isLocked: B(e[0]),
                    adminAddress: u(e[1]),
                    tempUpgrade: e[2],
                    poolCode: e[3],
                    jettonLpWalletCode: e[4],
                    lpAccountCode: e[5]
                }
            }, this.constructPoolRevision = t => new P
        }
        get gasConstants() {
            return {
                swap: new v(3e8),
                provideLp: new v(3e8),
                swapForward: new v(265e6),
                provideLpForward: new v(265e6)
            }
        }
    }
    const {
        Address: Q,
        Contract: ct,
        utils: {
            BN: g
        },
        token: {
            jetton: {
                JettonMinter: l
            }
        }
    } = a, K = {
        [S.V1]: m
    };
    class ut extends ct {
        constructor(t, {
            revision: s,
            ...e
        }) {
            if (super(t, e), typeof s == "string") {
                if (!K[s]) throw Error(`Unknown router revision: ${s}`);
                this.revision = new K[s]
            } else this.revision = s
        }
        get gasConstants() {
            return this.revision.gasConstants
        }
        async createSwapBody(t) {
            return this.revision.createSwapBody(this, t)
        }
        async createProvideLiquidityBody(t) {
            return this.revision.createProvideLiquidityBody(this, t)
        }
        async getPoolAddress(t) {
            return this.revision.getPoolAddress(this, t)
        }
        async getPool(t) {
            const s = new l(this.provider, {
                    address: t.jettonAddresses[0]
                }),
                e = new l(this.provider, {
                    address: t.jettonAddresses[1]
                }),
                n = await this.getAddress(),
                i = await s.getJettonWalletAddress(n),
                d = await e.getJettonWalletAddress(n),
                c = await this.getPoolAddress({
                    token0: i,
                    token1: d
                });
            return c ? new M(this.provider, {
                address: c,
                revision: this.revision.constructPoolRevision(this)
            }) : null
        }
        async getData() {
            return await this.revision.getData(this)
        }
        async buildSwapJettonTxParams(t) {
            const s = new l(this.provider, {
                    address: t.offerJettonAddress
                }),
                e = new l(this.provider, {
                    address: t.askJettonAddress
                }),
                n = await s.getJettonWalletAddress(new Q(t.userWalletAddress)),
                i = await e.getJettonWalletAddress(await this.getAddress()),
                d = await this.createSwapBody({
                    userWalletAddress: t.userWalletAddress,
                    minAskAmount: t.minAskAmount,
                    askJettonWalletAddress: i,
                    referralAddress: t.referralAddress
                }),
                c = new g(t.forwardGasAmount ?? this.gasConstants.swapForward),
                w = f({
                    queryId: t.queryId ?? 0,
                    amount: t.offerAmount,
                    destination: await this.getAddress(),
                    forwardTonAmount: c,
                    forwardPayload: d
                }),
                y = new g(t.gasAmount ?? this.gasConstants.swap);
            return {
                to: n,
                payload: w,
                gasAmount: y
            }
        }
        async buildSwapProxyTonTxParams(t) {
            const s = new l(this.provider, {
                    address: t.proxyTonAddress
                }),
                e = new l(this.provider, {
                    address: t.askJettonAddress
                }),
                n = await s.getJettonWalletAddress(await this.getAddress()),
                i = await e.getJettonWalletAddress(await this.getAddress()),
                d = await this.createSwapBody({
                    userWalletAddress: t.userWalletAddress,
                    minAskAmount: t.minAskAmount,
                    askJettonWalletAddress: i,
                    referralAddress: t.referralAddress
                }),
                c = new g(t.forwardGasAmount ?? this.gasConstants.swapForward),
                w = f({
                    queryId: t.queryId ?? 0,
                    amount: t.offerAmount,
                    destination: await this.getAddress(),
                    forwardTonAmount: c,
                    forwardPayload: d
                }),
                y = new g(t.offerAmount).add(c);
            return {
                to: n,
                payload: w,
                gasAmount: y
            }
        }
        async buildProvideLiquidityJettonTxParams(t) {
            const s = new l(this.provider, {
                    address: t.sendTokenAddress
                }),
                e = new l(this.provider, {
                    address: t.otherTokenAddress
                }),
                n = await s.getJettonWalletAddress(new Q(t.userWalletAddress)),
                i = await e.getJettonWalletAddress(await this.getAddress()),
                d = await this.createProvideLiquidityBody({
                    routerWalletAddress: i,
                    minLpOut: t.minLpOut
                }),
                c = new g(t.forwardGasAmount ?? this.gasConstants.provideLpForward),
                w = f({
                    queryId: t.queryId ?? 0,
                    amount: t.sendAmount,
                    destination: await this.getAddress(),
                    forwardTonAmount: c,
                    forwardPayload: d
                }),
                y = new g(t.gasAmount ?? this.gasConstants.provideLp);
            return {
                to: n,
                payload: w,
                gasAmount: y
            }
        }
        async buildProvideLiquidityProxyTonTxParams(t) {
            const s = new l(this.provider, {
                    address: t.proxyTonAddress
                }),
                e = new l(this.provider, {
                    address: t.otherTokenAddress
                }),
                n = await s.getJettonWalletAddress(await this.getAddress()),
                i = await e.getJettonWalletAddress(await this.getAddress()),
                d = await this.createProvideLiquidityBody({
                    routerWalletAddress: i,
                    minLpOut: t.minLpOut
                }),
                c = new g(t.forwardGasAmount ?? this.gasConstants.provideLp),
                w = f({
                    queryId: t.queryId ?? 0,
                    amount: t.sendAmount,
                    destination: await this.getAddress(),
                    forwardTonAmount: c,
                    forwardPayload: d
                }),
                y = new g(t.sendAmount).add(c);
            return {
                to: n,
                payload: w,
                gasAmount: y
            }
        }
    }
    const T = {
            STAKE: 1858722917,
            CLAIM_REWARDS: 2027548937,
            UNSTAKE: 3106497952
        },
        U = {
            V2: "V2"
        };

    function Y(o) {
        return new TextDecoder().decode(o.bits.getTopUppedArray())
    }
    const {
        utils: {
            BN: p
        },
        boc: {
            Cell: lt
        }
    } = a;
    class X {
        constructor() {
            this.createStakeBody = async t => {
                const s = new lt;
                return s.bits.writeUint(T.STAKE, 32), s
            }, this.getPendingData = async t => {
                const s = await t.getAddress(),
                    e = await t.provider.call2(s.toString(), "get_pending_data");
                return {
                    changeCustodianTs: e[0],
                    sendMsgTs: e[1],
                    codeUpgradeTs: e[2],
                    newCustodian: u(e[3]),
                    pendingMsg: e[4],
                    newCode: e[5],
                    newStorage: e[6]
                }
            }, this.getVersion = async t => {
                const s = await t.getAddress(),
                    e = await t.provider.call2(s.toString(), "get_version");
                return {
                    major: e[0],
                    minor: e[1],
                    development: Y(e[2])
                }
            }, this.getData = async t => {
                const s = await t.getAddress(),
                    e = await t.provider.call2(s.toString(), "get_farming_minter_data"),
                    n = u(e[14]);
                if (!n) throw new Error(`Failed to parse stakingTokenWallet from cell: ${e[14]}`);
                const i = u(e[15]);
                if (!i) throw new Error(`Failed to parse rewardTokenWallet from cell: ${e[15]}`);
                return {
                    nextItemIndex: e[0],
                    lastUpdateTime: e[1],
                    status: e[2],
                    depositedNanorewards: e[3],
                    currentStakedTokens: e[4],
                    accruedPerUnitNanorewards: e[5],
                    claimedFeeNanorewards: e[6],
                    accruedFeeNanorewards: e[7],
                    accruedNanorewards: e[8],
                    claimedNanorewards: e[9],
                    contractUniqueId: e[10],
                    nanorewardsPer24h: e[11],
                    adminFee: e[12],
                    minStakeTime: e[13],
                    stakingTokenWallet: n,
                    rewardTokenWallet: i,
                    custodianAddress: u(e[16]),
                    canChangeCustodian: B(e[17]),
                    canSendRawMsg: B(e[18]),
                    canChangeFee: B(e[19]),
                    unrestrictedDepositRewards: B(e[20]),
                    soulboundItems: !0
                }
            }
        }
        get gasConstants() {
            return {
                stake: new p(3e8),
                stakeForward: new p(25e7)
            }
        }
    }
    const {
        Address: wt,
        utils: {
            BN: Z
        },
        token: {
            nft: {
                NftCollection: At
            },
            jetton: {
                JettonMinter: gt,
                JettonWallet: yt
            }
        }
    } = a, z = {
        [U.V2]: X
    };
    class ht extends At {
        constructor(t, {
            revision: s,
            ...e
        }) {
            if (super(t, e), typeof s == "string") {
                if (!z[s]) throw Error(`Unknown pool revision: ${s}`);
                this.revision = new z[s]
            } else this.revision = s
        }
        get gasConstants() {
            return this.revision.gasConstants
        }
        async createStakeBody() {
            return this.revision.createStakeBody(this)
        }
        async getStakingJettonAddress() {
            const {
                stakingTokenWallet: t
            } = await this.getData(), s = new yt(this.provider, {
                address: t
            }), {
                jettonMinterAddress: e
            } = await s.getData();
            return e
        }
        async getPendingData() {
            return this.revision.getPendingData(this)
        }
        async getVersion() {
            return this.revision.getVersion(this)
        }
        async getData() {
            return this.revision.getData(this)
        }
        async buildStakeTxParams(t) {
            const e = await new gt(this.provider, {
                    address: t.jettonAddress
                }).getJettonWalletAddress(new wt(t.userWalletAddress)),
                n = await this.createStakeBody(),
                i = new Z(t.forwardGasAmount ?? this.gasConstants.stakeForward),
                d = f({
                    queryId: t.queryId ?? 0,
                    amount: t.jettonAmount,
                    destination: await this.getAddress(),
                    responseDestination: t.userWalletAddress,
                    forwardTonAmount: i,
                    forwardPayload: n
                }),
                c = new Z(t.gasAmount ?? this.gasConstants.stake);
            return {
                to: e,
                payload: d,
                gasAmount: c
            }
        }
    }
    const {
        boc: {
            Cell: ft
        }
    } = a;

    function H(o) {
        const t = new ft;
        return t.bits.writeUint(520377210, 32), t.bits.writeUint((o == null ? void 0 : o.queryId) ?? 0, 64), t
    }
    const {
        utils: {
            BN: N
        },
        boc: {
            Cell: tt
        }
    } = a;
    class et {
        constructor() {
            this.createClaimRewardsBody = async (t, s) => {
                const e = new tt;
                return e.bits.writeUint(T.CLAIM_REWARDS, 32), e.bits.writeUint((s == null ? void 0 : s.queryId) ?? 0, 64), e
            }, this.createUnstakeBody = async (t, s) => {
                const e = new tt;
                return e.bits.writeUint(T.UNSTAKE, 32), e.bits.writeUint((s == null ? void 0 : s.queryId) ?? 0, 64), e
            }, this.createDestroyBody = async (t, s) => H({
                queryId: (s == null ? void 0 : s.queryId) ?? 0
            }), this.getFarmingData = async t => {
                const s = await t.getAddress(),
                    e = await t.provider.call2(s.toString(), "get_farming_data");
                return {
                    status: e[0],
                    revokeTime: e[1],
                    stakedTokens: e[2],
                    claimedPerUnitNanorewards: e[3],
                    stakeDate: e[4],
                    isSoulbound: !0
                }
            }
        }
        get gasConstants() {
            return {
                claimRewards: new N(3e8),
                unstake: new N(4e8),
                destroy: new N(5e7)
            }
        }
    }
    const {
        utils: {
            BN: q
        },
        token: {
            nft: {
                NftItem: Bt
            }
        }
    } = a, st = {
        [U.V2]: et
    };
    class It extends Bt {
        constructor(t, {
            revision: s,
            ...e
        }) {
            if (super(t, e), typeof s == "string") {
                if (!st[s]) throw Error(`Unknown farm NFT item revision: ${s}`);
                this.revision = new st[s]
            } else this.revision = s
        }
        get gasConstants() {
            return this.revision.gasConstants
        }
        async createClaimRewardsBody(t) {
            return this.revision.createClaimRewardsBody(this, t)
        }
        async createDestroyBody(t) {
            return this.revision.createDestroyBody(this, t)
        }
        async createUnstakeBody(t) {
            return this.revision.createUnstakeBody(this, t)
        }
        async getFarmingData() {
            return await this.revision.getFarmingData(this)
        }
        async buildClaimRewardsTxParams(t) {
            const s = await this.getAddress(),
                e = await this.createClaimRewardsBody({
                    queryId: t == null ? void 0 : t.queryId
                }),
                n = new q((t == null ? void 0 : t.gasAmount) ?? this.gasConstants.claimRewards);
            return {
                to: s,
                payload: e,
                gasAmount: n
            }
        }
        async buildUnstakeTxParams(t) {
            const s = await this.getAddress(),
                e = await this.createUnstakeBody({
                    queryId: t == null ? void 0 : t.queryId
                }),
                n = new q((t == null ? void 0 : t.gasAmount) ?? this.gasConstants.unstake);
            return {
                to: s,
                payload: e,
                gasAmount: n
            }
        }
        async buildDestroyTxParams(t) {
            const s = await this.getAddress(),
                e = await this.createDestroyBody({
                    queryId: t == null ? void 0 : t.queryId
                }),
                n = new q((t == null ? void 0 : t.gasAmount) ?? this.gasConstants.destroy);
            return {
                to: s,
                payload: e,
                gasAmount: n
            }
        }
    }
    const vt = u;
    r.DEX_OP_CODES = A, r.FARM_OP_CODES = T, r.FARM_REVISION = U, r.FarmNftItem = It, r.FarmNftItemRevisionV2 = et, r.FarmNftMinter = ht, r.FarmNftMinterRevisionV2 = X, r.LpAccount = W, r.LpAccountRevisionV1 = _, r.Pool = M, r.PoolRevisionV1 = P, r.ROUTER_REVISION = S, r.ROUTER_REVISION_ADDRESS = nt, r.Router = ut, r.RouterRevisionV1 = m, r.createJettonTransferMessage = f, r.createSbtDestroyMessage = H, r.parseAddress = u, r.parseAddressFromCell = vt, r.parseBoolean = B, r.parseString = Y, Object.defineProperty(r, Symbol.toStringTag, {
        value: "Module"
    })
});
//# sourceMappingURL=index.umd.cjs.map
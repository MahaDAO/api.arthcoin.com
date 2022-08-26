import { ethers } from "ethers";

const request = require('request-promise');
const chunk = require('chunk')

import { getBscToken, getBscPoolInfo } from './bscTokenFormat'
import { getPoolPrices } from "./bscPoolPrices"

function getParameterCaseInsensitive(object, key) {
  return object[Object.keys(object)
      .find(k => k.toLowerCase() === key.toLowerCase())
  ];
}

const bscTokens = [
    { "id": "wbnb", "symbol": "wbnb","contract": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" },
    { "id": "arth", "symbol": "ARTH","contract": "0xB69A424Df8C737a122D0e60695382B3Eec07fF4B" },
    { "id": "mahadao", "symbol": "MAHA","contract": "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b" },
    { "id": "binance-usd", "symbol": "busd", "contract": "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"  },
    { "id": "pancakeswap-token", "symbol": "CAKE", "contract": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"  },
    { "id": "beefy-finance", "symbol": "BIFI", "contract": "0xca3f508b8e4dd382ee878a314789373d80a5190a" },
    { "id": "bdollar-share", "symbol": "sBDO", "contract": "0x0d9319565be7f53cefe84ad201be3f40feae2740"  },
    { "id": "belugaswap","symbol": "BELUGA", "contract": "0x181de8c57c4f25eba9fd27757bbd11cc66a55d31" },
    { "id": "chainlink","symbol": "LINK","contract":"0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd" },
    { "id": "bscex","symbol": "BSCX", "contract": "0x5ac52ee5b2a633895292ff6d8a89bb9190451587" },
    { "id": "binance-eth","symbol": "BETH", "contract": "0x250632378e573c6be1ac2f97fcdf00515d0aa91b" },
    { "id": "tether","symbol": "USDT", "contract": "0x55d398326f99059fF775485246999027B3197955" },
    { "id": "bitcoin-bep2","symbol": "BTCB", "contract": "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c" },
    { "id": "ethereum","symbol": "ETH", "contract": "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" },
    { "id": "bakerytoken","symbol": "BAKE", "contract": "0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5" },
    { "id": "goose-finance","symbol": "EGG", "contract": "0xf952fc3ca7325cc27d15885d37117676d25bfda6" },
    { "id": "dai","symbol": "DAI", "contract": "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3" },
    { "id": "auto","symbol": "AUTO", "contract": "0xa184088a740c695e156f91f5cc086a06bb78b827" },
    { "id": "wault-finance","symbol": "WAULT", "contract": "0x6ff2d9e5891a7a7c554b80e0d1b791483c78bce9" },
    { "id": "swipe","symbol": "SXP", "contract": "0x47BEAd2563dCBf3bF2c9407fEa4dC236fAbA485A" },
    { "id": "vai","symbol": "VAI", "contract": "0x4bd17003473389a42daf6a0a729f6fdb328bbbd7" },
    { "id": "venus","symbol": "XVS", "contract": "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63" },
    { "id": "terrausd", "symbol": "UST", "contract": "0x23396cf899ca06c4472205fc903bdb4de249d6fc"},
    { "id": "cardano", "symbol": "ADA", "contract": "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47"},
    { "id": "bearn-fi", "symbol": "BFI", "contract": "0x81859801b01764d4f0fa5e64729f5a6c3b91435b"},
    { "id": "polkadot", "symbol": "DOT", "contract": "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402"},
    { "id": "vbswap", "symbol": "VBSWAP", "contract": "0x4f0ed527e8a95ecaa132af214dfd41f30b361600"},
    { "id": "bdollar", "symbol": "BDO", "contract": "0x190b589cf9fb8ddeabbfeae36a813ffb2a702454"},
    { "id": "julswap", "symbol": "JULD", "contract": "0x5a41f637c3f7553dba6ddc2d3ca92641096577ea"},
    { "id": "the-famous-token", "symbol": "TFT", "contract": "0xA9d3fa202b4915c3eca496b0e7dB41567cFA031C"},
    { "id": "shield-protocol", "symbol": "SHIELD", "contract": "0x60b3bc37593853c04410c4f07fe4d6748245bf77"},
    { "id": "lead-token", "symbol": "LEAD", "contract": "0x2ed9e96EDd11A1fF5163599A66fb6f1C77FA9C66"},
    { "id": "sparkpoint", "symbol": "SRK", "contract": "0x3B1eC92288D78D421f97562f8D479e6fF7350a16"},
    { "id": "curate", "symbol": "XCUR", "contract": "0x708C671Aa997da536869B50B6C67FA0C32Ce80B2"},
    { "id": "uniswap", "symbol": "UNI", "contract": "0xBf5140A22578168FD562DCcF235E5D43A02ce9B1"},
    { "id": "tsuki-dao", "symbol": "TSUKI", "contract": "0x3fd9e7041c45622e8026199a46f763c9807f66f3"},
    { "id": "panda-yield", "symbol": "BBOO", "contract": "0xd909840613fcb0fadc6ee7e5ecf30cdef4281a68"},
    { "id": "cryptex", "symbol": "CRX", "contract": "0x97a30C692eCe9C317235d48287d23d358170FC40"},
    { "id": "polis", "symbol": "POLIS", "contract": "0xb5bea8a26d587cf665f2d78f077cca3c7f6341bd"},
    { "id": "tether", "symbol": "USDT", "contract": "0x049d68029688eAbF473097a2fC38ef61633A3C7A"},
    { "id": "swirl-cash", "symbol": "SWIRL", "contract": "0x52d86850bc8207b520340b7e39cdaf22561b9e56"},
    { "id": "squirrel-finance", "symbol": "NUTS", "contract": "0x8893D5fA71389673C5c4b9b3cb4EE1ba71207556"},
    { "id": "usd-coin", "symbol": "USDC", "contract": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"},
    { "id": "iron-stablecoin", "symbol": "IRON", "contract": "0x7b65b489fe53fce1f6548db886c08ad73111ddd8" },
    { "id": "midas-dollar", "symbol": "MDO", "contract": "0x35e869b7456462b81cdb5e6e42434bd27f3f788c" },
    { "id": "slime-finance", "symbol": "SLME", "contract": "0x4fcfa6cc8914ab455b5b33df916d90bfe70b6ab1" },
    { "id": "bolt-true-dollar", "symbol": "BTD", "contract": "0xd1102332a213e21faf78b69c03572031f3552c33" },
    { "id": "mdex", "symbol": "MDX", "contract": "0x9C65AB58d8d978DB963e63f2bfB7121627e3a739" },
    { "id": "ice-token", "symbol": "ICE", "contract": "0xf16e81dce15b08f326220742020379b855b87df9"},
    { "id": "alpaca-finance", "symbol": "ALPACA", "contract": "0x8f0528ce5ef7b51152a59745befdd91d97091d2f"},
    { "id": "blue-planetfinance", "symbol": "AQUA", "contract": "0x72B7D61E8fC8cF971960DD9cfA59B8C829D91991"},
    { "id": "dogecoin", "symbol": "DOGE", "contract": "0xbA2aE424d960c26247Dd6c32edC70B295c744C43"},
    { "id": "degen", "symbol": "DGNZ", "contract": "0xb68a67048596502A8B88f1C10ABFF4fA99dfEc71"},
    { "id": "degencomp", "symbol": "aDGNZ", "contract": "0xe8B9b396c59A6BC136cF1f05C4D1A68A0F7C2Dd7"},
    { "id": "gambit", "symbol": "GMT", "contract": "0x99e92123eb77bc8f999316f622e5222498438784"},
    { "id": "alien-worlds-bsc", "symbol": "TLM", "contract": "0x2222227e22102fe3322098e4cbfe18cfebd57c95"},
    { "id": "ten", "symbol": "TENFI", "contract": "0xd15c444f1199ae72795eba15e8c1db44e47abf62"},
    { "id": "pancake-bunny", "symbol": "BUNNY", "contract": "0xc9849e6fdb743d08faee3e34dd2d1bc69ea11a51"},
    { "id": "swampy", "symbol": "SWAMP", "contract": "0xc5A49b4CBe004b6FD55B30Ba1dE6AC360FF9765d"},
    { "id": "ellipsis", "symbol": "EPS", "contract": "0xA7f552078dcC247C2684336020c03648500C6d9F"},
    { "id": "ketchup-finance", "symbol": "KETCHUP", "contract": "0x714a84632ed7edbbbfeb62dacf02db4beb4c69d9"},
    { "id": "bnbc", "symbol": "BNBC", "contract": "0x31b5d91806af3364678715f4c5bf50c1e3bae10a"},
    { "id": "thoreum", "symbol": "THOREUM", "contract": "0x580de58c1bd593a43dadcf0a739d504621817c05"},
    { "id": "ruler-protocol", "symbol": "RULER", "contract": "0x7EA2be2df7BA6E54B1A9C70676f668455E329d29"},
    { "id": "boringdao-old", "symbol": "BOR", "contract": "0x92D7756c60dcfD4c689290E8A9F4d263b3b32241"},
    { "id": "nerve-finance", "symbol": "NRV", "contract": "0x42F6f551ae042cBe50C739158b4f0CAC0Edb9096"},
    { "id": "trident", "symbol": "TRIDENT", "contract": "0x66D7661cdcdF4adA7dA239Af6Fc8C4FE73E79D22"},
    { "id": "apeswap-finance", "symbol": "BANANA", "contract": "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95"},
    { "id": "matic-network","symbol": "MATIC","contract": "0xCC42724C6683B7E57334c4E856f4c9965ED682bD" },
    { "id": "cosmos","symbol": "ATOM","contract": "0x0Eb3a705fc54725037CC9e008bDede697f62F335" },
    { "id": "reef-finance","symbol": "REEF","contract": "0xF21768cCBC73Ea5B6fd3C687208a7c2def2d966e" },
    { "id": "zcore-finance","symbol": "ZEFI","contract": "0x0288D3E353fE2299F11eA2c2e1696b4A648eCC07" },
    { "id": "binance-peg-litecoin","symbol": "LTC","contract": "0x4338665cbb7b2485a8855a139b75d5e34ab0db94" },
    { "id": "tron-bsc","symbol": "TRX","contract": "0x85EAC5Ac2F758618dFa09bDbe0cf174e7d574D5B" },
    { "id": "binance-peg-xrp","symbol": "XRP","contract": "0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe" },
    { "id": "galaxy-triton", "symbol": "TRITON", "contract": "0x9cf4009e62429Db3F57Aa9e7e8E898427cF6865f" },
    { "id": "biswap", "symbol": "BSW", "contract": "0x965f527d9159dce6288a2219db51fc6eef120dd1"},
    { "id": "krown", "symbol": "KRW", "contract": "0x1446f3cedf4d86a9399e49f7937766e6de2a3aab"},
    { "id": "pancake-hunny", "symbol": "HUNNY", "contract": "0x565b72163f17849832A692A3c5928cc502f46D69"},
    { "id": "dodo", "symbol": "DODO", "contract": "0x67ee3cb086f8a16f34bee3ca72fad36f7db929e2"},
    { "id": "galaxy-oberon", "symbol": "OBERON", "contract": "0xc979E70611D997Aa109528c6A9aa73D82Eaa2881" },
    { "id": "gem", "symbol": "GEM", "contract": "0x9fb4DEF63f8caEC83Cb3EBcC22Ba0795258C988a" },
    { "id": "shell", "symbol": "SHELL", "contract": "0x01c16da6E041Cf203959624Ade1F39652973D0EB" },
    { "id": "token-dforce-usd", "symbol": "USX", "contract": "0xb5102cee1528ce2c760893034a4603663495fd72" },
    { "id": "synapse-2", "symbol": "SYN", "contract": "0xa4080f1778e69467E905B8d6F72f6e441f9e9484" },
    { "id": "mars-ecosystem-token", "symbol": "XMS", "contract": "0x7859b01bbf675d67da8cd128a50d155cd881b576" },
    { "id": "topshelf-finance", "symbol": "LIQR", "contract": "0x33333ee26a7d02e41c33828b42fb1e0889143477" },
    { "id": "blockchain-adventurers-guild", "symbol": "BAG", "contract": "0x7c650f39d777F40120345314Ab8009D11F70c972" },
    { "id": "true-usd", "symbol": "TUSD", "contract": "0x14016e85a25aeb13065688cafb43044c2ef86784" },
    { "id": "ptokens-btc", "symbol": "PBTC", "contract": "0xed28a457a5a76596ac48d87c0f577020f6ea1c4c" },
    { "id": "neutrino", "symbol": "USDN", "contract": "0x03ab98f5dc94996f8c33e15cd4468794d12d41f9" },
    { "id": "greentrust", "symbol": "GNT", "contract": "0xf750a26eb0acf95556e8529e72ed530f3b60f348" },
    { "id": "killswitch", "symbol": "KSW", "contract": "0x270178366a592ba598c2e9d2971da65f7baa7c86" },
    { "id": "xbn", "symbol": "XBN", "contract": "0x547cbe0f0c25085e7015aa6939b28402eb0ccdac" },
    { "id": "lucky-lion", "symbol": "LUCKY", "contract": "0xc3d912863152e1afc935ad0d42d469e7c6b05b77" },
    { "id": "binance-peg-filecoin", "symbol": "FIL", "contract": "0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153" },
    { "id": "rabbit-finance", "symbol": "RABBIT", "contract": "0x95a1199eba84ac5f19546519e287d43d2f0e1b41" },
    { "id": "humpback", "symbol": "HUMP", "contract": "0x453939C0270e9405876C7f047aDE3932FD2d7a51" },
    { "id": "ecio-space", "symbol": "ECIO", "contract": "0x327a3e880bf2674ee40b6f872be2050ed406b021" },
    { "id": "gmt-token", "symbol": "GMT", "contract": "0x7Ddc52c4De30e94Be3A6A0A2b259b2850f421989" },
    { "id": "axie-infinity", "symbol": "AXS", "contract": "0x715D400F88C167884bbCc41C5FeA407ed4D2f8A0" },
    { "id": "cryptoskates", "symbol": "CST", "contract": "0x368eb5efdca39126e8e76aae5187166de7c2766c" },
    { "id": "the-killbox-game", "symbol": "KBOX", "contract": "0x3523d58d8036b1c5c9a13493143c97aefc5ad422" },
    { "id": "orakler", "symbol": "ORKL", "contract": "0x36bc1f4d4af21df024398150ad39627fb2c8a847" },
    { "id": "lucky-block", "symbol": "LBLOCK", "contract": "0x2cd96e8c3ff6b5e01169f6e3b61d28204e7810bb" },
    { "id": "luna-rush", "symbol": "LUS", "contract": "0xde301d6a2569aefcfe271b9d98f318baee1d30a4" },
    { "id": "amethyst", "symbol": "AMES", "contract": "0xb9e05b4c168b56f73940980ae6ef366354357009" },
    { "id": "quartz-defi-ashare", "symbol": "ASHARE", "contract": "0xfa4b16b0f63f5a6d0651592620d585d308f749a4" },
    { "id": "stargate-finance", "symbol": "STG", "contract": "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b" },
    { "id": "space-corsair-key", "symbol": "SCK", "contract": "0x227a3ef4d41d0215123f3197faa087bf71d2236a" }
]

export async function getBscPrices() {
    const idPrices = await lookUpPrices(bscTokens.map(x => x.id));
    const prices = {}
    for (const bt of bscTokens){
        //console.log(typeof(bt.id));
        if (idPrices[bt.id]) {
            prices[bt.contract] = idPrices[bt.id];
        } 
        // else {
        //     console.log('missed', bt.id);   
        // }
    }
      
    return prices;
}

const lookUpPrices = async function(id_array) {
    let prices = {}
    for (const id_chunk of chunk(id_array, 50)) {
        let ids = id_chunk.join('%2C')
        
        let res = await request({
            url: 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=usd',
            type: 'GET',
        })
        
        let parsedJson = JSON.parse(res)

        for (const key of Object.keys(parsedJson)){
            prices[key] = parsedJson[key].usd
        }
    }
    return prices
}

function printAPR(rewardTokenTicker, rewardPrice, poolRewardsPerWeek,
  stakeTokenTicker, staked_tvl, userStaked, poolTokenPrice,
  fixedDecimals) {
    // console.log('line 166 bsc', poolRewardsPerWeek, rewardPrice, staked_tvl);
    var usdPerWeek = poolRewardsPerWeek * rewardPrice;
    fixedDecimals = fixedDecimals ?? 2;
    // console.log(`${rewardTokenTicker} Per Week: ${poolRewardsPerWeek.toFixed(fixedDecimals)}`);
    var weeklyAPR = usdPerWeek / staked_tvl * 100;
    var dailyAPR = weeklyAPR / 7;
    var yearlyAPR = weeklyAPR * 52;
    //_print(`APR: Day ${dailyAPR.toFixed(2)}% Week ${weeklyAPR.toFixed(2)}% Year ${yearlyAPR.toFixed(2)}%`);
    var userStakedUsd = userStaked * poolTokenPrice;
    var userStakedPct = userStakedUsd / staked_tvl * 100;
    //(`You are staking ${userStaked.toFixed(fixedDecimals)} ${stakeTokenTicker} ($${formatMoney(userStakedUsd)}), ${userStakedPct.toFixed(2)}% of the pool.`);
    var userWeeklyRewards = userStakedPct * poolRewardsPerWeek / 100;
    var userDailyRewards = userWeeklyRewards / 7;
    var userYearlyRewards = userWeeklyRewards * 52;
    // if (userStaked > 0) {
    // _print(`Estimated ${rewardTokenTicker} earnings:`
    // + ` Day ${userDailyRewards.toFixed(fixedDecimals)} ($${formatMoney(userDailyRewards*rewardPrice)})`
    // + ` Week ${userWeeklyRewards.toFixed(fixedDecimals)} ($${formatMoney(userWeeklyRewards*rewardPrice)})`
    // + ` Year ${userYearlyRewards.toFixed(fixedDecimals)} ($${formatMoney(userYearlyRewards*rewardPrice)})`);
    // }
    return {
      userStakedUsd,
      totalStakedUsd : staked_tvl,
      userStakedPct,
      yearlyAPR,
      userYearlyUsd : userYearlyRewards * rewardPrice
    }
}

export function printChefPool(App, chefAbi, chefAddr, prices, tokens, poolInfo, poolIndex, poolPrices,
  totalAllocPoints, rewardsPerWeek, rewardTokenTicker, rewardTokenAddress,
  pendingRewardsFunction, fixedDecimals, claimFunction, chain="eth", depositFee=0, withdrawFee=0) {
  fixedDecimals = fixedDecimals ?? 2;
  const sp = (poolInfo.stakedToken == null) ? null : getPoolPrices(tokens, prices, poolInfo.stakedToken, chain);
  var poolRewardsPerWeek = poolInfo.allocPoints / totalAllocPoints * rewardsPerWeek;
  if (poolRewardsPerWeek == 0 && rewardsPerWeek != 0) return;
  const userStaked = poolInfo.userLPStaked ?? poolInfo.userStaked;
  const rewardPrice = getParameterCaseInsensitive(prices, rewardTokenAddress)?.usd;
  const staked_tvl = sp?.staked_tvl ?? poolPrices.staked_tvl;

  const apr = printAPR(rewardTokenTicker, rewardPrice || 8.45, poolRewardsPerWeek, poolPrices.stakeTokenTicker,
  staked_tvl, userStaked, poolPrices.price, fixedDecimals);
  // console.log('bsc helper 207', apr);
  
  return apr;
}

export async function loadBscChefContract(App, tokens, prices, chef, chefAddress, chefAbi, rewardTokenTicker,
  rewardTokenFunction, rewardsPerBlockFunction, rewardsPerWeekFixed, pendingRewardsFunction,
  deathPoolIndices) {

    // console.log('chef contract');
    
    const chefContract = chef ?? new ethers.Contract(chefAddress, chefAbi, App.provider);

    const poolCount = parseInt(await chefContract.poolLength(), 10);
    const totalAllocPoints = await chefContract.totalAllocPoint();

    // console.log('poolCount', poolCount);

    var tokens:any = {};

    const rewardTokenAddress = await chefContract.callStatic[rewardTokenFunction]();
    // console.log('rewardTokenAddress', rewardTokenAddress);
    
    const rewardToken = await getBscToken(App, rewardTokenAddress, chefAddress);
    
    const rewardsPerWeek = rewardsPerWeekFixed ??
      await chefContract.callStatic[rewardsPerBlockFunction]()
      / 10 ** rewardToken.decimals * 604800 / 3

    const poolInfos = await Promise.all([...Array(poolCount).keys()].map(async (x) =>
      await getBscPoolInfo(App, chefContract, chefAddress, x, pendingRewardsFunction)));

    var tokenAddresses = [].concat.apply([], poolInfos.filter(x => x.poolToken).map(x => x.poolToken.tokens));

    await Promise.all(tokenAddresses.map(async (address) => {
        tokens[address] = await getBscToken(App, address, chefAddress);
    }));

    if (deathPoolIndices) {   //load prices for the deathpool assets
      deathPoolIndices.map(i => poolInfos[i])
                      .map(poolInfo =>
        poolInfo.poolToken ? getPoolPrices(tokens, prices, poolInfo.poolToken, "bsc") : undefined);
    }

    const poolPrices = poolInfos.map(poolInfo => poolInfo.poolToken ? getPoolPrices(tokens, prices, poolInfo.poolToken, "bsc") : undefined);

    
    let aprs = []
    for (var i = 0; i < poolCount; i++) {
      if (poolPrices[i]) {
        const apr = printChefPool(App, chefAbi, chefAddress, prices, tokens, poolInfos[i], i, poolPrices[i],
          totalAllocPoints, rewardsPerWeek, rewardTokenTicker, rewardTokenAddress,
          pendingRewardsFunction, null, null, "bsc", poolInfos[i].depositFee, poolInfos[i].withdrawFee)
        aprs.push(apr);
      }
    }

    let totalUserStaked=0, totalStaked=0, averageApr=0;
    for (const a of aprs) {
      if (!isNaN(a.totalStakedUsd)) {
        totalStaked += a.totalStakedUsd;
      }
      if (a.userStakedUsd > 0) {
        totalUserStaked += a.userStakedUsd;
        averageApr += a.userStakedUsd * a.yearlyAPR / 100;
      }
    }
    averageApr = averageApr / totalUserStaked;
    // _print_bold(`Total Staked: $${formatMoney(totalStaked)}`);
    // if (totalUserStaked > 0) {
    //   _print_bold(`\nYou are staking a total of $${formatMoney(totalUserStaked)} at an average APR of ${(averageApr * 100).toFixed(2)}%`)
    //   _print(`Estimated earnings:`
    //       + ` Day $${formatMoney(totalUserStaked*averageApr/365)}`
    //       + ` Week $${formatMoney(totalUserStaked*averageApr/52)}`
    //       + ` Year $${formatMoney(totalUserStaked*averageApr)}\n`);
    // }
    // console.log('averageApr', averageApr);
    return { prices, totalUserStaked, totalStaked, averageApr }
}


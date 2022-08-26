import {formatMoney, displayPrice} from './utils'

function getParameterCaseInsensitive(object, key) {
    return object[Object.keys(object)
        .find(k => k.toLowerCase() === key.toLowerCase())
    ];
}

function getChainExplorerUrl(chain, address){
    switch(chain){
      case "eth" :
        return `https://etherscan.io/token/${address}`;
      case "bsc" :
        return `https://bscscan.com/token/${address}`;
      case "fantom" :
        return `https://ftmscan.com/token/${address}`;
      case "harmony" :
        return `https://explorer.harmony.one/address/${address}`;
      case "arbitrum" :
        return `https://arbiscan.io/address/${address}`;
      case "cronos" :
        return `https://cronoscan.com/address/${address}`;
      case "moonbeam" :
        return `https://moonscan.io/address/${address}`;
      case "moonriver" :
        return `https://moonriver.moonscan.io/address/${address}`
      case "velas" :
        return `https://evmexplorer.velas.com/address/${address}`;
      case "aurora" :
        return `https://aurorascan.dev/token/${address}`;
      case "boba" :
        return `https://blockexplorer.boba.network/address/${address}`;
      case "metis" :
        return `https://andromeda-explorer.metis.io/address/${address}`;
      case "meter" :
        return `https://scan.meter.io/address/${address}`;
      case "emerald" :
        return `https://explorer.emerald.oasis.dev/token/${address}`;
      case "telos" :
        return `https://www.teloscan.io/address/${address}`;
      case "matic" :
        return `https://polygonscan.com/address/${address}`;
      case "dfk" :
        return `https://subnets.avax.network/defi-kingdoms/dfk-chain/explorer/address/${address}`;
      case "avax" :
        return `https://snowtrace.io/address/${address}`;
      case "optimism" :
        return `https://optimistic.etherscan.io/address/${address}`;
    }
}

function getValuePrices(tokens, prices, pool)
{
  var t0 = getParameterCaseInsensitive(tokens,pool.token0);
  var p0 = getParameterCaseInsensitive(prices,pool.token0)?.usd;
  var t1 = getParameterCaseInsensitive(tokens,pool.token1);
  var p1 = getParameterCaseInsensitive(prices,pool.token1)?.usd;
  if (p0 == null && p1 == null) {
      return undefined;
  }
  var q0 = pool.q0 / 10 ** t0.decimals;
  var q1 = pool.q1 / 10 ** t1.decimals;
  if (p0 == null)
  {
      p0 = q1 * p1 / pool.w1 / q0 * pool.w0;
      prices[pool.token0] = { usd : p0 };
  }
  if (p1 == null)
  {
      p1 = q0 * p0 / pool.w0 / q1 * pool.w1;
      prices[pool.token1] = { usd : p1 };
  }
  var tvl = q0 * p0 + q1 * p1;
  var price = tvl / pool.totalSupply;
  prices[pool.address] = { usd : price };
  var staked_tvl = pool.staked * price;
  let stakeTokenTicker = `[${t0.symbol} ${pool.w0}%]-[${t1.symbol} ${pool.w1}%] Value-LP`;
  return {
      t0, p0, q0, w0 : pool.w0,
      t1, p1, q1, w1 : pool.w1,
      price: price,
      tvl : tvl,
      staked_tvl : staked_tvl,
      stakeTokenTicker : stakeTokenTicker,
      print_price() {
        const poolUrl = `https://info.vswap.fi/pool/${pool.address}`
        const t0address = t0.address;
        const t1address =  t1.address;
        const helperUrls = [
          `https://bsc.valuedefi.io/#/add/${pool.address}`,
          `https://bsc.valuedefi.io/#/remove/${pool.address}`,
          `https://bsc.valuedefi.io/#/vswap?inputCurrency=${t0address}&outputCurrency=${t1address}`
        ]
      },
      pair_links() {
        const poolUrl = `https://info.vswap.fi/pool/${pool.address}`
        const t0address = t0.address;
        const t1address =  t1.address;
        const helperUrls = [
          `https://bsc.valuedefi.io/#/add/${pool.address}`,
          `https://bsc.valuedefi.io/#/remove/${pool.address}`,
          `https://bsc.valuedefi.io/#/vswap?inputCurrency=${t0address}&outputCurrency=${t1address}`
        ]
        return {
          pair_link: `<a href='${poolUrl}' target='_blank'>${stakeTokenTicker}</a>`,
          add_liquidity_link: `<a href='${helperUrls[0]}' target='_blank'>[+]</a>`,
          remove_liquidity_link: `<a href='${helperUrls[1]}' target='_blank'>[-]</a>`,
          swap_link: `<a href='${helperUrls[2]}' target='_blank'>[<=>]</a>`,
          token0: t0.symbol,
          price0: `$${displayPrice(p0)}`,
          token1: t1.symbol,
          price1: `$${displayPrice(p1)}`,
          total_staked: `${pool.staked.toFixed(4)}`,
          total_staked_dollars: `$${formatMoney(staked_tvl)}`,
          tvl: `$${formatMoney(tvl)}`,
        }
      },
      print_contained_price(userStaked) {
        var userPct = userStaked / pool.totalSupply;
        var q0user = userPct * q0;
        var q1user = userPct * q1;
      }
  }
}

function getBalancerPrices(tokens, prices, pool, chain)
{
  var poolTokens = pool.poolTokens.map(t => getParameterCaseInsensitive(tokens, t.address));
  var poolPrices = pool.poolTokens.map(t => getParameterCaseInsensitive(prices, t.address)?.usd);
  var quantities = poolTokens.map((t, i) => pool.poolTokens[i].balance / 10 ** t.decimals);
  var missing = poolPrices.map((x, i) => x ? -1 : i).filter(x => x >= 0);
  if (missing.length == poolPrices.length) {
    throw 'Every price is missing';
  }
  var notMissing = poolPrices.findIndex(p => p);
  const getMissingPrice = (missingQuantity, missingWeight) =>
    quantities[notMissing] * poolPrices[notMissing] * missingWeight
     / pool.poolTokens[notMissing].weight / missingQuantity;
  missing.map(i => {
    const newPrice = getMissingPrice(quantities[i], pool.poolTokens[i].weight);
    poolPrices[i] = newPrice;
    prices[poolTokens[i].address] = { usd : newPrice };
  });

  var tvl = poolPrices.map((p, i) => p * quantities[i]).reduce((x,y)=>x+y, 0);
  var price = tvl / pool.totalSupply;
  prices[pool.address] = { usd : price };
  var staked_tvl = pool.staked * price;
  var tickers = pool.poolTokens.map((pt, i) => `[${poolTokens[i].symbol} ${(pt.weight*100).toFixed(2)}%]`)
  const stakeTokenTicker = tickers.join('-');
  return {
      tokens : poolTokens,
      prices : poolPrices,
      quantities : quantities,
      price: price,
      tvl : tvl,
      staked_tvl : staked_tvl,
      stakeTokenTicker : stakeTokenTicker,
      print_price() {
        let poolUrl = "";
        chain == "fantom" ? poolUrl = "https://beets.fi/#/" : "avax" ? poolUrl = "https://analytics.embr.finance/" : poolUrl = `http://pools.balancer.exchange/#/pool/${pool.address}`;
      },
      print_contained_price(userStaked) {
        var userPct = userStaked / pool.totalSupply;
        var userQs = quantities.map((q, i) => `${(q * userPct).toFixed(4)} ${poolTokens[i].symbol}`);
      }
  }
}

function getBunicornPrices(tokens, prices, pool, chain)
{
    const result = getBalancerPrices(tokens, prices, pool, chain);
    return { ...result, ...{
        print_price() {
            let poolUrl = `https://www.bunicorn.exchange/#/liquidity/tokens/detail/${pool.address}`;

            let lpPrice = result.price;
            if (pool.poolType && pool.poolType === 'stable') {
                const pairStr = pool.tokens.join('_');
                poolUrl = `https://www.bunicorn.exchange/#/liquidity/stablecoins/detail/${pairStr.toLowerCase()}/${pool.address}`;
                lpPrice = result.price / 2
            }
        },
    }}
}

function getGelatoPrices(tokens, prices, pool, chain="eth")
{
  var t0 = getParameterCaseInsensitive(tokens,pool.token0);
  var p0 = getParameterCaseInsensitive(prices,pool.token0)?.usd;
  var t1 = getParameterCaseInsensitive(tokens,pool.token1);
  var p1 = getParameterCaseInsensitive(prices,pool.token1)?.usd;
  if (p0 == null || p1 == null) {
    // console.log(`Missing prices for tokens ${pool.token0} and ${pool.token1}.`);
    return undefined;
  }
  if (t0?.decimals == null) {
    // console.log(`Missing information for token ${pool.token0}.`);
    return undefined;
  }
  if (t1?.decimals == null) {
    // console.log(`Missing information for token ${pool.token1}.`);
    return undefined;
  }
  var q0 = pool.q0 / 10 ** t0.decimals;
  var q1 = pool.q1 / 10 ** t1.decimals;
  var tvl = q0 * p0 + q1 * p1;
  var price = tvl / pool.totalSupply;
  prices[pool.address] = { usd : price };
  var staked_tvl = pool.staked * price;
  let stakeTokenTicker = `[${pool.name}]`;
  return {
    t0: t0,
    p0: p0,
    q0  : q0,
    t1: t1,
    p1: p1,
    q1  : q1,
    price: price,
    tvl : tvl,
    staked_tvl : staked_tvl,
    stakeTokenTicker : stakeTokenTicker,
    print_price(chain="eth") {
      const t0address = t0.symbol == "ETH" ? "ETH" : t0.address;
      const t1address = t1.symbol == "ETH" ? "ETH" : t1.address;
      const poolUrl = getChainExplorerUrl(chain, pool.address);
    },
    print_contained_price(userStaked) {
      var userPct = userStaked / pool.totalSupply;
      var q0user = userPct * q0;
      var q1user = userPct * q1;
    }
  }
}

function getUniPrices(tokens, prices, pool, chain="eth")
{
  var t0 = getParameterCaseInsensitive(tokens,pool.token0);
  var p0 = getParameterCaseInsensitive(prices,pool.token0)?.usd;
  var t1 = getParameterCaseInsensitive(tokens,pool.token1);
  var p1 = getParameterCaseInsensitive(prices,pool.token1)?.usd;
  if (p0 == null && p1 == null) {
    // console.log(`Missing prices for tokens ${pool.token0} and ${pool.token1}.`);
    return undefined;
  }
  if (t0?.decimals == null) {
    // console.log(`Missing information for token ${pool.token0}.`);
    return undefined;
  }
  if (t1?.decimals == null) {
    // console.log(`Missing information for token ${pool.token1}.`);
    return undefined;
  }
  var q0 = pool.q0 / 10 ** t0.decimals;
  var q1 = pool.q1 / 10 ** t1.decimals;
  if (p0 == null)
  {
      p0 = q1 * p1 / q0;
      prices[pool.token0] = { usd : p0 };
  }
  if (p1 == null)
  {
      p1 = q0 * p0 / q1;
      prices[pool.token1] = { usd : p1 };
  }
  var tvl = q0 * p0 + q1 * p1;
  var price = tvl / pool.totalSupply;
  prices[pool.address] = { usd : price };
  var staked_tvl = pool.staked * price;
  let stakeTokenTicker = `[${t0.symbol}]-[${t1.symbol}]`;
  if (pool.is1inch) stakeTokenTicker += " 1INCH LP";
  else if (pool.symbol.includes("TETHYSLP")) stakeTokenTicker += " TETHYS LP";
  else if (pool.symbol.includes("LSLP")) stakeTokenTicker += " LSLP";
  else if (pool.symbol.includes("vAMM")) stakeTokenTicker += " vAMM";
  else if (pool.symbol.includes("sAMM")) stakeTokenTicker += " sAMM";
  else if (pool.symbol.includes("Wigo-LP")) stakeTokenTicker += " Wigo-LP";
  else if (pool.symbol.includes("DXS")) stakeTokenTicker += " DXS-LP";
  else if (pool.symbol.includes("HAUS-LP")) stakeTokenTicker += " HAUS-LP";
  else if (pool.symbol.includes("HBLP")) stakeTokenTicker += " Huckleberry LP";
  else if (pool.symbol.includes("BLP")) stakeTokenTicker += " BLP";
  else if (pool.symbol.includes("BEAM-LP")) stakeTokenTicker += " BEAM-LP";
  else if (pool.symbol.includes("ZDEXLP")) stakeTokenTicker += " ZooDex LP";
  else if (pool.symbol.includes("OperaSwap")) stakeTokenTicker += " Opera Swap LP";
  else if (pool.symbol.includes("SLP")) stakeTokenTicker += " SLP";
  else if (pool.symbol.includes("Farmtom-LP")) stakeTokenTicker += " Farmtom LP";
  else if (pool.symbol.includes("Cake")) stakeTokenTicker += " Cake LP";
  else if (pool.name.includes("Value LP")) stakeTokenTicker += " Value LP";
  else if (pool.name.includes("Duneswap LP Token")) stakeTokenTicker += " Duneswap LP";
  else if (pool.name.includes("Lizard LPs")) stakeTokenTicker += " LLP";
  else if (pool.name.includes("Gemkeeper LP Token")) stakeTokenTicker += " GLP";
  else if (pool.symbol.includes("PGL")) stakeTokenTicker += " PGL";
  else if (pool.symbol.includes("JLP")) stakeTokenTicker += " JLP";
  else if (pool.symbol.includes("CS-LP")) stakeTokenTicker += " CSS LP";
  else if (pool.symbol.includes("DFYN")) stakeTokenTicker += " DFYN LP";
  else if (pool.symbol.includes("NMX-LP")) stakeTokenTicker += " NMX LP";
  else if (pool.symbol.includes("SPIRIT")) stakeTokenTicker += " SPIRIT LP";
  else if (pool.symbol.includes("TOMB-V2-LP")) stakeTokenTicker += " TOMB-V2 LP";
  else if (pool.symbol.includes("spLP")) stakeTokenTicker += " SPOOKY LP";
  else if (pool.symbol.includes("Lv1")) stakeTokenTicker += " STEAK LP";
  else if (pool.symbol.includes("PLP")) stakeTokenTicker += " Pure Swap LP";
  else if (pool.symbol.includes("Field-LP")) stakeTokenTicker += " Yield Fields LP";
  else if (pool.symbol.includes("UPT")) stakeTokenTicker += " Unic Swap LP";
  else if (pool.symbol.includes("ELP")) stakeTokenTicker += " ELK LP";
  else if (pool.symbol.includes("BenSwap")) stakeTokenTicker += " BenSwap LP";
  else if (pool.name.includes("MISTswap LP Token")) stakeTokenTicker += " MistSwap LP";
  else if (pool.name.includes("TANGOswap LP Token")) stakeTokenTicker += " TangoSwap LP";
  else if (pool.name.includes("Flare LP Token")) stakeTokenTicker += " FLP LP";
  else if (pool.symbol.includes("BRUSH-LP")) stakeTokenTicker += " BRUSH LP";
  else if (pool.symbol.includes("APE-LP")) stakeTokenTicker += " APE LP";
  else if (pool.symbol.includes("Galaxy-LP")) stakeTokenTicker += " Galaxy LP";
  else if (pool.symbol.includes("KUS-LP")) stakeTokenTicker += " KUS LP";
  else if (pool.symbol.includes("KoffeeMug")) stakeTokenTicker += " KoffeeMug";
  else if (pool.symbol.includes("DMM-LP")) stakeTokenTicker += " DMM-LP";
  else if (pool.symbol.includes("ZLK-LP")) stakeTokenTicker += " ZLK-LP";
  else if (pool.symbol.includes("CAT-LP")) stakeTokenTicker += " PolyCat LP";
  else if (pool.symbol.includes("VLP")) stakeTokenTicker += " AURO LP";
  else if (pool.symbol.includes("DLP")) stakeTokenTicker += " DLP";
  else if (pool.symbol.includes("ULP")) stakeTokenTicker += " Ubeswap LP Token";
  else if (pool.symbol.includes("LOVE LP")) stakeTokenTicker += " Love Boat Love LP Token";
  else if (pool.symbol.includes("Proto-LP")) stakeTokenTicker += " ProtoFi LP Token";
  else if (pool.symbol.includes("SOUL-LP")) stakeTokenTicker += " Soulswap LP Token";
  else if (pool.symbol.includes("lv_")) stakeTokenTicker += " Lixir LP Token";
  else if (pool.symbol.includes("LOOT-LP")) stakeTokenTicker += " Loot LP Token";
  else if (pool.symbol.includes("MIMO-LP")) stakeTokenTicker += " Mimo LP Token";
  else if (pool.symbol.includes("HLP")) stakeTokenTicker += " Hades Swap LP Token";
  else if (pool.name.includes("1BCH LP Token")) stakeTokenTicker += " 1BCH LP";
  else if (pool.symbol.includes("MOCHI-LP")) stakeTokenTicker += " Mochi LP Token";
  else if (pool.symbol.includes("SMUG-LP")) stakeTokenTicker += " Smug LP Token";
  else if (pool.symbol.includes("VVS-LP")) stakeTokenTicker += " VVS LP Token";
  else if (pool.symbol.includes("CNO-LP")) stakeTokenTicker += " CNO LP Token";
  else if (pool.symbol.includes("Crona-LP")) stakeTokenTicker += " Crona LP Token";
  else if (pool.symbol.includes("Genesis-LP")) stakeTokenTicker += " Genesis LP Token";
  else if (pool.symbol.includes("Wagyu-LP")) stakeTokenTicker += " Wagyu LP Token";
  else if (pool.symbol.includes("OLP")) stakeTokenTicker += " Oolong LP Token";
  else if (pool.symbol.includes("TLP") && !pool.name.includes("Thorus LP")) stakeTokenTicker += " Trisolaris LP Token";
  else if (pool.symbol.includes("TLP") && pool.name.includes("Thorus LP")) stakeTokenTicker += " Thorus LP Token";
  else if (pool.symbol.includes("SCLP")) stakeTokenTicker += " SwapperChan LP Token";
  else if (pool.symbol.includes('VENOM-LP')) stakeTokenTicker += ' VENOM-LP Token';
  else if (pool.symbol.includes('Charm-LP')) stakeTokenTicker += ' OmniDex LP Token';
  else if (pool.symbol.includes('zLP')) stakeTokenTicker += ' Zappy LP Token';
  else if (pool.symbol.includes('MEERKAT-LP')) stakeTokenTicker += ' MEERKAT-LP Token';
  else if (pool.symbol.includes('STELLA LP')) stakeTokenTicker += ' STELLA LP Token';
  else stakeTokenTicker += " Uni LP";
  return {
      t0: t0,
      p0: p0,
      q0  : q0,
      t1: t1,
      p1: p1,
      q1  : q1,
      price: price,
      tvl : tvl,
      staked_tvl : staked_tvl,
      stakeTokenTicker : stakeTokenTicker,
      print_price(chain="eth", decimals, customURLs) {
        const t0address = t0.symbol == "ETH" ? "ETH" : t0.address;
        const t1address = t1.symbol == "ETH" ? "ETH" : t1.address;
        if (customURLs) {
          const poolUrl = `${customURLs.info}/${pool.address}`
          const helperUrls = [
            `${customURLs.add}/${t0address}/${t1address}`,
            `${customURLs.remove}/${t0address}/${t1address}`,
            `${customURLs.swap}?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ]
        }
        else {
          const poolUrl = pool.is1inch ? "https://1inch.exchange/#/dao/pools" :
          pool.symbol.includes("TETHYSLP") ?  `https://info.tethys.finance/pair/${pool.address}` :
          pool.symbol.includes("LSLP") ? `https://info.linkswap.app/pair/${pool.address}` :
            pool.symbol.includes("SLP") ? (
              {
                "eth": `http://analytics.sushi.com/pairs/${pool.address}`,
                "arbitrum": `http://analytics-arbitrum.sushi.com/pairs/${pool.address}`,
                "bsc": `http://analytics-ftm.sushi.com/pairs/${pool.address}`,
                "fantom": `http://analytics-ftm.sushi.com/pairs/${pool.address}`,
                "matic": `http://analytics-polygon.sushi.com/pairs/${pool.address}`,
                "xdai": `https://analytics-xdai.sushi.com/pairs/${pool.address}`,
                "harmony": `https://analytics-harmony.sushi.com/pairs/${pool.address}`
              }[chain]) :
              pool.symbol.includes("Cake") ?  `https://pancakeswap.info/pair/${pool.address}` :
              pool.symbol.includes("CAT-LP") ?  `https://polycat.finance` :
              pool.symbol.includes("PGL") ?  `https://info.pangolin.exchange/#/pair/${pool.address}` :
              pool.symbol.includes("DMM-LP") ?  (
                {
                  "eth": `https://info.dmm.exchange/pair/${t0address}_${t1address}`,
                  "avax": `https://avax-info.dmm.exchange/pair/${t0address}_${t1address}`,
                  "bsc": `https://bsc-info.dmm.exchange/pair/${t0address}_${t1address}`,
                  "matic": `https://polygon-info.dmm.exchange/pair/${t0address}_${t1address}`
                }
              [chain]):
              pool.symbol.includes("CS-LP") ?  `https://app.coinswap.space/#/` :
              pool.symbol.includes("NMX-LP") ?  `https://nomiswap.io/swap` :
              pool.symbol.includes("vAMM") ?  (
                {
                  "fantom": `https://solidly.exchange`,
                  "metis": `https://hermes.maiadao.io/#/swap`
                }
              [chain]):
              pool.symbol.includes("sAMM") ?  (
                {
                  "fantom" : `https://solidly.exchange`,
                  "metis" : `https://hermes.maiadao.io/#/swap`
                }
              [chain]):
              pool.symbol.includes("ZLK-LP") ?  `https://dex.zenlink.pro/#/info/overview` :
              pool.name.includes("Value LP") ?  `https://info.vswap.fi/pool/${pool.address}` :
              pool.name.includes("Duneswap LP Token") ?  `https://explorer.emerald.oasis.dev/token/${pool.address}` :
              pool.name.includes("Lizard LPs") ?  `https://explorer.emerald.oasis.dev/token/${pool.address}` :
              pool.name.includes("Gemkeeper LP Token") ?  `https://explorer.emerald.oasis.dev/token/${pool.address}` :
              pool.name.includes("Flare LP Token") ?  `https://analytics.solarflare.io/pairs/${pool.address}` :
              pool.symbol.includes("SCLP") ?  `https://analytics.swapperchan.com/pairs/${pool.address}` :
              pool.symbol.includes("DXS") ?  `https://dxstats.eth.link/#/pair/${pool.address}` :
              pool.name.includes("Ubeswap") ?  `https://info.ubeswap.org/pair/${pool.address}` :
              pool.symbol.includes("Farmtom-LP") ?  `https://farmtom.com/swap` :
              pool.symbol.includes("TOMB-V2-LP") ?  `https://swap.tomb.com/#/swap` :
              pool.name.includes("OperaSwap") ?  `https://www.operaswap.finance/` :
              pool.symbol.includes("SPIRIT") ?  `https://swap.spiritswap.finance/#/swap` :
              pool.symbol.includes("spLP") ?  `https://info.spookyswap.finance/pair/${pool.address}` :
              pool.symbol.includes("HAUS-LP") ?  `https://app.next-gen.finance/info/pool/${pool.address}` :
              pool.symbol.includes("Lv1") ?  `https://info.steakhouse.finance/pair/${pool.address}` :
              pool.symbol.includes("JLP") ?  `https://cchain.explorer.avax.network/address/${pool.address}` :
              pool.symbol.includes("ELP") ?  `https://app.elk.finance/#/swap` :
              pool.symbol.includes("BRUSH-LP") ?  `https://paintswap.finance` :
              pool.symbol.includes("PLP") ?  `https://exchange.pureswap.finance/#/swap` :
              pool.symbol.includes("HBLP") ?  `https://info.huckleberry.finance/pair/${pool.address}` :
              pool.symbol.includes("Wigo-LP") ?  `https://wigoswap.io/analytics/pool/${pool.address}` :
              pool.symbol.includes("BLP") ?  `https://info.bakeryswap.org/#/pair/${pool.address}` :
              pool.symbol.includes("BEAM-LP") ?  `https://analytics.beamswap.io/pairs/${pool.address}` :
              pool.symbol.includes("KUS-LP") ?  `https://kuswap.info/pair/#/${pool.address}` :
              pool.symbol.includes("Wagyu-LP") ?  `https://exchange.wagyuswap.app/info/pool/${pool.address}` :
              pool.symbol.includes("OLP") ?  `https://info.oolongswap.com/#/pair/${pool.address}` :
              pool.symbol.includes("KoffeeMug") ?  `https://koffeeswap.exchange/#/pro` :
              pool.symbol.includes("APE-LP") ?  `https://info.apeswap.finance/pair/${pool.address}` :
              pool.symbol.includes("VLP") ?  `https://info.viralata.finance/pair/${pool.address}` :
              pool.symbol.includes("DLP") ?  `https://app.dodoex.io/pool/list?${pool.address}` :
              pool.symbol.includes("ZDEXLP") ?  `https://charts.zoocoin.cash/?exchange=ZooDex&pair=${t0.symbol}-${t1.symbol}` :
              pool.symbol.includes("Field-LP") ?  `https://exchange.yieldfields.finance/#/swap` :
              pool.symbol.includes("MIMO-LP") ?  `https://v2.info.mimo.exchange/pair/${pool.address}` :
              pool.symbol.includes("MOCHI-LP") ?  `https://harmony.mochiswap.io/` :
              pool.symbol.includes("SMUG-LP") ?  `https://smugswap.com/` :
              pool.symbol.includes("UPT") ?  `https://www.app.unic.ly/#/discover` :
              pool.symbol.includes("lv_") ?  `https://app.lixir.finance/vaults/${pool.address}` :
              pool.symbol.includes("HLP") ?  `https://analytics.hadesswap.finance/pairs/${pool.address}` :
              pool.symbol.includes("LOOT-LP") ?  `https://analytics.lootswap.finance/pair/${pool.address}` :
              pool.symbol.includes("JEWEL-LP") ? `https://explorer.harmony.one/address/${pool.address}`:
              pool.symbol.includes("VVS-LP") ?  `https://vvs.finance/info/farm/${pool.address}` :
              pool.symbol.includes("CNO-LP") ?  `https://chronoswap.org/info/pool/${pool.address}` :
              pool.symbol.includes("TLP") && !pool.name.includes("Thorus LP") ?  `https://aurorascan.dev/address/${pool.address}` :
              pool.symbol.includes("TLP") && !pool.name.includes("Thorus LP") ?  `https://snowtrace.io/address/${pool.address}` :
              pool.symbol.includes("Crona-LP") ?  `https://app.cronaswap.org/info/${pool.address}` : //wait for real version
              pool.symbol.includes("Genesis-LP") ?  `https://app.cronaswap.org/info/${pool.address}` : //wait for real version
              pool.symbol.includes("BenSwap") ? ({
                "bsc": `https://info.benswap.finance/pair/${pool.address}`,
                "smartbch": `https://info.benswap.cash/pair/${pool.address}`
              }[chain]) :
              pool.name.includes("MISTswap LP Token") ?  `https://analytics.mistswap.fi/pairs/${pool.address}` :
              pool.symbol.includes("Proto-LP")? ({
                "matic":`https://polygonscan.com/${pool.address}` ,
                "fantom": `https://fantomscan.com/address/${pool.address}`
            }[chain]):
              pool.symbol.includes("Galaxy-LP") ? (
                {
                    "bsc": `https://bsc-exchange.galaxyfinance.one/#/swap`,
                    "heco": `https://heco-exchange.galaxyfinance.one/#/swap`,
                    "matic": `https://polygon-exchange.galaxyfinance.one/#/swap`,
                    "fantom": `https://fantom-exchange.galaxyfinance.one/#/swap`,
                }[chain]) :
              pool.symbol.includes("LOVE LP") ? ({
                "matic": `https://info.loveboat.exchange/pair/${pool.address}`
              }[chain]) : pool.symbol.includes('VENOM-LP')
          ? `https://info.viper.exchange/pairs/${pool.address}`
          : chain == "matic" ? `https://info.quickswap.exchange/pair/${pool.address}` :
          pool.symbol.includes("Charm-LP") ?  `https://analytics.omnidex.finance/pair/${pool.address}` :
          pool.symbol.includes("zLP") ?  `https://analytics.zappy.finance/pair/${pool.address}` :
            `http://v2.uniswap.info/pair/${pool.address}`;
          const helperUrls = pool.is1inch ? [] :
          pool.symbol.includes("LSLP") ? [
            `https://linkswap.app/#/add/${t0address}/${t1address}`,
            `https://linkswap.app/#/remove/${t0address}/${t1address}`,
            `https://linkswap.app/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("BenSwap") ? ({
            "bsc": [
              `https://dex.benswap.finance/#/add/${t0address}/${t1address}`,
              `https://dex.benswap.finance/#/remove/${t0address}/${t1address}`,
              `https://dex.benswap.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ],
            "smartbch": [
              `https://dex.benswap.cash/#/add/${t0address}/${t1address}`,
              `https://dex.benswap.cash/#/remove/${t0address}/${t1address}`,
              `https://dex.benswap.cash/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ]
          }[chain]) :
          pool.symbol.includes("vAMM") ? ({
            "fantom" : [
              `https://solidly.exchange/liquidity/create`,
              `https://solidly.exchange/liquidity/create`,
              `https://solidly.exchange/swap`
            ],
            "metis" : [
              `https://hermes.maiadao.io/#/add/${t0address}/${t1address}/false`,
              `https://hermes.maiadao.io/#/find`,
              `https://hermes.maiadao.io/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ]
          } [chain]):
          pool.symbol.includes("sAMM") ? ({
            "fantom" : [
              `https://solidly.exchange/liquidity/create`,
              `https://solidly.exchange/liquidity/create`,
              `https://solidly.exchange/swap`
            ],
            "metis" : [
              `https://hermes.maiadao.io/#/add/${t0address}/${t1address}/true`,
              `https://hermes.maiadao.io/#/find`,
              `https://hermes.maiadao.io/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ]
          } [chain]):
          pool.symbol.includes("HBLP") ? [
            `https://www.huckleberry.finance/#/add/${t0address}/${t1address}`,
            `https://www.huckleberry.finance/#/remove/${t0address}/${t1address}`,
            `https://www.huckleberry.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("DXS") ? [
            `https://swapr.eth.link/#/add/${t0address}/${t1address}`,
            `https://swapr.eth.link/#/remove/${t0address}/${t1address}`,
            `https://swapr.eth.link/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("HAUS-LP") ? [
            `https://app.next-gen.finance/add/${t0address}/${t1address}`,
            `https://app.next-gen.finance/remove/${t0address}/${t1address}`,
            `https://app.next-gen.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("TOMB-V2-LP") ? [
            `https://swap.tomb.com/#/add/${t0address}/${t1address}`,
            `https://swap.tomb.com/#/remove/${t0address}/${t1address}`,
            `https://swap.tomb.com/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("Wigo-LP") ? [
            `https://wigoswap.io/add/${t0address}/${t1address}`,
            `https://wigoswap.io/remove/${t0address}/${t1address}`,
            `https://wigoswap.io/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("ZLK-LP") ? [
            `https://dex.zenlink.pro/#/swap`,
            `https://dex.zenlink.pro/#/swap`,
            `https://dex.zenlink.pro/#/swap`
          ] :
          pool.symbol.includes("Farmtom-LP") ? [
            `https://farmtom.com/add/${t0address}/${t1address}`,
            `https://farmtom.com/remove/${t0address}/${t1address}`,
            `https://farmtom.com/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("BEAM-LP") ? [
            `https://app.beamswap.io/exchange/add/${t0address}/${t1address}`,
            `https://app.beamswap.io/exchange/remove/${t0address}/${t1address}`,
            `https://app.beamswap.io/exchange/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("NMX-LP") ? [
            `https://nomiswap.io/liquidity/add/${t0address}/${t1address}`,
            `https://nomiswap.io/liquidity/remove/${t0address}/${t1address}`,
            `https://nomiswap.io/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("TLP") && !pool.name.includes("Thorus LP") ? [
            `https://www.trisolaris.io/#/add/${t0address}/${t1address}`,
            `https://www.trisolaris.io/#/remove/${t0address}/${t1address}`,
            `https://www.trisolaris.io/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("TLP") && pool.name.includes("Thorus LP") ? [
            `https://app.thorus.fi/add/${t0address}/${t1address}`,
            `https://app.thorus.fi/remove/${t0address}/${t1address}`,
            `https://app.thorus.fi/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("VVS") ? [
            `https://vvs.finance/add/${t0address}/${t1address}`,
            `https://vvs.finance/remove/${t0address}/${t1address}`,
            `https://vvs.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("CNO") ? [
            `https://chronoswap.org/add/${t0address}/${t1address}`,
            `https://chronoswap.org/remove/${t0address}/${t1address}`,
            `https://chronoswap.org/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("OLP") ? [
            `https://oolongswap.com/#/add/${t0address}/${t1address}`,
            `https://oolongswap.com/#/remove/${t0address}/${t1address}`,
            `https://oolongswap.com/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("SCLP") ? [
            `https://swapperchan.com/add/${t0address}/${t1address}`,
            `https://swapperchan.com/remove/${t0address}/${t1address}`,
            `https://swapperchan.com/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("Crona-LP") ? [
            `https://app.cronaswap.org/add/${t0address}/${t1address}`,
            `https://app.cronaswap.org/remove/${t0address}/${t1address}`,
            `https://app.cronaswap.org/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("Genesis-LP") ? [
            `https://app.cronaswap.org/add/${t0address}/${t1address}`,
            `https://app.cronaswap.org/remove/${t0address}/${t1address}`,
            `https://app.cronaswap.org/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("BLP") ? [
            `https://www.bakeryswap.org/#/add/${t0address}/${t1address}`,
            `https://www.bakeryswap.org/#/remove/${t0address}/${t1address}`,
            `https://www.bakeryswap.org/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("HLP") ? [
            `https://hadesswap.finance/add/${t0address}/${t1address}`,
            `https://hadesswap.finance/remove/${t0address}/${t1address}`,
            `https://hadesswap.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("MOCHI-LP") ? [
            `https://harmony.mochiswap.io/add/${t0address}/${t1address}`,
            `https://harmony.mochiswap.io/remove/${t0address}/${t1address}`,
            `https://harmony.mochiswap.io/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("TETHYSLP") ? [
            `https://tethys.finance/pool/add?inputCurrency=${t0address}&outputCurrency=${t1address}`,
            `https://tethys.finance/pool/remove?inputCurrency=${t0address}&outputCurrency=${t1address}`,
            `https://tethys.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.name.includes("Duneswap LP Token") ? [
            `https://www.duneswap.com/exchange/add/${t0address}/${t1address}`,
            `https://www.duneswap.com/exchange/remove/${t0address}/${t1address}`,
            `https://www.duneswap.com/exchange/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.name.includes("Lizard LPs") ? [
            `https://app.lizard.exchange/add/${t0address}/${t1address}`,
            `https://app.lizard.exchange/remove/${t0address}/${t1address}`,
            `https://app.lizard.exchange/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.name.includes("Gemkeeper LP Token") ? [
            `https://app.gemkeeper.finance/#/add/${t0address}/${t1address}`,
            `https://app.gemkeeper.finance/#/remove/${t0address}/${t1address}`,
            `https://app.gemkeeper.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("SMUG-LP") ? [
            `https://smugswap.com/add/${t0address}/${t1address}`,
            `https://smugswap.com/remove/${t0address}/${t1address}`,
            `https://smugswap.com/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("lv_") ? [
            `https://app.lixir.finance/vaults/${pool.address}`,
            `https://app.lixir.finance/vaults/${pool.address}`,
            `https://app.uniswap.org/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}&use=v2`
          ] :
          pool.symbol.includes("DMM-LP") ? [
            `https://dmm.exchange/#/add/${t0address}/${t1address}/${pool.address}`,
            `https://dmm.exchange/#/remove/${t0address}/${t1address}/${pool.address}`,
            `https://dmm.exchange/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ]:
          pool.symbol.includes("Wagyu-LP") ? [
            `https://exchange.wagyuswap.app/add/${t0address}/${t1address}`,
            `https://exchange.wagyuswap.app/remove/${t0address}/${t1address}`,
            `https://exchange.wagyuswap.app/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ]:
          pool.symbol.includes("LOOT-LP") ? [
            `https://legacy.lootswap.finance/#/add/${t0address}/${t1address}`,
            `https://legacy.lootswap.finance/#/remove/${t0address}/${t1address}`,
            `https://legacy.lootswap.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ]:
          pool.symbol.includes("CAT-LP") ? [
            `https://trade.polycat.finance/#/add/${t0address}/${t1address}`,
            `https://trade.polycat.finance/#/remove/${t0address}/${t1address}`,
            `https://trade.polycat.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("APE-LP") ? [
            `https://app.apeswap.finance/add/${t0address}/${t1address}`,
            `https://app.apeswap.finance/remove/${t0address}/${t1address}`,
            `https://app.apeswap.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("ULP") ? [
            `https://app.ubeswap.org/#/add/${t0address}/${t1address}`,
            `https://app.ubeswap.org/#/remove/${t0address}/${t1address}`,
            `https://app.ubeswap.org/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("VLP") ? [
            `https://app.viralata.finance/add/${t0address}/${t1address}`,
            `https://app.viralata.finance/remove/${t0address}/${t1address}`,
            `https://app.viralata.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("ZDEXLP") ? [
            `https://dex.zoocoin.cash/pool/add?inputCurrency=${t0address}&outputCurrency=${t1address}`,
            `https://dex.zoocoin.cash/pool/remove?inputCurrency=${t0address}&outputCurrency=${t1address}`,
            `https://dex.zoocoin.cash/orders/market?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("Cake") ? [
            `https://pancakeswap.finance/add/${t0address}/${t1address}`,
            `https://pancakeswap.finance/remove/${t0address}/${t1address}`,
            `https://pancakeswap.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("Lv1") ? [ // adding before matic
            `https://swap.steakhouse.finance/#/add/${t0address}/${t1address}`,
            `https://swap.steakhouse.finance/#/remove/${t0address}/${t1address}`,
            `https://swap.steakhouse.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.name.includes("Value LP") ? [
            `https://bsc.valuedefi.io/#/add/${t0address}/${t1address}`,
            `https://bsc.valuedefi.io/#/remove/${t0address}/${t1address}`,
            `https://bsc.valuedefi.io/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("PGL") ? [
            `https://app.pangolin.exchange/#/add/${t0address}/${t1address}`,
            `https://app.pangolin.exchange/#/remove/${t0address}/${t1address}`,
            `https://app.pangolin.exchange/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("OperaSwap") ? [
            `https://exchange.operaswap.finance/#/add/${t0address}/${t1address}`,
            `https://exchange.operaswap.finance/#/remove/${t0address}/${t1address}`,
            `https://exchange.operaswap.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("ELP") ? [
            `https://app.elk.finance/#/add/${t0address}/${t1address}`,
            `hhttps://app.elk.finance/#/remove/${t0address}/${t1address}`,
            `https://app.elk.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("JEWEL-LP") ? [
            `https://game.defikingdoms.com/#/add/${t0address}/${t1address}`,
            `https://game.defikingdoms.com/#/remove/${t0address}/${t1address}`,
            `https://game.defikingdoms.com/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("DLP") ? [
            `https://app.dodoex.io/pool/list?${pool.address}`,
            `https://app.dodoex.io/pool/list?${pool.address}`,
            `https://app.dodoex.io/exchange/${t0address}-${t1address}`
          ] :
          pool.symbol.includes("CS-LP") ? [
            `https://app.coinswap.space/#/add/${t0address}/${t1address}`,
            `https://app.coinswap.space/#/remove/${t0address}/${t1address}`,
            `https://app.coinswap.space/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("SLP") ? [
            `https://app.sushi.com/add/${t0address}/${t1address}`,
            `https://app.sushi.com/remove/${t0address}/${t1address}`,
            `https://app.sushi.com/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("SPIRIT") ? [
            `https://swap.spiritswap.finance/add/${t0address}/${t1address}`,
            `https://swap.spiritswap.finance/remove/${t0address}/${t1address}`,
            `https://swap.spiritswap.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("SOUL-LP") ? [
            `https://app.soulswap.finance/add/${t0address}/${t1address}`,
            `https://app.soulswap.finance/remove/${t0address}/${t1address}`,
            `https://app.soulswap.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("spLP") ? [
            `https://spookyswap.finance/add/${t0address}/${t1address}`,
            `https://spookyswap.finance/remove/${t0address}/${t1address}`,
            `https://spookyswap.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("PLP") ? [
            `https://exchange.pureswap.finance/#/add/${t0address}/${t1address}`,
            `https://exchange.pureswap.finance/#/remove/${t0address}/${t1address}`,
            `https://exchange.pureswap.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("Proto-LP") ? ({
            "matic":[
            `https://dex.protofi.app/#/add/${t0address}/${t1address}`,
            `https://dex.protofi.app/#/remove/${t0address}/${t1address}`,
            `https://dex.protofi.app/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ],
          "fantom":[
            `https://fantomdex.protofi.app/#/add/${t0address}/${t1address}`,
            `https://fantomdex.protofi.app/#/remove/${t0address}/${t1address}`,
            `https://fantomdex.protofi.app/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ]}[chain])  :
          pool.symbol.includes("Field-LP") ? [
            `https://exchange.yieldfields.finance/#/add/${t0address}/${t1address}`,
            `https://exchange.yieldfields.finance/#/remove/${t0address}/${t1address}`,
            `https://exchange.yieldfields.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("UPT") ? [
            `https://www.app.unic.ly/#/add/${t0address}/${t1address}`,
            `https://www.app.unic.ly/#/remove/${t0address}/${t1address}`,
            `https://www.app.unic.ly/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("MIMO-LP") ? [
            `https://exchange.zoomswap.io/#/add/${t0address}/${t1address}`,
            `https://exchange.zoomswap.io/#/remove/${t0address}/${t1address}`,
            `https://exchange.zoomswap.io/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("BRUSH-LP") ? [
            `https://exchange.paintswap.finance/#/add/${t0address}/${t1address}`,
            `https://exchange.paintswap.finance/#/remove/${t0address}/${t1address}`,
            `https://exchange.paintswap.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("BenSwap") ? ({
            "bsc": [
              `https://dex.benswap.finance/#/add/${t0address}/${t1address}`,
              `https://dex.benswap.finance/#/remove/${t0address}/${t1address}`,
              `https://dex.benswap.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ],
            "smartbch": [
              `https://dex.benswap.cash/#/add/${t0address}/${t1address}`,
              `https://dex.benswap.cash/#/remove/${t0address}/${t1address}`,
              `https://dex.benswap.cash/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ]
          }[chain]) :
          pool.name.includes("MISTswap LP Token") ? [
            `https://app.mistswap.fi/add/${t0address}/${t1address}`,
            `https://app.mistswap.fi/remove/${t0address}/${t1address}`,
            `https://app.mistswap.fi/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.name.includes("TANGOswap LP Token") ? [
            `https://tangoswap.cash/add/${t0address}/${t1address}`,
            `https://tangoswap.cash/remove/${t0address}/${t1address}`,
            `https://tangoswap.cash/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.name.includes("Flare LP Token") ? [
            `https://www.solarflare.io/exchange/add/${t0address}/${t1address}`,
            `https://www.solarflare.io/exchange/remove/${t0address}/${t1address}`,
            `https://www.solarflare.io/exchange/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.name.includes("1BCH LP Token") ? [
            `https://1bch.com/add/${t0address}/${t1address}`,
            `https://1bch.com/remove/${t0address}/${t1address}`,
            `https://1bch.com/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("Galaxy-LP") ? ({
            "bsc": [
              `https://bsc-exchange.galaxyfinance.one/#/add/${t0address}/${t1address}`,
              `https://bsc-exchange.galaxyfinance.one/#/remove/${t0address}/${t1address}`,
              `https://bsc-exchange.galaxyfinance.one/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ],
            "heco": [
              `https://heco-exchange.galaxyfinance.one/#/add/${t0address}/${t1address}`,
              `https://heco-exchange.galaxyfinance.one/#/remove/${t0address}/${t1address}`,
              `https://heco-exchange.galaxyfinance.one/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ],
            "polygon": [
              `https://polygon-exchange.galaxyfinance.one/#/add/${t0address}/${t1address}`,
              `https://polygon-exchange.galaxyfinance.one/#/remove/${t0address}/${t1address}`,
              `https://polygon-exchange.galaxyfinance.one/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ],
            "fantom": [
              `https://fantom-exchange.galaxyfinance.one/#/add/${t0address}/${t1address}`,
              `https://fantom-exchange.galaxyfinance.one/#/remove/${t0address}/${t1address}`,
              `https://fantom-exchange.galaxyfinance.one/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ]
          }[chain]) :
          chain=='matic'? [
            `https://quickswap.exchange/#/add/${t0address}/${t1address}`,
            `https://quickswap.exchange/#/remove/${t0address}/${t1address}`,
            `https://quickswap.exchange/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("KUS-LP") ? [
              `https://kuswap.finance/#/add/${t0address}/${t1address}`,
              `https://kuswap.finance/#/remove/${t0address}/${t1address}`,
              `https://kuswap.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("KoffeeMug") ? [
            `https://koffeeswap.exchange/#/add/${t0address}/${t1address}`,
            `https://koffeeswap.exchange/#/remove/${t0address}/${t1address}`,
            `https://koffeeswap.exchange/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
        ] :
          pool.symbol.includes("LOVE LP") ? ({
            "matic": [
              `https://loveboat.exchange/#/add/${t0address}/${t1address}`,
              `https://loveboat.exchange/#/remove/${t0address}/${t1address}`,
              `https://loveboat.exchange/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
            ]
          }[chain]) : pool.symbol.includes('VENOM-LP')
          ? [
              `https://viper.exchange/#/add/${t0address}/${t1address}`,
              `https://viper.exchange/#/remove/${t0address}/${t1address}`,
              `https://viper.exchange/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`,
            ] :
          pool.symbol.includes("Charm-LP") ? [
            `https://omnidex.finance/add/${t0address}/${t1address}`,
            `https://omnidex.finance/remove/${t0address}/${t1address}`,
            `https://omnidex.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ] :
          pool.symbol.includes("zLP") ? [
            `https://zappy.finance/liquidity/pool?main=${t0address}&base=${t1address}`,
            `https://zappy.finance/liquidity/pool?main=${t0address}&base=${t1address}`,
            `https://zappy.finance/swap?from=${t0address}&to=${t1address}`
          ] :
          [ `https://app.uniswap.org/#/add/v2/${t0address}/${t1address}`,
            `https://app.uniswap.org/#/remove/v2/${t0address}/${t1address}`,
            `https://app.uniswap.org/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}&use=v2` ]
        }
      },
      pair_links(chain="eth", decimals, customURLs) {
        const t0address = t0.symbol == "ETH" ? "ETH" : t0.address;
        const t1address = t1.symbol == "ETH" ? "ETH" : t1.address;
        if (customURLs) {
          const poolUrl = `${customURLs.info}/${pool.address}`
          const helperUrls = [
            `${customURLs.add}/${t0address}/${t1address}`,
            `${customURLs.remove}/${t0address}/${t1address}`,
            `${customURLs.swap}?inputCurrency=${t0address}&outputCurrency=${t1address}`
          ]
          return {
            pair_link: `<a href='${poolUrl}' target='_blank'>${stakeTokenTicker}</a>`,
            add_liquidity_link: `<a href='${helperUrls[0]}' target='_blank'>[+]</a>`,
            remove_liquidity_link: `<a href='${helperUrls[1]}' target='_blank'>[-]</a>`,
            swap_link: `<a href='${helperUrls[2]}' target='_blank'>[<=>]</a>`,
            token0: t0.symbol,
            price0: `$${displayPrice(p0)}`,
            token1: t1.symbol,
            price1: `$${displayPrice(p1)}`,
            total_staked: `${pool.staked.toFixed(4)}`,
            total_staked_dollars: `$${formatMoney(staked_tvl)}`,
            tvl: `$${formatMoney(tvl)}`
          }
        }
        else {
          const poolUrl = pool.is1inch ? "https://1inch.exchange/#/dao/pools" :
            pool.symbol.includes("LSLP") ? `https://info.linkswap.app/pair/${pool.address}` :
              pool.symbol.includes("SLP") ?  `http://analytics.sushi.com/pairs/${pool.address}` :
                pool.symbol.includes("Cake") ?  `https://pancakeswap.info/pair/${pool.address}` :
                  pool.symbol.includes("PGL") ?  `https://info.pangolin.exchange/#/pair/${pool.address}` :
                    pool.symbol.includes("CS-LP") ?  `https://app.coinswap.space/#/` :
                      pool.name.includes("Value LP") ?  `https://info.vswap.fi/pool/${pool.address}` :
                        pool.name.includes("BLP") ?  `https://info.bakeryswap.org/#/pair/${pool.address}` :
                          pool.symbol.includes("BenSwap") ? ({
                            "bsc": `https://info.benswap.finance/pair/${pool.address}`,
                            "smartbch": `https://info.benswap.cash/pair/${pool.address}`
                          }[chain]) :
                          pool.name.includes("MISTswap LP Token") ?  `http://analytics.mistswap.fi/pairs/${pool.address}` :
                          pool.symbol.includes("Galaxy-LP") ? ({
                            "bsc": `https://bsc-exchange.galaxyfinance.one/#/swap`,
                            "heco": `https://heco-exchange.galaxyfinance.one/#/swap`,
                            "polygon": `https://polygon-exchange.galaxyfinance.one/#/swap`,
                            "fantom": `https://fantom-exchange.galaxyfinance.one/#/swap`
                          }[chain]) :
                            chain == "matic" ? `https://info.quickswap.exchange/pair/${pool.address}` :
                          pool.symbol.includes("Charm-LP") ?  `https://analytics.omnidex.finance/pair/${pool.address}` :
                          pool.symbol.includes("zLP") ?  `https://analytics.omnidex.finance/pair/${pool.address}` :
                              `http://v2.uniswap.info/pair/${pool.address}`;
          const helperUrls = pool.is1inch ? [] :
            pool.symbol.includes("LSLP") ? [
                `https://linkswap.app/#/add/${t0address}/${t1address}`,
                `https://linkswap.app/#/remove/${t0address}/${t1address}`,
                `https://linkswap.app/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
              ] :
              pool.symbol.includes("Cake") ? [
                  `https://pancakeswap.finance/add/${t0address}/${t1address}`,
                  `https://pancakeswap.finance/remove/${t0address}/${t1address}`,
                  `https://pancakeswap.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                ] :
                chain=='matic'? [
                    `https://quickswap.exchange/#/add/${t0address}/${t1address}`,
                    `https://quickswap.exchange/#/remove/${t0address}/${t1address}`,
                    `https://quickswap.exchange/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                  ] :
                  pool.name.includes("Value LP") ? [
                      `https://bsc.valuedefi.io/#/add/${t0address}/${t1address}`,
                      `https://bsc.valuedefi.io/#/remove/${t0address}/${t1address}`,
                      `https://bsc.valuedefi.io/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                    ] :
                    pool.symbol.includes("PGL") ? [
                        `https://app.pangolin.exchange/#/add/${t0address}/${t1address}`,
                        `https://app.pangolin.exchange/#/remove/${t0address}/${t1address}`,
                        `https://app.pangolin.exchange/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                      ] :
                      pool.symbol.includes("CS-LP") ? [
                          `https://app.coinswap.space/#/add/${t0address}/${t1address}`,
                          `https://app.coinswap.space/#/remove/${t0address}/${t1address}`,
                          `https://app.coinswap.space/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                        ] :
                        pool.symbol.includes("SLP") ? [
                            `https://app.sushi.com/add/${t0address}/${t1address}`,
                            `https://app.sushi.com/remove/${t0address}/${t1address}`,
                            `https://app.sushi.com/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                          ] :
                          pool.symbol.includes("BenSwap") ? ({
                            "bsc": [
                              `https://dex.benswap.finance/#/add/${t0address}/${t1address}`,
                              `https://dex.benswap.finance/#/remove/${t0address}/${t1address}`,
                              `https://dex.benswap.finance/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                            ],
                            "smartbch": [
                              `https://dex.benswap.cash/#/add/${t0address}/${t1address}`,
                              `https://dex.benswap.cash/#/remove/${t0address}/${t1address}`,
                              `https://dex.benswap.cash/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                            ]
                          }[chain]) :
                        pool.name.includes("MISTswap LP Token") ? [
                          `https://app.mistswap.fi/add/${t0address}/${t1address}`,
                          `https://app.mistswap.fi/remove/${t0address}/${t1address}`,
                          `https://app.mistswap.fi/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                        ] :
                        pool.name.includes("TANGOswap LP Token") ? [
                          `https://tangoswap.cash/add/${t0address}/${t1address}`,
                          `https://tangoswap.cash/remove/${t0address}/${t1address}`,
                          `https://tangoswap.cash/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                        ] :
                        pool.symbol.includes("Galaxy-LP") ? ({
                            "bsc": [
                            `https://bsc-exchange.galaxyfinance.one/#/add/${t0address}/${t1address}`,
                            `https://bsc-exchange.galaxyfinance.one/#/remove/${t0address}/${t1address}`,
                            `https://bsc-exchange.galaxyfinance.one/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                            ],
                            "heco": [
                            `https://heco-exchange.galaxyfinance.one/#/add/${t0address}/${t1address}`,
                            `https://heco-exchange.galaxyfinance.one/#/remove/${t0address}/${t1address}`,
                            `https://heco-exchange.galaxyfinance.one/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                            ],
                            "polygon": [
                            `https://polygon-exchange.galaxyfinance.one/#/add/${t0address}/${t1address}`,
                            `https://polygon-exchange.galaxyfinance.one/#/remove/${t0address}/${t1address}`,
                            `https://polygon-exchange.galaxyfinance.one/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                            ],
                            "fantom": [
                            `https://fantom-exchange.galaxyfinance.one/#/add/${t0address}/${t1address}`,
                            `https://fantom-exchange.galaxyfinance.one/#/remove/${t0address}/${t1address}`,
                            `https://fantom-exchange.galaxyfinance.one/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                            ]
                        }[chain]) :
                        pool.symbol.includes("Charm-LP") ? [
                          `https://omnidex.finance/add/${t0address}/${t1address}`,
                          `https://omnidex.finance/remove/${t0address}/${t1address}`,
                          `https://omnidex.finance/swap?inputCurrency=${t0address}&outputCurrency=${t1address}`
                        ] :
                        pool.symbol.includes("zLP") ? [
                          `https://zappy.finance/liquidity/pool?main=${t0address}&base=${t1address}`,
                          `https://zappy.finance/liquidity/pool?main=${t0address}&base=${t1address}`,
                          `https://zappy.finance/swap?from=${t0address}&to=${t1address}`
                        ] :
                            [ `https://app.uniswap.org/#/add/v2/${t0address}/${t1address}`,
                              `https://app.uniswap.org/#/remove/v2/${t0address}/${t1address}`,
                              `https://app.uniswap.org/#/swap?inputCurrency=${t0address}&outputCurrency=${t1address}&use=v2` ]

          return {
            pair_link: `<a href='${poolUrl}' target='_blank'>${stakeTokenTicker}</a>`,
            add_liquidity_link: `<a href='${helperUrls[0]}' target='_blank'>[+]</a>`,
            remove_liquidity_link: `<a href='${helperUrls[1]}' target='_blank'>[-]</a>`,
            swap_link: `<a href='${helperUrls[2]}' target='_blank'>[<=>]</a>`,
            token0: t0.symbol,
            price0: `$${displayPrice(p0)}`,
            token1: t1.symbol,
            price1: `$${displayPrice(p1)}`,
            total_staked: `${pool.staked.toFixed(4)}`,
            total_staked_dollars: `$${formatMoney(staked_tvl)}`,
            tvl: `$${formatMoney(tvl)}`
          }

        }
      },
      print_contained_price(userStaked) {
        var userPct = userStaked / pool.totalSupply;
        var q0user = userPct * q0;
        var q1user = userPct * q1;
      }
  }
}

function getTriCryptoPrices(prices, pool, chain){
    let tvl = 0;
    for(let i = 0; i < pool.coins.length; i++){
      const price = (getParameterCaseInsensitive(prices,pool.coins[i].address).usd);
      if (getParameterCaseInsensitive(prices, pool.address)?.usd ?? 0 == 0) {
        prices[pool.address] = { usd : price };
      }
      tvl += pool.coins[i].balance * price;
    }
    const price = tvl / (pool.totalSupply / 10 ** pool.decimals);
    const staked_tvl = pool.staked * price;
    const poolUrl = getChainExplorerUrl(chain, pool.address);
    const name = `<a href='${poolUrl}' target='_blank'>${pool.symbol}</a>`;
    return {
      staked_tvl : staked_tvl,
      price,
      stakeTokenTicker : pool.symbol,
      print_contained_price() {
      },
      tvl : tvl
    }
}

function getCurvePrices(prices, pool, chain) {
    var price;
      if(pool.token !=undefined){
          price = (getParameterCaseInsensitive(prices,pool.token.address)?.usd);
      }else{
          return {}
      }
    if(price){
      price = price * pool.virtualPrice;
    }else{
      switch(pool.token.address){
        case "0x8751D4196027d4e6DA63716fA7786B5174F04C15" : //wibBTC
          pool.token.address = "0xc4e15973e6ff2a35cc804c2cf9d2a1b817a8b40f" //ibBTC
      }
      price = getPoolPrices(pool.token.tokens, prices, pool.token, chain).price * pool.virtualPrice;
    }
    if (getParameterCaseInsensitive(prices, pool.address)?.usd ?? 0 == 0) {
      prices[pool.address] = { usd : price };
    }
    var tvl = pool.totalSupply * price / 10 ** pool.decimals;
    var staked_tvl = pool.staked * price;
    const poolUrl = getChainExplorerUrl(chain, pool.address);
    const name = `<a href='${poolUrl}' target='_blank'>${pool.symbol}</a>`;
    const getDexguruTokenlink =  function() {
      const network = window.location.pathname.split("/")[1]
      let dexguruTokenlink = '';
      if (tvl > 0) {
        if (network && (network.toLowerCase() === 'bsc' || network.toLowerCase() === 'eth' || network.toLowerCase() === 'polygon')) {
          dexguruTokenlink =   `<a href='https://dex.guru/token/${pool.address.toLowerCase()}-${network.toLowerCase()}' rel='noopener' target='_blank'>[%]</a>`;
        }
      }
      return dexguruTokenlink
    }
  
    return {
      staked_tvl : staked_tvl,
      price : price,
      stakeTokenTicker : pool.symbol,
      tvl : tvl
    }
}

function getWrapPrices(tokens, prices, pool, chain)
{
  const wrappedToken = pool.token;
  if (wrappedToken.token0 != null) { //Uniswap
    const uniPrices = getUniPrices(tokens, prices, wrappedToken);
    const contractUrl = getChainExplorerUrl(chain, pool.address)
    const poolUrl = pool.is1inch ? "https://1inch.exchange/#/dao/pools" :
    pool.symbol.includes("SLP") ?  `http://analytics.sushi.com/pairs/${wrappedToken.address}` :
    (pool.symbol.includes("Cake") || pool.symbol.includes("Pancake")) ?  `http://pancakeswap.info/pair/${wrappedToken.address}` :
    pool.symbol.includes("Charm-LP") ?  `https://analytics.omnidex.finance/pair/${wrappedToken.address}`:
    pool.symbol.includes("zLP") ?  `https://analytics.zappy.finance/pair/${wrappedToken.address}`
      : `http://v2.uniswap.info/pair/${wrappedToken.address}`;
    const name = `<a href='${contractUrl}' target='_blank'>${pool.symbol}</a> (Wrapped <a href='${poolUrl}' target='_blank'>${uniPrices.stakeTokenTicker}</a>)`;
    const price = (pool.balance / 10 ** wrappedToken.decimals) * uniPrices.price / (pool.totalSupply / 10 ** pool.decimals);
    const tvl = pool.balance / 10 ** wrappedToken.decimals * price;
    const staked_tvl = pool.staked * price;

    prices[pool.address] = { usd : price };
    return {
      name : name,
      tvl : tvl,
      staked_tvl : staked_tvl,
      price : price,
      stakeTokenTicker : pool.symbol
    }
  }
  else {
    let tokenPrice = 0;
    if (wrappedToken.token != null) { //e.g. stakedao crv token vault
      const pp = getPoolPrices(tokens, prices, wrappedToken.token)
      tokenPrice = pp.price;
    }
    else {
      tokenPrice = getParameterCaseInsensitive(prices, wrappedToken.address)?.usd;
    }
    const poolUrl = getChainExplorerUrl(chain, pool.token.address)
    const contractUrl = getChainExplorerUrl(chain, pool.address)
    const name = `<a href='${contractUrl}' target='_blank'>${pool.symbol}</a> (Wrapped <a href='${poolUrl}' target='_blank'>${wrappedToken.symbol}</a>)`;
    const price = (pool.balance / 10 ** wrappedToken.decimals) * tokenPrice / (pool.totalSupply / 10 ** pool.decimals);
    const tvl = pool.totalSupply / 10 ** pool.decimals * price
    const staked_tvl = pool.staked * price;
    prices[pool.address] = { usd : price };
    return {
      name: name,
      tvl : tvl,
      staked_tvl : staked_tvl,
      price : price,
      stakeTokenTicker : pool.symbol,
    }
  }
}

function getErc20Prices(prices, pool, chain="eth") {
    var price = getParameterCaseInsensitive(prices,pool.address)?.usd;
    var tvl = pool.totalSupply * price / 10 ** pool.decimals;
    var staked_tvl = pool.staked * price;
    let poolUrl;
    switch (chain) {
      case "eth":
        poolUrl=`https://etherscan.io/token/${pool.address}`;
        break;
      case "bsc":
        poolUrl=`https://bscscan.com/token/${pool.address}`;
        break;
      case "heco":
        poolUrl=`https://hecoinfo.com//token/${pool.address}`;
        break;
      case "matic":
        poolUrl=`https://explorer-mainnet.maticvigil.com/address/${pool.address}`;
        break;
      case "okex":
        poolUrl=`https://www.oklink.com/okexchain/address/${pool.address}`;
        break;
      case "kcc":
        poolUrl=`https://explorer.kcc.io/en/address/${pool.address}`;
        break;
      case "avax":
        poolUrl=`https://cchain.explorer.avax.network/address/${pool.address}`;
        break;
      case "dfk":
        poolUrl=`https://subnets.avax.network/defi-kingdoms/dfk-chain/explorer/address/${pool.address}`;
        break;
      case "fantom":
        poolUrl=`https://ftmscan.com/token/${pool.address}`;
        break;
      case "emerald":
        poolUrl=`https://explorer.emerald.oasis.dev/token/${pool.address}`;
        break;
      case "metis":
        poolUrl=`https://andromeda-explorer.metis.io/token/${pool.address}`;
        break;
      case "meter":
        poolUrl=`https://scan.meter.io/token/${pool.address}`;
        break;
      case "cronos":
        poolUrl=`https://cronoscan.com/address/${pool.address}`;
        break;
      case "moonbeam":
        poolUrl=`https://moonscan.io/address/${pool.address}`;
        break;
      case "velas":
        poolUrl=`https://evmexplorer.velas.com/address/${pool.address}`;
        break;
      case "aurora":
        poolUrl=`https://aurorascan.dev/address/${pool.address}`;
        break;
      case "boba":
        poolUrl=`https://blockexplorer.boba.network/address/${pool.address}`;
        break;
      case "optimism":
        poolUrl=`https://optimistic.etherscan.io/token/${pool.address}`;
        break;
      case "fuse":
        poolUrl=`https://explorer.fuse.io/address/${pool.address}`;
        break;
      case "xdai":
        poolUrl=`https://blockscout.com/xdai/mainnet/tokens/${pool.address}`;
        break;
      case "celo":
        poolUrl=`https://explorer.celo.org/address/${pool.address}`;
        break;
      case "iotex":
        poolUrl=`https://iotexscan.io/token/${pool.address}`;
        break;
      case "moonriver":
        poolUrl=`https://moonriver.moonscan.io/address/${pool.address}`;
        break;
      case "arbitrum":
        poolUrl=`https://arbiscan.io/address/${pool.address}`;
        break;
      case "smartbch":
        poolUrl=`https://smartscan.cash/address/${pool.address}`;
        break;
      case "harmony":
        poolUrl=`https://explorer.harmony.one/address/${pool.address}`;
        break;
      case "polis":
        poolUrl=`https://explorer.polis.tech/address/${pool.address}`;
        break;
      case "telos":
        poolUrl=`https://www.teloscan.io/address/${pool.address}`;
        break;
    }
  
    const getDexguruTokenlink =  function() {
      const network = window.location.pathname.split("/")[1]
      let dexguruTokenlink = '';
      if (tvl > 0) {
        if (network && (network.toLowerCase() === 'bsc' || network.toLowerCase() === 'eth' || network.toLowerCase() === 'polygon')) {
          dexguruTokenlink =   `<a href='https://dex.guru/token/${pool.address.toLowerCase()}-${network.toLowerCase()}' rel='noopener' target='_blank'>[%]</a>`;
        }
        if (chain && (chain.toLowerCase() === 'bsc' || chain.toLowerCase() === 'eth' || chain.toLowerCase() === 'polygon')) {
          dexguruTokenlink =   `<a href='https://dex.guru/token/${pool.address.toLowerCase()}-${chain.toLowerCase()}' rel='noopener' target='_blank'>[%]</a>`;
        }
      }
      return dexguruTokenlink
    }
  
    const name = `<a href='${poolUrl}' target='_blank'>${pool.symbol}</a>`;
    return {
      staked_tvl : staked_tvl,
      price : price,
      stakeTokenTicker : pool.symbol,
      tvl : tvl
    }
}

export function getPoolPrices(tokens, prices, pool, chain = "eth") {
    if (pool.w0 != null) return getValuePrices(tokens, prices, pool);
    if (pool.buniPoolTokens != null) return getBunicornPrices(tokens, prices, pool, chain);
    if (pool.poolTokens != null) return getBalancerPrices(tokens, prices, pool, chain);
    if (pool.isGelato) return getGelatoPrices(tokens, prices, pool, chain);
    if (pool.token0 != null) return getUniPrices(tokens, prices, pool, chain);
    if (pool.xcp_profit != null) return getTriCryptoPrices(prices, pool, chain);
    if (pool.yearn) return getYearnPrices(prices, pool, chain);
    if (pool.virtualPrice != null) return getCurvePrices(prices, pool, chain); //should work for saddle too
    if (pool.token != null) return getWrapPrices(tokens, prices, pool, chain);
    return getErc20Prices(prices, pool, chain);
}

function getYearnPrices(prices, pool, chain){
    let price = 0
    let underlyingPrice = getParameterCaseInsensitive(prices, pool.token.address)?.usd;
    if(underlyingPrice){
      price = underlyingPrice * pool.ppfs;
    }else{
      underlyingPrice = getPoolPrices(pool.token.tokens, prices, pool.token, chain).price;
      price = underlyingPrice * pool.ppfs;
    }
    const tvl = (pool.token.totalSupply / 10 ** pool.token.decimals) * price
    const staked_tvl = pool.balance * price;
    const poolUrl = getChainExplorerUrl(chain, pool.address);
    const name = `<a href='${poolUrl}' target='_blank'>${pool.symbol}</a>`;
    let decimals = 0
  
    if(price > 0.1){
      decimals = 2
    }else if(price > 0.01){
      decimals = 4
    }else if(price > 0.001){
      decimals = 5
    }else if(price > 0.0001){
      decimals = 6
    }else if(price > 0.00001){
      decimals = 7
    }else { decimals = 2; }
  
    return {
      staked_tvl : staked_tvl,
      price,
      stakeTokenTicker : pool.symbol,
      tvl
    }
}
  

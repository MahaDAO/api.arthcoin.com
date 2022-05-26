import { polygonProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

import {
  getCollateralPrices,
  CollateralKeys,
  ICollateralPrices,
} from "./coingecko";

const cache = new NodeCache();

// ABIs
const BaseGaugeV1ABI = require("../abi/BaseGaugeV1.json");
const IERC20 = require("../abi/IERC20.json");

const polygon = {
  arthu3poolStaking: "0x245AE0bBc1E31e7279F0835cE8E93127A13a3781",
  arthu3poolLP: "0xDdE5FdB48B2ec6bc26bb4487f8E3a4EB99b3d633",
  arthUsdcStaking: "0xD585bfCF37db3C2507e2D44562F0Dbe2E4ec37Bc",
  arthMahaStaking: "0xC82c95666bE4E89AED8AE10bab4b714cae6655d5",
  arthMahaLP: "0x95de8efD01dc92ab2372596B3682dA76a79f24c3",
  arthUsdcLP: "0x34aAfA58894aFf03E137b63275aff64cA3552a3E",
  usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  "arth.usd": "0x84f168e646d31F6c33fDbF284D9037f59603Aa28",
  "polygon.3pool": "0x19793b454d3afc7b454f206ffe95ade26ca6912c",
  arth: "0xe52509181feb30eb4979e29ec70d50fd5c44d590",
  maha: "0xedd6ca8a4202d4a36611e2fff109648c4863ae19",
  troveManager: "0xe5EfD185Bd7c288e270bA764E105f8964aAecd41",
  priceFeed: "0x935c70e4B9371f63A598BdA58BF1B2b270C8eBFe"
};

const polygonMatic = {
    daiMahaGuage: "0x0AEfb132a53feD4e555F01e52db40C8490c0da1d",
    daiMahaLP: "0x208F0A5A5F842E9c761e668e6a560865176ab57e",
    daiSolidGuage: "0x7D4f9CAA114d55Bc2e77ba7B940d60D3e1e64fa2",
    daiSolidLP: "0x1Ca805046A05d09Ac20d2Ab5D44B18D6238D39a5",
    mahaSolidGuage: "0x281eCb4D21508e1B029d0FC005E7fd9eED2Af86a",
    mahaSolidLP: "0xbdCbF9F08cDA7B596EeEC5a1035B0e945fbB5e29",
    dai: "0x544380b5ee3d1a8485671537a553f61f3c7190f1",
    maha: "0x7af163582b3ebaabb7bce03aada8c1d76d655a5c",
    solid: "0x62C33009b62B1e972c01820Ac608D9F8992190F5"
}

const tokenDecimals: ICollateralPrices = {
  ARTH: 18,
  WBTC: 18,
  "ARTH.usd": 18,
  "polygon.3pool": 18,
  BUSD: 18,
  DAI: 18,
  WETH: 18,
  "bsc.3eps": 18,
  USDT: 6,
  MAHA: 18,
  SCLP: 18,
  USDC: 6,
  BANNANA: 18,
  BSCUSDC: 18,
  BSCUSDT: 18,
  FRAX: 18,
  SOLID: 18
};

const wallet = new ethers.Wallet(
  process.env.WALLET_KEY,
  polygonTestnetProvider
)

export const getTokenSymbol = async (tokenAddress) => {
    let symbol 
    switch (tokenAddress) {
        case "0x62C33009b62B1e972c01820Ac608D9F8992190F5":
            symbol = "SOLID";
        break;
        case "0x7aF163582b3ebAAbB7bce03aaDa8C1d76d655a5c":
            symbol = "MAHA";
        break;
        case "0x544380B5EE3d1a8485671537a553F61f3c7190f1":
            symbol = "DAI";
        break;
        default:
            symbol = "NEW";
    }

    return symbol
}

const rewardRemaining = async (
    guage
) => {
    let rewardsLeftObj = {}
    const guageRewardslength = await guage.rewardsListLength()
    
    for(var i = 0; i < Number(guageRewardslength); i++){
        const rewardsToken = await guage.rewards(i)
        //console.log('rewardsToken', rewardsToken);
        
        const symbol = await getTokenSymbol(rewardsToken)
        //console.log(symbol);

        const rewardtokenDecimal = BigNumber.from(10).pow(tokenDecimals[symbol]);
        const rewardsLeft = ( await guage.left(rewardsToken)).div(rewardtokenDecimal)

        //console.log("rewardsLeft", Number(rewardsLeft), await guage.left(rewardsToken), tokenDecimals[symbol]);
         
        rewardsLeftObj[`${symbol}`] = Number(rewardsLeft)
        //console.log(rewardsLeftObj);
    }
    
    return rewardsLeftObj
}

const getAPR = async (
  contractTVLinUSD: number,
  collateralPrices: ICollateralPrices,
  guageAddress,
  provider
) => {
    const stakingContract = new ethers.Contract(
        guageAddress,
        BaseGaugeV1ABI,
        provider
    );
    //const rewardinUSD = 12 * monthlyRewardinMAHA * collateralPrices.MAHA;  
    const rewardsleftResponse = await rewardRemaining(stakingContract)
    // console.log(rewardsleftResponse);

    const mahaRewardinUSD = rewardsleftResponse['MAHA'] * collateralPrices.MAHA
    // console.log( rewardsleftResponse['MAHA'],collateralPrices.MAHA, mahaRewardinUSD);
    
    const daiRewardinUSD = rewardsleftResponse['DAI'] * collateralPrices.DAI
    // console.log(daiRewardinUSD);
    
    const solidRewardinUSD = rewardsleftResponse['SOLID'] * collateralPrices.SOLID

    const rewardinUSD = mahaRewardinUSD + daiRewardinUSD + solidRewardinUSD
    return (rewardinUSD / contractTVLinUSD) * 100;
};

const getUniswapLPTokenTVLinUSD = async (
  lpAddress: string,
  tokenAddresses: string[],
  tokenNames: string[],
  collateralPrices: ICollateralPrices,
  provider: ethers.providers.Provider
) => {
  const token1 = new ethers.Contract(tokenAddresses[0], IERC20, provider);
  const token2 = new ethers.Contract(tokenAddresses[1], IERC20, provider);

  const token1Balance: BigNumber = await token1.balanceOf(lpAddress);
  const token2Balance: BigNumber = await token2.balanceOf(lpAddress);
  
  const token1Decimals = BigNumber.from(10).pow(tokenDecimals[tokenNames[0]]);
  const token2Decimals = BigNumber.from(10).pow(tokenDecimals[tokenNames[1]]);

  const token1Amount = token1Balance.div(token1Decimals);
  const token2Amount = token2Balance.div(token2Decimals);

//   console.log(
//     "token1Amount", Number(token1Amount), 
//     "token2Amount", Number(token2Amount)
//   );

  const token1USDValue = token1Amount
    .mul(Math.floor(1000 * collateralPrices[tokenNames[0]]))
    .div(1000);
  const token2USDValue = token2Amount
    .mul(Math.floor(1000 * collateralPrices[tokenNames[1]]))
    .div(1000);
  
//   console.log(
//     "token1USDValue", Number(token1USDValue), 
//     "token2USDValue", Number(token2USDValue), 
//     collateralPrices[tokenNames[0]], collateralPrices[tokenNames[1]]
//   );
  
  // total usd in the LP token
  return token1USDValue.add(token2USDValue);
};

const getTVL = async (
    guageAddress: string,
    lpAddress: string,
    tokenAddresses: string[],
    tokenNames: CollateralKeys[],
    collateralPrices: ICollateralPrices,
    provider: ethers.providers.Provider
) => {
    const stakingContract = new ethers.Contract(
        guageAddress,
        BaseGaugeV1ABI,
        provider
    );

    const lpToken = new ethers.Contract(lpAddress, IERC20, provider);
  
    let lpTokenTVLinUSD
    lpTokenTVLinUSD = await getUniswapLPTokenTVLinUSD(
        lpAddress,
        tokenAddresses,
        tokenNames,
        collateralPrices,
        provider
    )
  
    // console.log('lpTokenTVLinUSD', Number(lpTokenTVLinUSD));
    
    const totalSupply: BigNumber = await lpToken.totalSupply();
    const stakedAmount: BigNumber = await stakingContract.totalSupply();

    const percentageStaked = stakedAmount.mul(1000000).div(totalSupply);
    const stakedUSD = percentageStaked.mul(lpTokenTVLinUSD).div(1000000);
    return stakedUSD.toNumber();
};

//const main = async (guageAddress) => {
//     const collateralPrices = await getCollateralPrices()

//     const daiMahaGuageTVL = await getTVL(
//         polygonMatic.daiMahaGuage,
//         polygonMatic.daiMahaLP,
//         [polygonMatic.dai, polygonMatic.maha],
//         ["DAI", "MAHA"],
//         collateralPrices,
//         polygonTestnetProvider
//     );
    
//     //console.log(daiMahaGuageTVL);
    
//     let apr = await getAPR(
//         daiMahaGuageTVL,
//         collateralPrices,
//         guageAddress,
//         polygonTestnetProvider
//     )

//     console.log("apr",apr); 
// }

// main('0x0AEfb132a53feD4e555F01e52db40C8490c0da1d')

const fetchAPRs = async () => {
    const collateralPrices = await getCollateralPrices();

    const daiMahaGuageTVL = await getTVL(
        polygonMatic.daiMahaGuage,
        polygonMatic.daiMahaLP,
        [polygonMatic.dai, polygonMatic.maha],
        ["DAI", "MAHA"],
        collateralPrices,
        polygonTestnetProvider
    );

    const daiSolidGuageTVL = await getTVL(
        polygonMatic.daiSolidGuage,
        polygonMatic.daiSolidLP,
        [polygonMatic.dai, polygonMatic.solid],
        ["DAI", "SOLID"],
        collateralPrices,
        polygonTestnetProvider
    );

    const mahaSolidGuageTVL = await getTVL(
        polygonMatic.mahaSolidGuage,
        polygonMatic.mahaSolidLP,
        [polygonMatic.maha, polygonMatic.solid],
        ["MAHA", "SOLID"],
        collateralPrices,
        polygonTestnetProvider
    );

    const daiMahaApr = await getAPR(
        daiMahaGuageTVL,
        collateralPrices,
        '0x0AEfb132a53feD4e555F01e52db40C8490c0da1d',
        polygonTestnetProvider
    )

    const daiSolidApr = await getAPR(
        daiSolidGuageTVL,
        collateralPrices,
        '0x7D4f9CAA114d55Bc2e77ba7B940d60D3e1e64fa2',
        polygonTestnetProvider
    )
    
    const mahaSolidApr = await getAPR(
        daiSolidGuageTVL,
        collateralPrices,
        '0x281eCb4D21508e1B029d0FC005E7fd9eED2Af86a',
        polygonTestnetProvider
    )

    return {   
        "0x0AEfb132a53feD4e555F01e52db40C8490c0da1d": { min: String( daiMahaApr * 1/5), max: String(daiMahaApr)},
        "0x7D4f9CAA114d55Bc2e77ba7B940d60D3e1e64fa2": { min: String( daiSolidApr * 1/5), max: String(daiSolidApr)},
        "0x281eCb4D21508e1B029d0FC005E7fd9eED2Af86a": { min: String( mahaSolidApr * 1/5), max: String(mahaSolidApr)}
    }
};

const fetchAndCache = async () => {
  const data = await fetchAPRs();
  cache.set("guage-apr", JSON.stringify(data));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("guage-apr")) {
    //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
    res.send(cache.get("guage-apr"));
  } else {
    await fetchAndCache();
    //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
    res.send(cache.get("guage-apr"));
  }
}

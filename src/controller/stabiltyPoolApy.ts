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
  SOLID: 18,
  MATIC: 18
};

const wallet = new ethers.Wallet(
  process.env.WALLET_KEY,
  polygonTestnetProvider
)

export const getTokenAddress = async (chainid) => {
  let tokenAddress 
  switch (chainid) {
      case (137):
          tokenAddress = "0x862Fc9F243365d98Ed9FF68f720041074299B0dC";
      break;
      case (56):
          tokenAddress = "0x85daB10c3BA20148cA60C2eb955e1F8ffE9eAa79";
      break;
      case (1):
          tokenAddress = "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71";
      break;
      default:
          tokenAddress = "NEW";
  }

  return tokenAddress
}

export const getMahaAddress = async (chainid) => {
  let tokenAddress 
  switch (chainid) {
      case (137):
          tokenAddress = "0xeDd6cA8A4202d4a36611e2fff109648c4863ae19";
      break;
      case (56):
          tokenAddress = "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b";
      break;
      case (1):
          tokenAddress = "0xB4d930279552397bbA2ee473229f89Ec245bc365";
      break;
      default:
          tokenAddress = "NEW";
  }

  return tokenAddress
}


const getAPR = async (
  contractTVLinUSD: number,
  collateralPrices: ICollateralPrices,
  monthlyRewardinMAHA
) => { 
    const rewardinUSD = 12 * monthlyRewardinMAHA * collateralPrices.MAHA;  
    return (rewardinUSD / contractTVLinUSD) * 100;
};

const getRewardBalance = async (
  stabilityPool,
    chainid,
    provider
) => {
  const tokenAddress = await getMahaAddress(chainid)
  //console.log("Maha", tokenAddress, chainid, stabilityPool);
  
  const maha = new ethers.Contract(
      tokenAddress,
      IERC20,
      provider
  );

  const balance = await maha.balanceOf(stabilityPool)
  //console.log("balance", Number(balance / 1e18));
  
  return Number(balance / 1e18)
}

const getTVL = async (
    stabilityPool,
    chainid,
    provider
) => {
    const tokenAddress = await getTokenAddress(chainid)
    const arth = new ethers.Contract(
        tokenAddress,
        IERC20,
        provider
    );

    const balance = await arth.balanceOf(stabilityPool)
    return Number(balance / 1e18)
}

// const main = async () => {
//     const collateralPrices = await getCollateralPrices();
    
//     const polygonStabilytvl = await getTVL("0xE60B391d3690aC3627065CEA96DaAD0f2C89E835", 137, polygonProvider)
//     const tvlInUsd = polygonStabilytvl * collateralPrices.MAHA
//     const polygonApr = await getAPR(tvlInUsd, collateralPrices, 1000)
//     console.log(polygonApr);
    
// }

// main()

const fetchAPRs = async () => {
    const collateralPrices = await getCollateralPrices();

    const polygonStabilytvl = await getTVL("0x9209757eC192caA894Ad8eBC393DeB95b2ed5d0a", 137, polygonProvider)
    const polygonStabilyRewardtvl = await getRewardBalance("0x9209757eC192caA894Ad8eBC393DeB95b2ed5d0a", 137, polygonProvider)
    // console.log('polygonStabilyRewardtvl', polygonStabilyRewardtvl); 
    const tvlInUsdPolygon = polygonStabilytvl * collateralPrices.ARTH || 2
    const polygonApr = await getAPR(tvlInUsdPolygon, collateralPrices,   0)

    const bnbStabilytvl = await getTVL("0x61A787B3E2eE1e410310fC7c4A9f6C77430e1B57", 56, bscProvider)
    const bnbnStabilyRewardtvl = await getRewardBalance("0x61A787B3E2eE1e410310fC7c4A9f6C77430e1B57", 56, bscProvider)
    // console.log('bnbnStabilyRewardtvl', bnbnStabilyRewardtvl);
    const tvlInUsdBnb = bnbStabilytvl * collateralPrices.ARTH || 2
    const bnbApr = await getAPR(tvlInUsdBnb, collateralPrices, bnbnStabilyRewardtvl || 500)

    const ethStabilytvl = await getTVL("0x2c360b513AE52947EEb37cfAD57ac9B7c9373e1B", 1, ethProvider)
    const ethStabilyRewardtvl = await getRewardBalance("0x2c360b513AE52947EEb37cfAD57ac9B7c9373e1B", 1, ethProvider)
    // console.log('ethStabilyRewardtvl', ethStabilyRewardtvl);
    const tvlInUsdEth = ethStabilytvl * collateralPrices.ARTH || 2
    const ethApr = await getAPR(tvlInUsdEth, collateralPrices, ethStabilyRewardtvl || 1000)

    return {   
        matic: String(polygonApr),
        eth: String(ethApr),
        bnb: String(bnbApr)
    }
};

const fetchAndCache = async () => {
  const data = await fetchAPRs();
  // console.log(data);
  
  cache.set("stability-apr", JSON.stringify(data));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("stability-apr")) {
    //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
    res.send(cache.get("stability-apr"));
  } else {
    await fetchAndCache();
    //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
    res.send(cache.get("stability-apr"));
  }
}

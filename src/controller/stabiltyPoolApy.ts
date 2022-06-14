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
    dai: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    "arth.usd": "0x84f168e646d31F6c33fDbF284D9037f59603Aa28",
    "polygon.3pool": "0x19793b454d3afc7b454f206ffe95ade26ca6912c",
    arth: "0xE52509181FEb30EB4979E29EC70D50FD5C44D590",
    maha: "0xedd6ca8a4202d4a36611e2fff109648c4863ae19",
    wmatic: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    daiStabilityPool: "0x6832B8f9d4b59129f7C83A9d6a76EfDD70DbD836",
    wmaticStabilityPool: "0xE60B391d3690aC3627065CEA96DaAD0f2C89E835",
    "USDCUSDT-QLP-SStabilityPool": "0x590C0bfcEB5c6F6EdB7A5Ba0CceB448a9c822BB2",
    wethStabilityPool: "0x41378573500C2892595dCea79f00F4Ab87092427"
};

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
            tokenAddress = "0xE52509181FEb30EB4979E29EC70D50FD5C44D590";
        break;
        case (56):
            tokenAddress = "0xB69A424Df8C737a122D0e60695382B3Eec07fF4B";
        break;
        case (1):
            tokenAddress = "ARTH";
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

const getTVL = async (
    stabilityPool,
    chainid,
    provider
) => {
    const tokenAddress = await getTokenAddress(chainid)
    const arthPolygon = new ethers.Contract(
        tokenAddress,
        IERC20,
        provider
    );

    const balance = await arthPolygon.balanceOf(stabilityPool)
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

    const polygonStabilytvl = await getTVL("0xE60B391d3690aC3627065CEA96DaAD0f2C89E835", 137, polygonProvider)
    const tvlInUsd = polygonStabilytvl * collateralPrices.MAHA
    const polygonApr = await getAPR(tvlInUsd, collateralPrices, 1000)

    return {   
        matic: String(polygonApr),
        eth: String(polygonApr),
        bnb: String(polygonApr)
    }
};

const fetchAndCache = async () => {
  const data = await fetchAPRs();
  console.log(data);
  
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

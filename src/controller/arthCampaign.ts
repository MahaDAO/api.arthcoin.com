import { polygonProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "./coingecko";

const TroveManager = require("../abi/ArthLoanTroveManager.json")
const Campaign = require("../abi/ArthCampaign.json")

const troveContract = new ethers.Contract(
    "0xF4eD5d0C3C977B57382fabBEa441A63FAaF843d3",
    TroveManager,
    ethProvider
);

const campaignContract = new ethers.Contract(
    "0xA9735E594624339f8fbc8a99c57C13C7B4E8BCaC",
    Campaign,
    ethProvider
);

const CampaignStrategyAddress = "0xA9735E594624339f8fbc8a99c57C13C7B4E8BCaC"
const MAHAPerMonth = 1000

const getCampaignTVL = async (collateralPrices) => {
    //const getCollateral = await troveContract.getEntireDebtAndColl(CampaignStrategyAddress)
    const getCollateral = await campaignContract.totalSupply()
    
    // let collateral = Number(getCollateral[1])
    let ethPrice = collateralPrices['WETH']

    //console.log('Collateral', (collateral / 1e18) * ethPrice);   
    return (getCollateral * ethPrice)
}

const campaignAPR = async (collateralPrices) => {
    let tvlInUSD = await getCampaignTVL(collateralPrices)
    let rewardsInUSD = (( MAHAPerMonth * 12 ) * collateralPrices['MAHA'])

    return (rewardsInUSD / tvlInUSD) * 100
}

const main = async () => {
    const collateralPrices = await getCollateralPrices()

    let APR = await campaignAPR(collateralPrices)
    //console.log(APR);

    return {
        'arth-eth-loans': APR
    }
}

const fetchAndCache = async () => {
    const data = await main();
    cache.set("arth-eth-loans", JSON.stringify(data));
};
  
// 5 min cache
cron.schedule("0 */5 * * * *", fetchAndCache);
fetchAndCache();
  
export default async (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
  
    if (cache.get("arth-eth-loans")) {
      res.send(cache.get("arth-eth-loans"));
    } else {
      await fetchAndCache();
      res.send(cache.get("arth-eth-loans"));
    }
};

import { polygonProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

const request = require('request-promise')
const CurveAPY = require("../abi/curvePool.json")

const curveContract = new ethers.Contract(
    "0x6ec38b3228251a0C5D491Faf66858e2E23d7728B",
    CurveAPY,
    ethProvider
); 

const options = (method, url) => {
    return {
        method: method,
        uri: url,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':'*'
        },
        json: true
    }
}

const getAPY = async () => {
    const apyData = await request(options('GET', 'https://api.curve.fi/api/getFactoryAPYs?version=crypto'))
    const dailyApy = apyData.data.poolDetails[21].apy
    const volume = apyData.data.poolDetails[21].volume
    
    const fee = Number(await curveContract.fee() / 10**8)
    const apy = dailyApy * 365

    const volumeApy = await request(options('GET', 'https://api.curve.fi/api/getFactoryCryptoPools'))
    const volumeData = volumeApy.data.poolData[21]
    const tvl = volumeData.usdTotal
    
    const tradingApr = (volume * fee)/ tvl

    console.log(apy, volume, Number(fee), tvl);

    return {
        tradingApr: tradingApr,
        apy: apy
    }
}

const fetchAndCache = async () => {
    const data = await getAPY();
    cache.set("mahalend-apy", JSON.stringify(data));
};
  
cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);

    // 1 min cache
    if (cache.get("mahalend-apy")) {
        //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
        res.send(cache.get("mahalend-apy"));
    } else {
        await fetchAndCache();
        //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
        res.send(cache.get("mahalend-apy"));
    }
}
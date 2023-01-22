
import NodeCache from "node-cache";
import cron from "node-cron";
import { polygonProvider, ethRinkebyProvider, ethGoerliProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../src/web3";
import { ethers, BigNumber } from "ethers";

const request = require('request-promise')
const CurveAPY = require("./curvePool.json")

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



getAPY()
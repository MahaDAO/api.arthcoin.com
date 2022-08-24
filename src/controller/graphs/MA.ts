const dotenv = require('dotenv')
dotenv.config()

import CoinGecko from "coingecko-api";
import NodeCache from "node-cache";
import cron from "node-cron";

const CoinGeckoClient = new CoinGecko();
const cache = new NodeCache();
const request = require('request-promise')

let prices = [
    [ 1, 20.30 ], 
    [ 2, 21.40 ],
    [ 3, 19.70 ],
    [ 4, 20.43 ],
    [ 5, 21.54 ],
    [ 6, 23.43 ], 
    [ 7, 30.00 ],
    [ 8, 31.43 ]
]

let p = [20.30, 21.40, 19.70, 20.43, 21.54, 23.43]

const getEthPrice = async (days) => {
    try {        
        let priceChart = await CoinGeckoClient.coins.fetchMarketChart('ethereum', {
            vs_currency: "usd",
            days: days,
            interval: 'daily'
        });

        //console.log(priceChart.data.prices);
        return priceChart.data.prices
    } catch (e) {
        console.log(e);
    }
}

//getEthPrice(30)

function simpleMovingAverage(prices, window) {
    if (!prices || prices.length < window) {
      return [];
    }
  
    let index = window - 1;
    const length = prices.length + 1;
  
    const simpleMovingAverages = [];
    //console.log('before loop', index, length);
    
    while (++index < length) {
        //console.log('after loop', index, length);
        
        const windowSlice = prices.slice(index - window, index);
        //console.log('windowSlice', windowSlice, index - window, index);
        
        let sum = 0
        windowSlice.forEach((a) => {
            sum += a[1]
        });

        //console.log('sum', sum);
        simpleMovingAverages.push(
            [ windowSlice[windowSlice.length -1][0], sum / window ]
        );
    }
    
    return simpleMovingAverages;
}

// simpleMovingAverage(prices, 5)
const fetchAndCache = async () => {
    const ethPrice = await getEthPrice(60)
    const sevenDayMA = await simpleMovingAverage(ethPrice, 7);
    console.log('sevenDayMA.length', sevenDayMA.length);
    
    const ethPrice30 = await getEthPrice(85)
    const thirtyDayMA = await simpleMovingAverage(ethPrice30, 30)
    console.log('thirtyDayMA.length', thirtyDayMA.length);
    
    cache.set("protocol_eth_7_MA", JSON.stringify({
        sevenDayMA: sevenDayMA,
        thirtyDayMA: thirtyDayMA
    }));
};
  
cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);

    // 1 min cache
    if (cache.get("protocol_eth_7_MA")) {
        //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
        res.send(cache.get("protocol_eth_7_MA"));
    } else {
        await fetchAndCache();
        //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
        res.send(cache.get("protocol_eth_7_MA"));
    }
};
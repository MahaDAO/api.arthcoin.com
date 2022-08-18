const dotenv = require('dotenv')
dotenv.config()

import CoinGecko from "coingecko-api";
import NodeCache from "node-cache";
import cron from "node-cron";

const CoinGeckoClient = new CoinGecko();
const cache = new NodeCache();
const request = require('request-promise')

const apiKey = process.env.ETHERSCAN_KEY
const topic = '0x4d29de21de555af78a62fc82dd4bc05e9ae5b0660a37f04729527e0f22780cd3'

const ethPrice = async (from, to) => {
    let priceChart = await CoinGeckoClient.coins.fetchMarketChartRange('ethereum', {
        vs_currency: "usd",
        from: from,
        to: to
    });

    return priceChart.data.prices
}

const main = async (address) => {
    const url = `https://api.etherscan.io/api?module=logs&action=getLogs&address=${address}&page=1&offset=1000&apikey=${apiKey}&topic0=${topic}`

    const data = await request.get(url)
    const formatedData = JSON.parse(data)
    
    //console.log(formatedData.result, formatedData.result.length); 
    const dataArray = []
    const datapoints = await formatedData.result.forEach(val => {
        dataArray.push([
            Number(val.timeStamp) * 1000,
            ( Number(val.data) / 1e18 )
        ])
    })

    //console.log(dataArray[0][0], dataArray[dataArray.length - 1][0], dataArray.length);
    
    //console.log(dataArray.reverse());
    let price = await ethPrice((dataArray[0][0] / 1000), ( dataArray[dataArray.length - 1][0] / 1000))
    // const ethPriceArray = []
    // const ethDatapoints = await price.forEach((val, i) => {        
    //     ethPriceArray.push(
    //         time: Number((val[0])),
    //         price: Number(val[1])
    //     )
    // })
    
    return {
        protocolPrice: dataArray.reverse(),
        ethPrice: price.reverse()
    }
}

const fetchAndCache = async () => {
    const data = await main('0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00');
    cache.set("protocol_eth_graph", JSON.stringify(data));
};
  
cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);

    // 1 min cache
    if (cache.get("protocol_eth_graph")) {
        //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
        res.send(cache.get("protocol_eth_graph"));
    } else {
        await fetchAndCache();
        //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
        res.send(cache.get("protocol_eth_graph"));
    }
};
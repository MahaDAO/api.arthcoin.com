const dotenv = require('dotenv')
dotenv.config()

import NodeCache from "node-cache";
import cron from "node-cron";
import * as Bluebird from "bluebird";
import { protocolETHGraph } from "./protocolEthGraphs"

const cache = new NodeCache();
const request = require('request-promise')

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

const main = async () => {
    const truflationData = await request(options('GET', 'https://truflation-api.hydrogenx.live/dashboard-data'))
    const CPIDataPoints = truflationData.b
     

    let cpiDataArray = []
    await Bluebird.mapSeries(CPIDataPoints, (data) => {
        let date = new Date(data[0]).getTime()
        cpiDataArray.push([date, data[1]])
    })
    
    let protocolPrice = await protocolETHGraph('0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00')

    console.log({
        CPI : cpiDataArray,
        protocolPrice: protocolPrice.protocolPrice
    });
    
    return {
        CPI : cpiDataArray,
        protocolPrice: protocolPrice.protocolPrice
    }
}

main()
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

        console.log('sum', sum);
        simpleMovingAverages.push(
            [ windowSlice[windowSlice.length -1][0], sum / window ]
        );
    }
    
    return simpleMovingAverages;
}

simpleMovingAverage(prices, 5)

// (21.54 + 20.43 + 19.70 + 21.40 + 20.30 ) / 5
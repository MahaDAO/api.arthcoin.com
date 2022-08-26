const dotenv = require('dotenv')
dotenv.config({ path: '../../../.env' })

import { ethers } from "ethers";
import nconf from "nconf";

export const me = nconf.get("WALLET_ADDR") || process.env.WALLET_KEY;
import { polygonProvider, bscProvider, polygonTestnetProvider } from "../../web3";

// const lookUpTokenPrices = async function(id_array) {
//     let ids = id_array.join('%2C')
//     const url = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=' + ids + '&vs_currencies=usd'
//     const res = await fetch(url);
//     const text = await res.text();
//     return JSON.parse(text);
// }

function getParameterCaseInsensitive(object, key) {
    return object[Object.keys(object)
        .find(k => k.toLowerCase() === key.toLowerCase())
    ];
}

export function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
    try {
      decimalCount = Math.abs(decimalCount);
      decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
  
      const negativeSign = amount < 0 ? "-" : "";
  
      let i:any = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
      let j = (i.length > 3) ? i.length % 3 : 0;
  
      return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
      console.log(e)
    }
}

export const displayPrice = price => {
    const priceDecimals = price == 0 ? 2 : price < 0.0001 ? 10 : price < 0.01 ? 6 : 2;
    return priceDecimals == 2 ? formatMoney(price) : price.toFixed(priceDecimals);
}

export const init_ethers = async () => {
    const App:any = {}

    App.provider = new ethers.providers.JsonRpcProvider(
        nconf.get("RPC_URL_BSC") || process.env.RPC_URL_BSC
    );

    const wallet = new ethers.Wallet(
        process.env.WALLET_KEY,
        bscProvider
    );

    App.YOUR_ADDRESS = wallet.address

    // console.log(App);
    
    return App
}

const lookUpTokenPrices = async function(id_array) {
    let ids = id_array.join('%2C')
    const url = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=' + ids + '&vs_currencies=usd'
    const res = await fetch(url);
    const text = await res.text();
    return JSON.parse(text);
}

module.exports = {  getParameterCaseInsensitive };
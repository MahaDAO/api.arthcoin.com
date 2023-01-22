const dotenv = require('dotenv')
dotenv.config()

import { ethers, BigNumber } from "ethers";
import { polygonProvider, ethRinkebyProvider, ethGoerliProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../../src/web3";
import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../../src/controller/coingecko";

const GMUOracle = require("./abi/GMUOracle.json")
const UniswapV3Pool = require("./abi/uniswapV3Pool.json")

const gmuContract = new ethers.Contract(
    '0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00',
    GMUOracle, 
    ethProvider
)

const arthWethPoolContract = new ethers.Contract(
    '0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B',
    UniswapV3Pool, 
    ethProvider
)

export const getProtocolPrice = async () => {
    return Number((await gmuContract.fetchLastGoodPrice() / 1e18).toFixed(5))
}

export const getSqrtPriceX96 = async () => {
    let slot0 = await arthWethPoolContract.slot0()
    return Number(slot0.sqrtPriceX96)
}

// a - protocol price, b - trading price
/* 
    direction:- 
    1 - Spread at Arth protocol, protocol price greater then pool's traded arth price
    2 - Spread ar arth/weth pool, arth's trading price of pool is greater then protocol price
*/
export const spreadtOpportunity = async (a, b) => {
    if ( a > b ) {
        return 1
    } else if ( b > a) {
        return 2
    } 
}

// direction - spreadtOpportunity(), a - protocol price, b - trading price
export const calculateSpread = async (direction, a, b) => {
    let diff = 0
    let spreadPercentage = 0

    if (direction == 1) {
        diff = a - b
        spreadPercentage =  Number((( diff / a ) * 100).toFixed(5))
    } 

    if (direction == 2) {
        diff = b - a
        spreadPercentage =  Number((( diff / b ) * 100).toFixed(5))
    }

    //console.log('difference', diff);
    return {
        difference: diff,
        spread: spreadPercentage
    }
}


const main = async () => {
    const collateralPrices = await getCollateralPrices();

    let protocolPrice = await getProtocolPrice()
    let sqrtPriceX96 = await getSqrtPriceX96()
    
    let token1price = (2 ** 192 / sqrtPriceX96 ** 2) 
    let token0price = (sqrtPriceX96 ** 2 / 2 ** 192)
    let wethPrice = collateralPrices["WETH"]
    let arthTradingPrice = Number(((token0price) * wethPrice).toFixed(5))

    let spreadDirection = await spreadtOpportunity(protocolPrice, arthTradingPrice)
    let difference = await calculateSpread(spreadDirection, protocolPrice, arthTradingPrice)

    console.log(
        'token1price', token1price, 
        'token0price', token0price, 
        'Trading Price', arthTradingPrice, 
        'Protocol Price', protocolPrice,
        'spreadDirection', spreadDirection,
        'difference', difference.difference,
        'spread', difference.spread
    );
}

main()
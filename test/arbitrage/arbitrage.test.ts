const dotenv = require('dotenv')
dotenv.config()

import { ethers, BigNumber } from "ethers";
import chai from 'chai';
import { solidity } from 'ethereum-waffle';

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../../src/controller/coingecko";

chai.use(solidity);

const GMUOracle = require("../GMUOracle.json")
const UniswapV3Pool = require("../uniswapV3Pool.json")

const gmuContract = new ethers.Contract(
    '0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00',
    GMUOracle
)

const arthWethPoolContract = new ethers.Contract(
    '0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B',
    UniswapV3Pool
)

export const getProtocolPrice = async () => {
    return Number((await gmuContract.fetchLastGoodPrice() / 1e18).toFixed(5))
}

export const getSqrtPriceX96 = async () => {
    let slot0 = await arthWethPoolContract.slot0()
    return Number(slot0.sqrtPriceX96)
}

describe('Testing Fork', () => {

})
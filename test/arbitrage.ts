const dotenv = require('dotenv')
dotenv.config()

import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../src/controller/coingecko";

import { spreadtOpportunity, calculateSpread } from "./protocolPrice"
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

//Uniswap v3 imports
import { Pool } from '@uniswap/v3-sdk'
import { CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { Route } from '@uniswap/v3-sdk'
import { Trade } from '@uniswap/v3-sdk'
import { abi as QuoterABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'

const GMUOracle = require("./GMUOracle.json")
const UniswapV3Pool = require("./uniswapV3Pool.json")

const SwapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; 
const poolAddress = '0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B'
const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'

interface Immutables {
    factory: string
    token0: string
    token1: string
    fee: number
    tickSpacing: number
    maxLiquidityPerTick: BigNumber
}
  
interface State {
    liquidity: BigNumber
    sqrtPriceX96: BigNumber
    tick: number
    observationIndex: number
    observationCardinality: number
    observationCardinalityNext: number
    feeProtocol: number
    unlocked: boolean
}
  
async function getPoolImmutables(poolContract) {
    const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
      poolContract.factory(),
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.maxLiquidityPerTick(),
    ])
  
    const immutables: Immutables = {
      factory,
      token0,
      token1,
      fee,
      tickSpacing,
      maxLiquidityPerTick,
    }
    return immutables
}
  
async function getPoolState(poolContract) {
    // note that data here can be desynced if the call executes over the span of two or more blocks.
    const [liquidity, slot] = await Promise.all([poolContract.liquidity(), poolContract.slot0()])
  
    const PoolState: State = {
      liquidity,
      sqrtPriceX96: slot[0],
      tick: slot[1],
      observationIndex: slot[2],
      observationCardinality: slot[3],
      observationCardinalityNext: slot[4],
      feeProtocol: slot[5],
      unlocked: slot[6],
    }
  
    return PoolState
}
  
const main = async () => {
    const collateralPrices = await getCollateralPrices();

    const gmuContract =  await ethers.getContractAt(
        GMUOracle,
        '0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00'
    )
    
    const arthWethPoolContract = await ethers.getContractAt(
        UniswapV3Pool,
        '0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B'
    )

    const quoterContract = await ethers.getContractAt(
        QuoterABI,
        '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
    )

    const [immutables, state] = await Promise.all([getPoolImmutables(arthWethPoolContract), getPoolState(arthWethPoolContract)])

    const address = "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4";
    await helpers.impersonateAccount(address);
    const impersonatedSigner = await ethers.getSigner(address);

    const value = ethers.utils.hexlify(ethers.utils.zeroPad(address, 32))

    await network.provider.send("hardhat_setBalance", [
        "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4",
        "0x100000000000000000",
    ]);

    await network.provider.send("hardhat_setStorageAt", [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4",
        value
    ]);

    console.log('run');
    let balance = ethers.utils.formatEther((await impersonatedSigner.getBalance()))
    console.log('balance', balance);
    
    let protocolPrice = Number((await gmuContract.fetchLastGoodPrice() / 1e18).toFixed(5))
    let slot0 = await arthWethPoolContract.slot0()
    let arthSlotPrice = Number(slot0.sqrtPriceX96)
    let token0price = (arthSlotPrice ** 2 / 2 ** 192)
    let wethPrice = collateralPrices["WETH"]
    let arthTradingPrice = Number(((token0price) * wethPrice).toFixed(5))
    
    console.log('protocolPrice', protocolPrice)
    console.log('arthTradingPrice', arthTradingPrice);

    const TokenA = new Token(1, immutables.token0, 18, 'ARTH', 'ARTH Valuecoin')
    const TokenB = new Token(1, immutables.token1, 18, 'WETH', 'Wrapped Ether')

    const poolExample = new Pool(
        TokenA,
        TokenB,
        immutables.fee,
        state.sqrtPriceX96.toString(), //note the description discrepancy - sqrtPriceX96 and sqrtRatioX96 are interchangable values
        state.liquidity.toString(),
        state.tick
    )

    const amountIn = 1500

}

main()
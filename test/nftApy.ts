
import  Moralis  from 'moralis';
import { EvmChain } from '@moralisweb3/evm-utils';
import { polygonProvider, ethRinkebyProvider, ethGoerliProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../src/web3";
import { ethers, BigNumber } from "ethers";

import * as Bluebird from "bluebird";
import _, { map } from 'underscore';

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../src/controller/coingecko";

const NFT = require("./nftABI.json");
const FACTORY = require("./factory.json");
const NFTMANAGER = require("./uniswapNftManager.json");
const IERC20 = require("../src/abi/IERC20.json");

const address = '0xaFc6936593016cb6a5FE276399004aB72e921f86';
const uniswapNftManager = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
const chain = EvmChain.GOERLI;

const tokenDecimals: ICollateralPrices = {
    ARTH: 18,
    WBTC: 18,
    "ARTH.usd": 18,
    "polygon.3pool": 18,
    BUSD: 18,
    DAI: 18,
    WETH: 18,
    "bsc.3eps": 18,
    USDT: 6,
    MAHA: 18,
    SCLP: 18,
    USDC: 6,
    BANNANA: 18,
    BSCUSDC: 18,
    BSCUSDT: 18,
    FRAX :18,
    SOLID: 18,
    MATIC: 18
};

export const getTokenName = async (address) => {    
    let tokenName 
    switch (address) {
        case ('0xBEaB728FcC37DE548620F17e9A521374F4A35c02'):
            tokenName = "ARTH";
        break;
        case ('0xc003235c028A18E55bacE946E91fAe95769348BB'):
            tokenName = "USDC";
        break;
        default:
            tokenName = "new";
    }

    return tokenName
}

//export const getRewardRemaing = async (collateralPrices, address) => {
export const getRewardRemaing = async (collateralPrices) => {
    const maha = new ethers.Contract(
        '0x106E0c36aD45cEAce8a778fa7365a2ce0500C3a2',
        IERC20,
        ethGoerliProvider
    );
    
    //const balance = await maha.balanceOf(address)
    const balance = await maha.balanceOf('0x736a089Ad405f1C35394Ad15004f5359938f771e')

    const mahaUSD = (Number(balance / 1e18) * collateralPrices['MAHA'])    
    return Number(mahaUSD)
}

const getUniswapLPTokenTVLinUSD = async (
    lpAddress: string,
    tokenAddresses: string[],
    tokenNames: string[],
    collateralPrices: ICollateralPrices,
    provider: ethers.providers.Provider
) => {    
    const token1 = new ethers.Contract(tokenAddresses[0], IERC20, provider);
    const token2 = new ethers.Contract(tokenAddresses[1], IERC20, provider);
  
    const token1Balance: BigNumber = await token1.balanceOf(lpAddress);
    const token2Balance: BigNumber = await token2.balanceOf(lpAddress);

    const token1Decimals = BigNumber.from(10).pow(tokenDecimals[tokenNames[0]]);
    const token2Decimals = BigNumber.from(10).pow(tokenDecimals[tokenNames[1]]);
  
    const token1Amount = token1Balance.div(token1Decimals);
    const token2Amount = token2Balance.div(token2Decimals);
  
    const token1USDValue = token1Amount
      .mul(Math.floor(1000 * collateralPrices[tokenNames[0]]))
      .div(1000);
    const token2USDValue = token2Amount
      .mul(Math.floor(1000 * collateralPrices[tokenNames[1]]))
      .div(1000);

    return Number(token1USDValue.add(token2USDValue));
};

const getAPR = async (
    contractTVLinUSD: number,
    monthlyRewardinMAHA
) => { 
    const rewardinUSD = 12 * monthlyRewardinMAHA;  
    return (rewardinUSD / contractTVLinUSD) * 100;
};

const main = async (guageAddress) => {
    await Moralis.start({
        apiKey: 'sWWpwWUpyEqnZtM8PawuTsxSIUYgVmmR4KoKSWKuDgRiIbCE7kjLLe0nGhgQVsIl',
        // ...and any other configuration
    });

    const rewardContract = new ethers.Contract(
        '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
        NFT, 
        ethGoerliProvider
    );

    const nftManagerContract = new ethers.Contract(
        '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
        NFTMANAGER, 
        ethGoerliProvider
    );

    const factory = new ethers.Contract(
        '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        FACTORY, 
        ethGoerliProvider
    );
    
    // const response = await nftManagerContract.balanceOf({
    //     address
    // });
    
    const response = await Moralis.EvmApi.account.getNFTsForContract({
        address: guageAddress,
        tokenAddress: uniswapNftManager,
        chain,
    });

    const nftArray = response.result
    //console.log(nftArray);
    
    let tokenId = []
    let positions = []

    await Bluebird.mapSeries(nftArray, async (data) => {
        tokenId.push(data._data.tokenId)
    })

    //console.log(tokenId);

    await Bluebird.mapSeries(tokenId, async (data) => {
        const postionData = await rewardContract.positions(data)
        positions.push(postionData)
    })

    let lpTokenAddress = []
    await Bluebird.mapSeries(positions, async (data, i) => {
        const lpAddress = await factory.getPool(data.token0, data.token1, data.fee)
        lpTokenAddress.push({
            lpAddress: lpAddress,
            token0: data.token0,
            token1: data.token1,
            token0Name: await getTokenName(data.token0),
            token1Name: await getTokenName(data.token1)
        });
    })    

    let allLPAddress = [...new Map(lpTokenAddress.map(item =>
        [item['lpAddress'], item])).values()];    
    
    let lPUsdWorth
    const collateralPrices = await getCollateralPrices();
    await Bluebird.mapSeries(allLPAddress, async (data, i) => {
        lPUsdWorth = await getUniswapLPTokenTVLinUSD(
            data.lpAddress,
            [data.token0, data.token1],
            [data.token0Name, data.token1Name],
            collateralPrices,
            ethGoerliProvider
        )
    }) 

    console.log(lPUsdWorth);
    
    let rewards = await getRewardRemaing(collateralPrices)
    console.log(rewards);
    
    let APY = await getAPR(rewards, lPUsdWorth)
    console.log(APY);
}

main(address)

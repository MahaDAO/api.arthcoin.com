
import  Moralis  from 'moralis';
import { EvmChain } from '@moralisweb3/evm-utils';
import { polygonProvider, ethRinkebyProvider, ethGoerliProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

import * as Bluebird from "bluebird";
import _, { map } from 'underscore';

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "./coingecko";

const NFT = require("../abi/nftABI.json");
const FACTORY = require("../abi/factory.json");
const NFTMANAGER = require("../abi/uniswapNftManager.json");
const IERC20 = require("../abi/IERC20.json");

const uniswapNftManager = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
const chain = EvmChain.ETHEREUM;

const cache = new NodeCache();

const guageAddresses = {
    ARTHUSDCGauge: "0x174327F7B7A624a87bd47b5d7e1899e3562646DF", // calculate rewards remaining here
    ARTHMAHAGauge: "0x48165A4b84e00347C4f9a13b6D0aD8f7aE290bB8", // calculate rewards remaining here
    ARTHUSDCPool: "0x031a1d307C91fbDE01005Ec2Ebc5Fcb03b6f80aB",
    ARTHMAHAPool: "0xC5Ee69662e7EF79e503be9D54C237d5aafaC305d"
}

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
        case ('0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71'):
            tokenName = "ARTH";
        break;
        case ('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'):
            tokenName = "USDC";
        break;
        case ('0xB4d930279552397bbA2ee473229f89Ec245bc365'):
            tokenName = "MAHA";
        break;
        default:
            tokenName = "new";
    }

    return tokenName
}

//export const getRewardRemaing = async (collateralPrices, address) => {
export const getRewardRemaing = async (collateralPrices) => {
    const maha = new ethers.Contract(
        '0xb4d930279552397bba2ee473229f89ec245bc365',
        IERC20,
        ethProvider
    );
    
    //const balance = await maha.balanceOf(address)
    // const balance = await maha.balanceOf('0x736a089Ad405f1C35394Ad15004f5359938f771e')

    // const mahaUSD = (Number(balance / 1e18) * collateralPrices['MAHA'])    
    return 1000 //Number(mahaUSD)
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

    console.log(
        "token1Amount", Number(token1Amount), 
        "token2Amount", Number(token2Amount)
    );
  
    const token1USDValue = token1Amount
      .mul(Math.floor(1000 * collateralPrices[tokenNames[0]]))
      .div(1000);
    const token2USDValue = token2Amount
      .mul(Math.floor(1000 * collateralPrices[tokenNames[1]]))
      .div(1000);
    
    console.log(
        "token1USDValue", Number(token1USDValue), 
        "token2USDValue", Number(token2USDValue), 
        collateralPrices[tokenNames[0]], collateralPrices[tokenNames[1]]
    );

    return Number(token1USDValue.add(token2USDValue));
};

const getAPR = async (
    contractTVLinUSD: number,
    monthlyRewardinMAHA
) => { 
    const rewardinUSD = 12 * monthlyRewardinMAHA;  
    return (rewardinUSD / contractTVLinUSD) * 100;
};

const nftV3 = async (guageAddress) => {
    await Moralis.start({
        apiKey: 'sWWpwWUpyEqnZtM8PawuTsxSIUYgVmmR4KoKSWKuDgRiIbCE7kjLLe0nGhgQVsIl',
        // ...and any other configuration
    });

    const rewardContract = new ethers.Contract(
        '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
        NFT, 
        ethProvider
    );

    const factory = new ethers.Contract(
        '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        FACTORY, 
        ethProvider
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
    console.log('nftArray', nftArray);
    
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

    //console.log(positions);
    let lpTokenAddress = []
    await Bluebird.mapSeries(positions, async (data) => {
        const lpAddress = await factory.getPool(data.token0, data.token1, data.fee)
        lpTokenAddress.push({
            lpAddress: lpAddress,
            token0: data.token0,
            token1: data.token1,
            token0Name: await getTokenName(data.token0),
            token1Name: await getTokenName(data.token1)
        });
    })    

    //console.log('lpTokenAddress', lpTokenAddress);
    
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
            ethProvider
        )
    }) 

    //console.log(lPUsdWorth);
    
    let rewards = await getRewardRemaing(collateralPrices)
    //console.log(rewards);
    
    let APY = await getAPR(rewards, lPUsdWorth)
    //console.log(APY);
    return APY
}

const fetchAndCache = async () => {
    const arthUsdcApy = await nftV3(guageAddresses.ARTHUSDCGauge);
    const arthMahaApy = await nftV3(guageAddresses.ARTHMAHAGauge);

    console.log('nft v3 apy', {
        '0x174327F7B7A624a87bd47b5d7e1899e3562646DF': arthUsdcApy,
        '0x48165A4b84e00347C4f9a13b6D0aD8f7aE290bB8': arthMahaApy
    });
    
    cache.set("guageV3-apr", JSON.stringify({
        '0x174327F7B7A624a87bd47b5d7e1899e3562646DF': arthUsdcApy,
        '0x48165A4b84e00347C4f9a13b6D0aD8f7aE290bB8': arthMahaApy
    }));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();
  
export default async (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
  
    // 1 min cache
    if (cache.get("guageV3-apr")) {
      //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
      res.send(cache.get("guageV3-apr"));
    } else {
      await fetchAndCache();
      //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
      res.send(cache.get("guageV3-apr"));
    }
}

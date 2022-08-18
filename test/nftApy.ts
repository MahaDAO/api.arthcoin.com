
import  Moralis  from 'moralis';
import { EvmChain } from '@moralisweb3/evm-utils';
import { polygonProvider, ethRinkebyProvider, ethGoerliProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../src/web3";
import { ethers, BigNumber } from "ethers";
import { FACTORY_ADDRESS, INIT_CODE_HASH } from '@uniswap/sdk'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'

const { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType } = require ('@uniswap/sdk')

import * as Bluebird from "bluebird";

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../src/controller/coingecko";

const NFT = require("./nftABI.json");

const address = '0xaFc6936593016cb6a5FE276399004aB72e921f86';
const chain = EvmChain.GOERLI;
const chainId = ChainId.GOERLI

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

const main = async () => {
    await Moralis.start({
        apiKey: 'sWWpwWUpyEqnZtM8PawuTsxSIUYgVmmR4KoKSWKuDgRiIbCE7kjLLe0nGhgQVsIl',
        // ...and any other configuration
    });
    
    const response = await Moralis.EvmApi.account.getNFTs({
        address,
        chain,
    });
    
    const nftArray = response.result
    let tokenId = []
    let positions = []

    await Bluebird.mapSeries(nftArray, async (data) => {
        tokenId.push(data._data.tokenId)
    })

    //console.log(tokenId);

    const rewardContract = new ethers.Contract(
        '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
        NFT, 
        ethGoerliProvider
    );
    
    await Bluebird.mapSeries(tokenId, async (data) => {
        //console.log(data);
        const postionData = await rewardContract.positions(30016)
        //console.log(postionData);
        positions.push(postionData)
    })

    console.log(positions);

    const token0 = '0xBEaB728FcC37DE548620F17e9A521374F4A35c02' // change me!
    const token1 = '0xc003235c028A18E55bacE946E91fAe95769348BB' // change me!

    const pair = getCreate2Address(
        FACTORY_ADDRESS,
        keccak256(['bytes'], [pack(['address', 'address'], [token0, token1])]),
        INIT_CODE_HASH
    )

    console.log('lpaddress', pair);
    
}

main()

import { polygonProvider, ethRinkebyProvider, ethGoerliProvider, bscProvider, polygonTestnetProvider, ethProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "./coingecko";
  
const cache = new NodeCache();

const IERC20 = require("../abi/IERC20.json");
const GuageV2 = require("../abi/GuageV2.json");

const goerli = {
    bribesAddress: "0xd34f4f0244D4b90E51E412F265aAA6FEac2A5199",
    gaugeAddress: "0xaFc6936593016cb6a5FE276399004aB72e921f86",
    poolAddress: "0xe2e7e671ccb343e8fe1db0ec2968b0be4fcaeff9"
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
    FRAX: 18,
    SOLID: 18,
    MATIC: 18
};

export const getMahaAddress = async (chainid) => {
    let tokenAddress 
    switch (chainid) {
        case (137):
            tokenAddress = "0xeDd6cA8A4202d4a36611e2fff109648c4863ae19";
        break;
        case (56):
            tokenAddress = "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b";
        break;
        case (1):
            tokenAddress = "0xB4d930279552397bbA2ee473229f89Ec245bc365";
        break;
        default:
            tokenAddress = "NEW";
    }
  
    return tokenAddress
}

const getTVL = async (
    guage,
    provider
) => {
    const guageAddress = new ethers.Contract(
        guage,
        GuageV2,
        provider
    );

    const balance = await guageAddress.totalLiquiditySupply()
    return Number(balance / 1e18)
}

const getRewardBalance = async (
    guage,
    chainid,
    provider
) => {
    const tokenAddress = await getMahaAddress(chainid)
    console.log("Maha", tokenAddress, chainid, guage);
    
    const maha = new ethers.Contract(
        tokenAddress,
        IERC20,
        provider
    );
  
    const balance = await maha.balanceOf(guage)
    console.log("balance", Number(balance / 1e18));
    
    return Number(balance / 1e18)
}

const getAPR = async (
    contractTVLinUSD: number,
    collateralPrices: ICollateralPrices,
    monthlyRewardinMAHA
) => { 
    const rewardinUSD = 12 * monthlyRewardinMAHA * collateralPrices.MAHA;  
    return (rewardinUSD / contractTVLinUSD) * 100;
};
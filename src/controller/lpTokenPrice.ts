import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "./coingecko";

const cache = new NodeCache();

const CurveLp = require("../abi/CurveLP.json");
const IERC20 = require("../abi/IERC20.json");
const BscArthUsd3eps = require("../abi/BscArthUsd3eps.json")

const polygon = {
    MaticMain_BSArthUsd3Pool: "0xdde5fdb48b2ec6bc26bb4487f8e3a4eb99b3d633",
    MaticMain_BSArthUsdc: "0x34aafa58894aff03e137b63275aff64ca3552a3e",
    MaticMain_BSArthMaha: "0x95de8efd01dc92ab2372596b3682da76a79f24c3",
    MaticMain_Arth: "0xE52509181FEb30EB4979E29EC70D50FD5C44D590",
    MaticMain_Usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    MaticMain_Maha:"0xeDd6cA8A4202d4a36611e2fff109648c4863ae19"
};
  
const bsc = {
    BscMain_BSArthUsd3eps: "0xb38b49bae104bbb6a82640094fd61b341a858f78",
    BscMain_BSArthBusdc: "0x80342bc6125a102a33909d124a6c26cc5d7b8d56",
    BscMain_BSArthMaha: "0xb955d5b120ff5b803cdb5a225c11583cd56b7040",
    BscMain_Busd: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    BscMain_Arth: "0xB69A424Df8C737a122D0e60695382B3Eec07fF4B",
    BscMain_Maha: "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b"
};

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
};
  
const getEllipsisLPTokenTVLinUSD = async (
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
    
    const supply = (Number(token1Amount), Number(token2Amount), Number(token1Amount.add(token2Amount)))
    
    // total usd in the LP token
    return {
        tvlUsd: token1USDValue.add(token2USDValue),
        supply: supply
    }
}

const lpPrice = async () => {
    const collateralPrices = await getCollateralPrices();

    const maticArthUsd3Pool = new ethers.Contract(
        polygon.MaticMain_BSArthUsd3Pool,
        CurveLp,
        polygonProvider
    );

    let arthUsd3PoolLpPrice = ((await maticArthUsd3Pool.get_virtual_price()) / 10**18)    

    const maticArthUsdcTvl = await getEllipsisLPTokenTVLinUSD(
        polygon.MaticMain_BSArthUsdc, 
        [polygon.MaticMain_Usdc, polygon.MaticMain_Arth],
        ['USDC', 'ARTH'],
        collateralPrices,
        polygonProvider
    )
    const maticArthUsdcLpPrice = (Number(maticArthUsdcTvl.tvlUsd) / Number(maticArthUsdcTvl.supply))
    
    const maticArthMahaTvl = await getEllipsisLPTokenTVLinUSD(
        polygon.MaticMain_BSArthMaha, 
        [polygon.MaticMain_Maha, polygon.MaticMain_Arth],
        ['MAHA', 'ARTH'],
        collateralPrices,
        polygonProvider
    )
    const maticArthMahaLpPrice = (Number(maticArthMahaTvl.tvlUsd) / Number(maticArthMahaTvl.supply))
    
    const bscArthBusdTvl = await getEllipsisLPTokenTVLinUSD(
        bsc.BscMain_BSArthBusdc, 
        [bsc.BscMain_Busd, bsc.BscMain_Arth],
        ['BUSD', 'ARTH'],
        collateralPrices,
        bscProvider
    )
    const bscArthBusdLpPrice = (Number(bscArthBusdTvl.tvlUsd) / Number(bscArthBusdTvl.supply))
    
    const bscArthMahaTvl = await getEllipsisLPTokenTVLinUSD(
        bsc.BscMain_BSArthMaha, 
        [bsc.BscMain_Maha, bsc.BscMain_Arth],
        ['MAHA', 'ARTH'],
        collateralPrices,
        bscProvider
    )
    const bscArthMahaLpPrice = (Number(bscArthMahaTvl.tvlUsd) / Number(bscArthMahaTvl.supply))

    const bscArthUsd3eps = new ethers.Contract(
        bsc.BscMain_BSArthUsd3eps, 
        BscArthUsd3eps, 
        bscProvider
    )

    const bscArth3epsTVl = ( Number(await bscArthUsd3eps.totalSupply()) / 10**18 )
    const bscArth3epsTVLUsd = bscArth3epsTVl * collateralPrices['bsc.3eps']
    const bscArth3epsLpPrice = bscArth3epsTVLUsd / (Number(await bscArthUsd3eps.totalSupply()) / 10**18 )

    return {
        arthUsd3PoolLpPrice: arthUsd3PoolLpPrice,
        maticArthUsdcLpPrice: maticArthUsdcLpPrice,
        maticArthMahaLpPrice: maticArthMahaLpPrice,
        bscArthBusdLpPrice: bscArthBusdLpPrice,
        bscArthMahaLpPrice: bscArthMahaLpPrice,
        bscArth3epsLpPrice: bscArth3epsLpPrice
    }
}

const fetchAndCache = async () => {
    const lpPrices = await lpPrice();
    
    let dummyLpPrice = {
        arthMahaPolygon: lpPrices.maticArthMahaLpPrice,
        arthUsdc3Polygon: lpPrices.arthUsd3PoolLpPrice,
        arthUsdcPolygon: lpPrices.maticArthUsdcLpPrice,
        arthUsdc3Bsc: lpPrices.bscArth3epsLpPrice,
        arthBusdBsc: lpPrices.bscArthBusdLpPrice,
        arthMahaBsc: lpPrices.bscArthMahaLpPrice
    }

    cache.set("lp-price", JSON.stringify(dummyLpPrice));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);

    //console.log('true', _req.query.collateral);
    
    // 1 min cache
    if (cache.get("lp-price")) {
        res.send(cache.get("lp-price"));
    } else {
        await fetchAndCache();
        res.send(cache.get("lp-price"));
    }
};
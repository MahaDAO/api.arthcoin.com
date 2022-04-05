import { ethers, BigNumber } from "ethers";

const IERC20 = require("../../abi/IERC20.json");

const tokenDecimals = {
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
    BSCUSDT: 18
  }

export const rewardPerMonth = async (APESWAP_CHEF_ABI, provider) => {
    const APESWAP_CHEF_ADDR = "0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9";
    const APESWAP_SOUL_CHEF_ADDR = "0xf5Cb9F954D3Ea26Bb503A6996a4b2B0aAdC8c969";
    const rewardTokenTicker = "BANANA";
    const rewardSoulTokenTicker = "SOUL";
    const APESWAP_CHEF = new ethers.Contract(APESWAP_CHEF_ADDR, APESWAP_CHEF_ABI, provider);

    const rewardsPerWeek = await APESWAP_CHEF.cakePerBlock() /1e18
        * 604800 / 3;

    return rewardsPerWeek * 4
}

export const getApeAPR = async (
    contractTVLinUSD: number,
    monthlyRewardinMAHA: number,
    collateralPrices
  ) => {
    const rewardinUSD = 12 * monthlyRewardinMAHA * collateralPrices.BANNANA;
    // console.log(rewardinUSD, collateralPrices.BANNANA, monthlyRewardinMAHA);
    
    return (rewardinUSD / contractTVLinUSD);
}

export const getApeSwapLPTokenTVLinUSD = async (
    lpAddress: string,
    tokenAddresses: string[],
    tokenNames: string[],
    collateralPrices,
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
      
    // total usd in the LP token
    return token1USDValue.add(token2USDValue);
};
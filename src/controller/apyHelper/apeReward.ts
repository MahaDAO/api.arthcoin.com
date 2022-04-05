import { ethers, BigNumber } from "ethers";

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
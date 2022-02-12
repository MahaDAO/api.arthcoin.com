import { polygonProvider } from "../web3";
import { getCollateralPrices, ICollatearlPrices } from "./coingecko";
import { ethers } from "ethers";

// ABIs
const BasicStakingABI = require("../abi/BasicStaking.json");
const IERC20ABI = require("../abi/IERC20.json");

const tokenAddresses = {
  arth: "0xe52509181feb30eb4979e29ec70d50fd5c44d590",
  maha: "0xedd6ca8a4202d4a36611e2fff109648c4863ae19",
  usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  sclp: "0x2fc711518aae7c87d7002566c5d43b0e5d2b1932",
  poolToken: "0x48202b3f81e345c8F72aae88cC386dD1fbBeab97",
};

const stakingAddresses = {
  stakeMahax: "0x89DA855d94dD60396E585B19072A30397A9355A1",
};

const tokenDecimals = {
  USDC: 6,
  ARTH: 18,
  MAHA: 18,
  SCLP: 18,
};

const maha = new ethers.Contract(
  tokenAddresses.maha,
  IERC20ABI,
  polygonProvider
);
const usdc = new ethers.Contract(
  tokenAddresses.usdc,
  IERC20ABI,
  polygonProvider
);
//const sclp = new ethers.Contract(tokenAddresses.sclp, IERC20ABI, provider);
const arth = new ethers.Contract(
  tokenAddresses.arth,
  IERC20ABI,
  polygonProvider
);

const _getAPYforTokensStakingContract = async (
  collateralPrices: ICollatearlPrices,
  token: any,
  contract: string,
  quarters: number
) => {
  const stakingContract = new ethers.Contract(
    contract,
    BasicStakingABI,
    polygonProvider
  );
  const mahaPrice = collateralPrices.MAHA;
  console.log("mahaPrice", mahaPrice);

  let collateral;
  let rewardsTokenRemaining;

  if (token === usdc) {
    collateral = "USDC";
    rewardsTokenRemaining =
      (await usdc.balanceOf(tokenAddresses.poolToken)) / 10 ** 18;
  } else if (token === maha) {
    collateral = "MAHA";
    rewardsTokenRemaining =
      (await maha.balanceOf(tokenAddresses.poolToken)) / 10 ** 18;
    // } else if (token === sclp){
    //     collateral = 'SCLP'
    //     rewardsTokenRemaining = (await sclp.balanceOf(tokenAddresses.poolToken)) / 10 ** 18
  } else if (token === arth) {
    collateral = "ARTH";
    rewardsTokenRemaining =
      (await arth.balanceOf(tokenAddresses.poolToken)) / 10 ** 18;
  }

  const priceOfToken = collateralPrices[collateral];
  const priceOfOnePoolToken = 0;
  //  await _getUSDValueOfOnePoolToken(
  //   collateralPrices
  // );
  // const rewardTokensRemaining = (await token.balanceOf(contract)) / 10 ** 18
  let totalLockedTokenValue =
    Number(await stakingContract.totalSupply()) / 10 ** 18;

  // if (totalLockedTokenValue === 0) {
  //   totalLockedTokenValue = 10000
  // }

  const rewardUSD = priceOfOnePoolToken * rewardsTokenRemaining;
  const totalUSDValueLocked = priceOfToken * totalLockedTokenValue;

  return (rewardUSD / totalUSDValueLocked) * 100 * quarters;
};

export const rewardAPY = async (collateralPrices: ICollatearlPrices) => {
  // let arthApy = await _getAPYforTokensStakingContract(
  //   collateralPrices,
  //   arth,
  //   stakingAddresses.stakeMahax,
  //   4
  // );
  // let usdcApy = await _getAPYforTokensStakingContract(
  //   collateralPrices,
  //   usdc,
  //   stakingAddresses.stakeMahax,
  //   4
  // );
  let mahaApy = await _getAPYforTokensStakingContract(
    collateralPrices,
    maha,
    stakingAddresses.stakeMahax,
    4
  );
  //let sclpApy = await _getAPYforTokensStakingContract(collateralPrices, sclp, stakingAddresses.stakeMahax, 4)

  return {
    arthApy: 0,
    usdcApy: 0,
    mahaApy: mahaApy,
    sclpApy: 0,
  };
};

let cache: any = {};
const job = async () => {
  const collateralPrices = await getCollateralPrices();
  console.log(collateralPrices);

  try {
    cache = {
      // mahaxApy: await mahaxBasicQ3(collateralPrices),
      rewardsApy: await rewardAPY(collateralPrices),
    };

    console.log(cache);

    console.log("done");
  } catch (error) {
    console.log(error, error.message);
  }
};

export default async (_req, res) => res.json(cache);

import {
  polygonProvider,
  ethRinkebyProvider,
  bscProvider,
  polygonTestnetProvider,
  ethProvider,
} from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

import {
  getCollateralPrices,
  CollateralKeys,
  ICollateralPrices,
} from "../utils/coingecko";

const cache = new NodeCache();

const IERC20 = require("../abi/IERC20.json");
const GuageV2 = require("../abi/GuageV2.json");

const rinkeby = {
  mahaSolidLP: "0xe3aAd64Bdc20770C12A0D09cBf26bE9c30587408",
  mahaSolidGuage: "0x2b5D4504555C310C0E85f4972BE71c20D0997824",
  maha: "0xaaa6a7a5d7ec7c7691576d557e1d2cdabeca6c4a",
  solid: "0xd09cb6c1aab18239b7c0880bfcfaabca461cbac3",
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
  BANNANA: 18,
  BSCUSDC: 18,
  BSCUSDT: 18,
  FRAX: 18,
  SOLID: 18,
  MATIC: 18,
};

const getRewardinTVL = async (
  guageAddress: string,
  tokenAddresses: string,
  tokenNames: string,
  collateralPrices: ICollateralPrices,
  provider: ethers.providers.Provider
) => {
  const rewardContract = new ethers.Contract(tokenAddresses, IERC20, provider);
  const rewardTokenBalance: BigNumber = await rewardContract.balanceOf(
    guageAddress
  );
  const rewardDecimals = BigNumber.from(10).pow(tokenDecimals[tokenNames]);

  const rewardAmount = rewardTokenBalance.div(rewardDecimals);
  const rewardInUSDValue = rewardAmount
    .mul(Math.floor(1000 * collateralPrices[tokenNames]))
    .div(1000);

  return rewardInUSDValue.toNumber();
};

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

  //   console.log(
  //     "token1Amount", Number(token1Amount),
  //     "token2Amount", Number(token2Amount)
  //   );

  const token1USDValue = token1Amount
    .mul(Math.floor(1000 * collateralPrices[tokenNames[0]]))
    .div(1000);
  const token2USDValue = token2Amount
    .mul(Math.floor(1000 * collateralPrices[tokenNames[1]]))
    .div(1000);

  //   console.log(
  //     "token1USDValue", Number(token1USDValue),
  //     "token2USDValue", Number(token2USDValue),
  //     collateralPrices[tokenNames[0]], collateralPrices[tokenNames[1]]
  //   );

  // total usd in the LP token
  return Number(token1USDValue.add(token2USDValue));
};

const getAPR = async (rewardinUSD: number, contractTVLinUSD: number) => {
  return (rewardinUSD / contractTVLinUSD) * 100;
};

const fetchAPRs = async () => {
  const collateralPrices = await getCollateralPrices();

  const mahaSolidLPTVL = await getUniswapLPTokenTVLinUSD(
    rinkeby.mahaSolidLP,
    [rinkeby.maha, rinkeby.solid],
    ["MAHA", "SOLID"],
    collateralPrices,
    ethRinkebyProvider
  );
  // console.log(Number(mahaSolidLPTVL));

  const rewardRemainig = await getRewardinTVL(
    rinkeby.mahaSolidLP,
    rinkeby.maha,
    "MAHA",
    collateralPrices,
    ethRinkebyProvider
  );
  // console.log(rewardRemainig);

  const mahaSolidAPR = await getAPR(rewardRemainig, mahaSolidLPTVL);
  // console.log(mahaSolidAPR);
};

fetchAPRs();

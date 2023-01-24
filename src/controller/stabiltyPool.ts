import { ethProvider } from "../web3";
import { ethers } from "ethers";
import { getCollateralPrices } from "../utils/coingecko";
import { ETH_ARTH, IAPRPoolResponse } from "./config";

// ABIs
const IERC20 = require("../abi/IERC20.json");

const getTVL = async (stabilityPool, provider) => {
  const arth = new ethers.Contract(ETH_ARTH, IERC20, provider);
  const balance = await arth.balanceOf(stabilityPool);
  return Number(balance / 1e18);
};

export const getData = async (): Promise<IAPRPoolResponse> => {
  const prices = await getCollateralPrices();

  const tvl = await getTVL(
    "0x910f16455e5eb4605fe639e2846579c228eed3b5",
    ethProvider
  );

  const tvlInUSD = tvl * prices.ARTH || 2.09;
  const rewardPerYearMAHA = 1000 * 12;

  const rewardinUSD = rewardPerYearMAHA * prices.MAHA;
  const apr = (rewardinUSD / tvlInUSD) * 100;

  return {
    "eth-sp": {
      tvlUSD: tvl,
      current: {
        min: apr,
        max: apr,
        boostEffectiveness: 1,
      },
      upcoming: {
        min: apr,
        max: apr,
        boostEffectiveness: 1,
      },
    },
  };
};

export default async (_req, res) => {
  const data = await getData();
  res.json(data);
};

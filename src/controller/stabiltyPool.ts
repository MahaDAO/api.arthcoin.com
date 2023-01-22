import { ethProvider } from "../web3";
import { ethers } from "ethers";
import { getCollateralPrices } from "../utils/coingecko";
import { ETH_ARTH } from "./config";

// ABIs
const IERC20 = require("../abi/IERC20.json");

const getTVL = async (stabilityPool, provider) => {
  const arth = new ethers.Contract(ETH_ARTH, IERC20, provider);
  const balance = await arth.balanceOf(stabilityPool);
  return Number(balance / 1e18);
};

const fetchAPRs = async () => {
  const prices = await getCollateralPrices();

  const arthInSP = await getTVL(
    "0x910f16455e5eb4605fe639e2846579c228eed3b5",
    ethProvider
  );

  const tvlInUsdEth = arthInSP * prices.ARTH || 2.09;
  const rewardPerYearMAHA = 1000 * 12;

  const rewardinUSD = rewardPerYearMAHA * prices.MAHA;
  const apr = (rewardinUSD / tvlInUsdEth) * 100;

  return {
    eth: { apr: String(apr), tvl: arthInSP },
  };
};

export default async (_req, res) => {
  const data = await fetchAPRs();
  res.json(data);
};
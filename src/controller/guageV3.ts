import { ethers, BigNumber } from "ethers";

import { ethProvider } from "../web3";
import { getCollateralPrices, CollateralKeys } from "../utils/coingecko";

const GAUGE_ABI = require("../abi/GuageV3.json");
const HELPER_ABI = require("../abi/UniswapV3UIHelper.json");

const e18 = BigNumber.from(10).pow(18);
const uniswapUIHelper = "0x772500810ab7975073c14E2054f8f891A2190572";
const gauges = {
  ARTHETHGauge: "0x2e1db01f87ab645321cb12048bbab8a9538c61cc", // calculate rewards remaining here
  ARTHMAHAGauge: "0x98e1701f6558dd63481b57926c9f22c64d918c35", // calculate rewards remaining here
};

interface IAmountsStaked {
  a0Total: BigNumber;
  a1Total: BigNumber;
  liquidityTotal: BigNumber;
  derivedLiquidityTotal: BigNumber;
  positions: {
    a0: BigNumber;
    a1: BigNumber;
    liquidity: BigNumber;
    derivedLiquidity: BigNumber;
  }[];
}

const getCurrentRewards = async (
  gauge: string,
  token0: CollateralKeys,
  token1: CollateralKeys
) => {
  const collateralPrices = await getCollateralPrices();
  const contract = await new ethers.Contract(gauge, GAUGE_ABI, ethProvider);
  const helper = await new ethers.Contract(
    uniswapUIHelper,
    HELPER_ABI,
    ethProvider
  );

  // first get TVL of the gauge
  const amountsStaked: IAmountsStaked = await helper.amountsStaked(gauge);

  // conver prices to e18
  const c0BN = e18.mul(Math.floor(collateralPrices[token0] * 1000)).div(1000);
  const c1BN = e18.mul(Math.floor(collateralPrices[token1] * 1000)).div(1000);
  const mahaBN = e18.mul(Math.floor(collateralPrices.MAHA * 1000)).div(1000);

  // calculate how much USD value is in the pool right now.
  const token0USDValue = amountsStaked.a0Total.mul(c0BN).div(e18);
  const token1USDValue = amountsStaked.a1Total.mul(c1BN).div(e18);
  const totalUSDValue = token0USDValue.add(token1USDValue);

  // get current reward rate from the staking contract
  // reward rate of maha per second
  const mahaRewardRate = await contract.rewardRate();
  const mahaAnnualReward = mahaRewardRate.mul(86400 * 365).div(e18);
  const annualUSDReward = mahaAnnualReward.mul(mahaBN).div(e18);

  const apr =
    annualUSDReward.mul(e18).mul(100000).div(totalUSDValue).toNumber() / 1000;

  return {
    min: apr,
    max: apr * 5,
  };
};

const getUpcomingRewards = async (gauge: string) => {
  // first get TVL of the gauge
  // get future reward rate from the voter contract
  return {
    min: undefined,
    max: undefined,
  };
};

const fetchAPRs = async () => {
  return {
    "arth-maha-1000-uniswap-v3-gauge": {
      current: await getCurrentRewards(gauges.ARTHMAHAGauge, "MAHA", "ARTH"),
      upcoming: await getUpcomingRewards(gauges.ARTHMAHAGauge),
    },
    "arth-eth-1000-uniswap-v3-gauge": {
      current: await getCurrentRewards(gauges.ARTHETHGauge, "ARTH", "WETH"),
      upcoming: await getUpcomingRewards(gauges.ARTHETHGauge),
    },
  };
};

export default async (_req, res) => {
  const result = await fetchAPRs();
  res.json(result);
};

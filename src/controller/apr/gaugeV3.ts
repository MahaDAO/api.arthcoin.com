import { ethers, BigNumber } from "ethers";

import { ethProvider } from "../../web3";
import { getCollateralPrices, CollateralKeys } from "../../utils/coingecko";
import { IAPRPoolResponse, IAPRResponse } from "../config";

const GAUGE_ABI = require("../abi/GuageV3.json");
const HELPER_ABI = require("../abi/UniswapV3UIHelper.json");

const e18 = BigNumber.from(10).pow(18);
const uniswapUIHelper = "0x772500810ab7975073c14E2054f8f891A2190572";

const gauges = {
  ARTHETH: "0x2e1db01f87ab645321cb12048bbab8a9538c61cc", // calculate rewards remaining here
  ARTHMAHA: "0x98e1701f6558dd63481b57926c9f22c64d918c35", // calculate rewards remaining here
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

const getMinMax = async (
  annualUSDTVL: BigNumber,
  mahaRewardRate: BigNumber,
  boostEffectiveness: number
) => {
  const collateralPrices = await getCollateralPrices();
  const mahaBN = e18.mul(Math.floor(collateralPrices.MAHA * 1000)).div(1000);

  const mahaAnnualReward = mahaRewardRate.mul(86400 * 365).div(e18);
  const annualUSDReward = mahaAnnualReward.mul(mahaBN).div(e18);

  const apr =
    annualUSDReward.mul(e18).mul(100000).div(annualUSDTVL).toNumber() / 1000;

  return {
    min: apr,
    max: apr * boostEffectiveness,
    boostEffectiveness,
  };
};

const getRewards = async (
  gauge: string,
  token0: CollateralKeys,
  token1: CollateralKeys
): Promise<IAPRResponse> => {
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

  // calculate how much USD value is in the pool right now.
  const token0USDValue = amountsStaked.a0Total.mul(c0BN).div(e18);
  const token1USDValue = amountsStaked.a1Total.mul(c1BN).div(e18);
  const totalUSDValue = token0USDValue.add(token1USDValue);

  // get current reward rate from the staking contract
  // reward rate of maha per second
  const mahaRewardRate = await contract.rewardRate();
  const futureRewardRate = BigNumber.from(0); // TODO; fetch from gauge voter

  // calculate how effective boosting will be.
  const boostEffectiveness =
    amountsStaked.liquidityTotal
      .mul(e18)
      .div(amountsStaked.derivedLiquidityTotal)
      .mul(1000)
      .div(e18)
      .toNumber() / 1000;

  return {
    tvlUSD: totalUSDValue.div(e18).toNumber(),
    current: await getMinMax(totalUSDValue, mahaRewardRate, boostEffectiveness),
    upcoming: await getMinMax(
      totalUSDValue,
      futureRewardRate,
      boostEffectiveness
    ),
  };
};

export const getData = async (): Promise<IAPRPoolResponse> => {
  return {
    "arth-maha-1000": await getRewards(gauges.ARTHMAHA, "MAHA", "ARTH"),
    "arth-eth-1000": await getRewards(gauges.ARTHETH, "ARTH", "WETH"),
  };
};

export default async (_req, res) => {
  res.json(await getData());
};

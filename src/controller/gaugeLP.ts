import { ethProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";

import { getCollateralPrices, CollateralKeys } from "../utils/coingecko";
import {
  ETH_ARTH,
  ETH_MAHA,
  ETH_USDC,
  IAPRPoolResponse,
  IAPRResponse,
} from "./config";

const cache = new NodeCache();

const IERC20 = require("../abi/IERC20.json");
const GAUGE_ABI = require("../abi/GaugeV2.json");

type IGauge = [
  string,
  string,
  string,
  "curve" | "uniswap-v2",
  [CollateralKeys, CollateralKeys]
];
type IGauges = {
  [key: string]: IGauge;
};

const e18 = BigNumber.from(10).pow(18);

const gauges: IGauges = {
  ARTHUSDCGaugeCurve: [
    "0x9ee8110c0aACb7f9147252d7A2D95a5ff52F8496", // gauge
    "0xB4018CB02E264C3FCfe0f21A1F5cfbCAAba9F61F", // pool
    "0xdf34bad1d3b16c8f28c9cf95f15001949243a038", // token
    "curve", // platform
    ["USDC", "ARTH"], // tokens
  ],
};

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

const getRewards = async (gauge: IGauge): Promise<IAPRResponse> => {
  const collateralPrices = await getCollateralPrices();
  const contract = await new ethers.Contract(gauge[0], GAUGE_ABI, ethProvider);

  const token0Addr = ETH_ARTH;
  const token1Addr = ETH_USDC;

  const token0 = await new ethers.Contract(token0Addr, IERC20, ethProvider);
  const token1 = await new ethers.Contract(token1Addr, IERC20, ethProvider);
  const lpToken = await new ethers.Contract(gauge[2], IERC20, ethProvider);

  // first get TVL of the gauge
  const lpTokensInGauge: BigNumber = await contract.totalSupply();
  const lpTokensInTotal: BigNumber = await lpToken.totalSupply();
  const token0inPool: BigNumber = await token0.balanceOf(gauge[1]);
  const token1inPool: BigNumber = await token1.balanceOf(gauge[1]);

  const token0inGauge = token0inPool.mul(lpTokensInGauge).div(lpTokensInTotal);
  const token1inGauge = token1inPool.mul(lpTokensInGauge).div(lpTokensInTotal);

  // conver prices to e18
  const c0BN = e18
    .mul(Math.floor(collateralPrices[gauge[4][0]] * 1000))
    .div(1000);
  const c1BN = e18
    .mul(Math.floor(collateralPrices[gauge[4][1]] * 1000))
    .div(1000);

  // calculate how much USD value is in the gauge right now.
  const token0USDValue = token0inGauge.mul(c0BN).div(e18);
  const token1USDValue = token1inGauge.mul(c1BN).div(1e6); // todo softcode to 6 decimals
  const totalUSDValue = token0USDValue.add(token1USDValue);

  // get current reward rate from the staking contract
  // reward rate of maha per second
  const mahaRewardRate = await contract.rewardRate(ETH_MAHA);
  const futureRewardRate = BigNumber.from(0); // TODO; fetch from gauge voter

  // calculate how effective boosting will be.
  const derivedLpTokensInTotal: BigNumber = await contract.derivedSupply();
  const boostEffectiveness =
    lpTokensInGauge
      .mul(e18)
      .div(derivedLpTokensInTotal)
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
    "arth-usdc-curve-crypto-185": await getRewards(gauges.ARTHUSDCGaugeCurve),
  };
};

export default async (_req, res) => {
  const result = await getData();
  res.json(result);
};

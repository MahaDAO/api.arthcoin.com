import { arbProvider, ethProvider } from "../../web3";
import { BigNumber, ethers } from "ethers";

import { getCollateralPrices } from "../../utils/coingecko";
import { getGMUPrice } from "../prices/gmu";
import IERC20 from "../../abi/IERC20.json";

export const getDataFor = async (
  mahaRewardMonthly: number,
  address: string,
  assetPrice: number,
  provider: ethers.providers.JsonRpcProvider,
  decimals: number = 18
) => {
  const collateralPrices = await getCollateralPrices();
  const e18 = BigNumber.from(10).pow(decimals);

  const rewardPerMonthUsd = mahaRewardMonthly * collateralPrices.MAHA;

  const mToken = await new ethers.Contract(address, IERC20 as any, provider);

  const tvlToken = await mToken.totalSupply();
  const tvlUsd = tvlToken.div(e18) * assetPrice;

  const totalAPR = ((12 * rewardPerMonthUsd) / tvlUsd) * 100;

  return {
    tvlUSD: tvlUsd,
    current: {
      min: totalAPR,
      max: totalAPR,
      boostEffectiveness: 1,
    },
    upcoming: {
      min: totalAPR,
      max: totalAPR,
      boostEffectiveness: 1,
    },
  };
};

export const getData = async () => {
  const collateralPrices = await getCollateralPrices();
  const arthPrice = await getGMUPrice();

  return {
    "mahalend-eth-arth": await getDataFor(
      1000,
      "0xe6b683868d1c168da88cfe5081e34d9d80e4d1a6", // mARTH
      arthPrice,
      ethProvider
    ),
    "mahalend-arb-usdc": await getDataFor(
      1000,
      "0x81a9fdd7bdfc4055b3f57e3e93f1c916c1a7d329", // mUSDC
      collateralPrices.USDC,
      arbProvider,
      6
    ),
    "mahalend-arb-eth": await getDataFor(
      500,
      "0x67c38e607e75002cea9abec642b954f27204dda5", // mETH
      collateralPrices.WETH,
      arbProvider
    ),
  };
};

export default async (_req, res) => {
  res.json(await getData());
};

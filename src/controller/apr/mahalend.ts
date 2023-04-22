import { ethProvider } from "../../web3";
import { BigNumber, ethers } from "ethers";

import { getCollateralPrices } from "../../utils/coingecko";
import { getGMUPrice } from "../prices/gmu";
import IERC20 from "../../abi/IERC20.json";

const e18 = BigNumber.from(10).pow(18);

export const getData = async () => {
  const collateralPrices = await getCollateralPrices();

  const rewardPerMonthUsd = 1000 * collateralPrices.MAHA;
  const price = await getGMUPrice();

  const mToken = await new ethers.Contract(
    "0xe6b683868d1c168da88cfe5081e34d9d80e4d1a6", // mARTH eth
    IERC20 as any,
    ethProvider
  );

  const tvlARTH = await mToken.totalSupply();
  const tvlUsd = tvlARTH.div(e18) * price;

  const totalAPR = (12 * rewardPerMonthUsd) / tvlUsd;

  return {
    "mahalend-eth-arth": {
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
    },
  };
};

export default async (_req, res) => {
  res.json(await getData());
};

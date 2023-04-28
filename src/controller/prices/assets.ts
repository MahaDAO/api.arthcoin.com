import { BigNumber } from "ethers";
import { getCollateralPrices } from "../../utils/coingecko";

export default async (_req, res) => {
  res.json({
    "collateral-prices": await getCollateralPrices(),
  });
};

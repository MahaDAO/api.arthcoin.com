import { ethers, BigNumber } from "ethers";

import { ethProvider } from "../../web3";
import GMUOracleABI from "../../abi/GMUOracle.json";

const e18 = BigNumber.from(10).pow(18);

const getGMUPrice = async (): Promise<number> => {
  const oracle = await new ethers.Contract(
    "0x066A917fA2e1739ccfc306dc73ff78EECa8B6F29",
    GMUOracleABI,
    ethProvider
  );

  const price: BigNumber = await oracle.fetchLastGoodPrice();

  return price.mul(10000).div(e18).toNumber() / 10000;
};

export default async (_req, res) => {
  res.json({
    "gmu-price": await getGMUPrice(),
  });
};

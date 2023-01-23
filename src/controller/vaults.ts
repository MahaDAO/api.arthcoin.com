import { ethProvider } from "../web3";
import { ethers } from "ethers";

import { getCollateralPrices } from "../utils/coingecko";
import { IAPRPoolResponse } from "./config";

const Campaign = require("../abi/ArthCampaign.json");

const campaignContract = new ethers.Contract(
  "0xA9735E594624339f8fbc8a99c57C13C7B4E8BCaC",
  Campaign,
  ethProvider
);

const MAHAPerMonth = 1000;

const getCampaignTVL = async (collateralPrices) => {
  const getCollateral = await campaignContract.totalSupply();
  const ethPrice = collateralPrices["WETH"];
  return (getCollateral * ethPrice) / 1e18;
};

const campaignAPR = async (collateralPrices) => {
  const tvlInUSD = await getCampaignTVL(collateralPrices);
  const rewardsInUSD = MAHAPerMonth * 12 * collateralPrices["MAHA"];
  return [(rewardsInUSD / tvlInUSD) * 100, tvlInUSD];
};

export const getData = async (): Promise<IAPRPoolResponse> => {
  const collateralPrices = await getCollateralPrices();

  const [apr, tvl] = await campaignAPR(collateralPrices);

  return {
    "arth-eth-strategy": {
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
    "arth-usdc-strategy": {
      tvlUSD: 0,
      current: {
        min: 0,
        max: 0,
        boostEffectiveness: 1,
      },
      upcoming: {
        min: 0,
        max: 0,
        boostEffectiveness: 1,
      },
    },
  };
};

export default async (_req, res) => {
  res.json(await getData());
};

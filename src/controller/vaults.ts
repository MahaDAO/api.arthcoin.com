import { ethProvider } from "../web3";
import { ethers } from "ethers";

import { getCollateralPrices } from "../utils/coingecko";

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
  return (rewardsInUSD / tvlInUSD) * 100;
};

const main = async () => {
  const collateralPrices = await getCollateralPrices();

  let APR = await campaignAPR(collateralPrices);

  return {
    "arth-eth-strategy": APR,
    "arth-usdc-strategy": 0,
  };
};

export default async (_req, res) => {
  res.json(await main());
};

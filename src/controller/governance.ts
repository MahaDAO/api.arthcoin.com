import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";

import { getCollateralPrices, ICollateralPrices } from "./coingecko";
import { polygonProvider } from "../web3";

const cache = new NodeCache();

// ABIs
const VotingEscrow = require("../abi/VotingEscrow.json");

const tokenAddresses = {
  arth: "0xe52509181feb30eb4979e29ec70d50fd5c44d590",
  maha: "0xedd6ca8a4202d4a36611e2fff109648c4863ae19",
  usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  sclp: "0x2fc711518aae7c87d7002566c5d43b0e5d2b1932",
  poolToken: "0x48202b3f81e345c8F72aae88cC386dD1fbBeab97",
  escrow: "0x8f2c37d2f8ae7bce07aa79c768cc03ab0e5ae9ae",
};

const bigE18 = BigNumber.from(10).pow(18);

const mahaRewardPerYear = 60000;
const sclpRewardPerYear = 1000000;
const forwardRewardPerYear = 5000000000;
const usdcRewardPerYear = 0; // todo remove this hardcoded values
const arthRewardPerYear = 0;

const getUSDRewardPerYear = async (collateralPrices: ICollateralPrices) => {
  const mahaPrice = collateralPrices.MAHA;
  const sclpPrice = collateralPrices.SCLP;
  const usdcPrice = collateralPrices.USDC;
  const arthPrice = collateralPrices.ARTH;
  const forwardPrice = 0; // collateralPrices.Forward

  return {
    mahaUSDPerYear: mahaRewardPerYear * mahaPrice,
    sclpUSDPerYear: sclpRewardPerYear * sclpPrice,
    forwardUSDPerYear: forwardRewardPerYear * forwardPrice,
    usdcUSDPerYear: usdcRewardPerYear * usdcPrice,
    arthUSDPerYear: arthRewardPerYear * arthPrice,
  };
};

const getMAHARewardPerYear = async (collateralPrices: ICollateralPrices) => {
  const tokenRewardPerYear = await getUSDRewardPerYear(collateralPrices);

  return {
    maha: Math.ceil(tokenRewardPerYear.mahaUSDPerYear / collateralPrices.MAHA),
    sclp: Math.ceil(tokenRewardPerYear.sclpUSDPerYear / collateralPrices.MAHA),
    forward: Math.ceil(tokenRewardPerYear.forwardUSDPerYear / 0), //collateralPrices.FORWARD
    usdc: Math.ceil(tokenRewardPerYear.usdcUSDPerYear / collateralPrices.MAHA),
    arth: Math.ceil(tokenRewardPerYear.arthUSDPerYear / collateralPrices.MAHA),
  };
};

const getAPR = async () => {
  const collateralPrices = await getCollateralPrices();
  const rewardWorthMahaPerYear = await getMAHARewardPerYear(collateralPrices);

  const mahax = new ethers.Contract(
    tokenAddresses.escrow,
    VotingEscrow,
    polygonProvider
  );

  const totalLockedMaha = (await mahax.totalSupplyWithoutDecay())
    .div(bigE18)
    .toNumber();

  const mahaAPY = (rewardWorthMahaPerYear.maha / totalLockedMaha) * 100;
  const sclpAPY = (rewardWorthMahaPerYear.sclp / totalLockedMaha) * 100;
  const forwardAPY = (rewardWorthMahaPerYear.forward / totalLockedMaha) * 100;
  const usdcAPY = (rewardWorthMahaPerYear.usdc / totalLockedMaha) * 100;
  const arthAPY = (rewardWorthMahaPerYear.arth / totalLockedMaha) * 100;

  return {
    mahaAPY,
    sclpAPY,
    forwardAPY,
    usdcAPY: usdcAPY,
    arthAPY: arthAPY,
    overallAPY: mahaAPY + sclpAPY + 0 + usdcAPY + arthAPY,
  };
};

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("governance-apr")) {
    res.send(cache.get("governance-apr"));
  } else {
    const data = await getAPR();
    cache.set("governance-apr", JSON.stringify(data), 60);
    res.send(JSON.stringify(data));
  }
};

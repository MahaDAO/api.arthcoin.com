import { ethers, BigNumber } from "ethers";
import { getCollateralPrices, ICollateralPrices } from "../utils/coingecko";
import { ethProvider } from "../web3";
import { IAPRPoolResponse } from "./config";

// ABIs
const VotingEscrow = require("../abi/VotingEscrow.json");

const e18 = BigNumber.from(10).pow(18);

const mahaRewardPerYear = 5000 * 12;
const sclpRewardPerYear = 9500 * 52; // 9500 sclp a week
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
    forward: 0, // Math.ceil(tokenRewardPerYear.forwardUSDPerYear / collateralPrices.FORWARD),
    usdc: Math.ceil(tokenRewardPerYear.usdcUSDPerYear / collateralPrices.MAHA),
    arth: Math.ceil(tokenRewardPerYear.arthUSDPerYear / collateralPrices.MAHA),
  };
};

const getAPR = async (): Promise<IAPRPoolResponse> => {
  const collateralPrices = await getCollateralPrices();
  const rewardWorthMahaPerYear = await getMAHARewardPerYear(collateralPrices);

  const mahax = new ethers.Contract(
    "0xbdd8f4daf71c2cb16cce7e54bb81ef3cfcf5aacb",
    VotingEscrow,
    ethProvider
  );

  const totalLockedMAHAX = (await mahax.totalSupply()).div(e18).toNumber();

  const mahaAPY = (rewardWorthMahaPerYear.maha / totalLockedMAHAX) * 100;
  const sclpAPY = (rewardWorthMahaPerYear.sclp / totalLockedMAHAX) * 100;
  const forwardAPY = (rewardWorthMahaPerYear.forward / totalLockedMAHAX) * 100;
  const usdcAPY = (rewardWorthMahaPerYear.usdc / totalLockedMAHAX) * 100;
  const arthAPY = (rewardWorthMahaPerYear.arth / totalLockedMAHAX) * 100;

  const totalAPR = mahaAPY + sclpAPY + 0 + usdcAPY + arthAPY;

  return {
    mahaAPY: {
      current: {
        min: mahaAPY,
        max: mahaAPY,
        boostEffectiveness: 1,
      },
      upcoming: {
        min: mahaAPY,
        max: mahaAPY,
        boostEffectiveness: 1,
      },
    },
    sclpAPY: {
      current: {
        min: sclpAPY,
        max: sclpAPY,
        boostEffectiveness: 1,
      },
      upcoming: {
        min: sclpAPY,
        max: sclpAPY,
        boostEffectiveness: 1,
      },
    },
    forwardAPY: {
      current: {
        min: forwardAPY,
        max: forwardAPY,
        boostEffectiveness: 1,
      },
      upcoming: {
        min: forwardAPY,
        max: forwardAPY,
        boostEffectiveness: 1,
      },
    },
    arthAPY: {
      current: {
        min: arthAPY,
        max: arthAPY,
        boostEffectiveness: 1,
      },
      upcoming: {
        min: arthAPY,
        max: arthAPY,
        boostEffectiveness: 1,
      },
    },
    overallAPY: {
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
  res.json(await getAPR());
};

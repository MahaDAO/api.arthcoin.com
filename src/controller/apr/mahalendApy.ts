import { ethProvider } from "../../web3";
import { ethers } from "ethers";
import request from "request-promise";
import CurveABI from "../../abi/CurveLP.json";

const curveContract = new ethers.Contract(
  "0x6ec38b3228251a0C5D491Faf66858e2E23d7728B",
  CurveABI as any,
  ethProvider
);

const options = (method, url) => {
  return {
    method: method,
    uri: url,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    json: true,
  };
};

const getAPY = async () => {
  const apyData = await request(
    options("GET", "https://api.curve.fi/api/getFactoryAPYs?version=crypto")
  );
  const dailyApy = apyData.data.poolDetails[21].apy;
  const volume = apyData.data.poolDetails[21].volume;

  const fee = Number((await curveContract.fee()) / 10 ** 8);
  const apy = dailyApy * 365;

  const volumeApy = await request(
    options("GET", "https://api.curve.fi/api/getFactoryCryptoPools")
  );
  const volumeData = volumeApy.data.poolData[21];
  const tvl = volumeData.usdTotal;

  const tradingApr = (volume * fee) / tvl;

  return {
    "0x6ec38b3228251a0C5D491Faf66858e2E23d7728B": {
      tradingApr: tradingApr,
      apy: apy,
    },
  };
};

export default async (_req, res) => {
  res.json(await getAPY());
};

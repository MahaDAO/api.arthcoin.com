import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

import { rewardPerMonth, getApeAPR, getApeSwapLPTokenTVLinUSD } from "./apyHelper/apeReward"
import {
  getCollateralPrices,
  CollateralKeys,
  ICollateralPrices,
} from "./coingecko";

const apeSwapChef = require("../abi/ApeSwapChef.json");
const cache = new NodeCache();

const bsc = {
  arthu3epsStakingV2: "0x6398c73761a802a7db8f6418ef0a299301bc1fb0",
  arthBusdStaking: "0xE8b16cab47505708a093085926560a3eB32584B8",
  arthMahaStaking: "0x7699d230Ba47796fc2E13fba1D2D52Ecb0318c33",
  arthu3epsStaking: "0x8fF204D06B39a19Bd8c8367302bfCB329214c14B",
  arthu3epsLP: "0xB38B49bAE104BbB6A82640094fd61b341a858f78",
  arthMahaLP: "0xb955d5b120ff5b803cdb5a225c11583cd56b7040",
  arthBusdLP: "0x80342bc6125a102a33909d124a6c26CC5D7b8d56",
  busd: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  usdt: "0x55d398326f99059ff775485246999027b3197955",
  arth: "0xb69a424df8c737a122d0e60695382b3eec07ff4b",
  maha: "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b",
  "arth.usd": "0x88fd584dF3f97c64843CD474bDC6F78e398394f4",
  "bsc.3eps": "0xaf4de8e872131ae328ce21d909c74705d3aaf452",
  apeswapChefAddr: "0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9",
  apeBusdUsdc: "0xC087C78AbaC4A0E900a327444193dBF9BA69058E",
  apeBusdUsdt: "0x2e707261d086687470B515B320478Eb1C88D49bb"
}

const fetchAndCache = async () => {
  const collateralPrices = await getCollateralPrices();
  const apeSwapReward = await rewardPerMonth(apeSwapChef, bscProvider)

  const busdusdcTVL = await getApeSwapLPTokenTVLinUSD(
    bsc.apeBusdUsdc,
    [bsc.usdc, bsc.busd],
    ["BSCUSDC", "BUSD"],
    collateralPrices,
    bscProvider
  )

  const busdusdtTVL = await getApeSwapLPTokenTVLinUSD(
    bsc.apeBusdUsdt,
    [bsc.usdt, bsc.busd],
    ["BSCUSDT", "BUSD"],
    collateralPrices,
    bscProvider
  )

  const busdUsdcApr = await getApeAPR(Number(busdusdcTVL), apeSwapReward, collateralPrices)
  const busdUsdtApr = await getApeAPR(Number(busdusdtTVL), apeSwapReward, collateralPrices)
  
  // const qlpTvl = await usdcUsdtQLP(polygonTestnetProvider);
  cache.set("leaverage-datapoints", JSON.stringify({
      supplyAPR: "11.48",
      tradingAPR: "0.00",
      borrowAPR: "6.5",
      totalAPR: "6.5",
  }));

  // const qlpTvl = await usdcUsdtQLP(polygonTestnetProvider);
  cache.set("leaverage-datapoints-busd-usdt", JSON.stringify({
    supplyAPR: String(busdUsdtApr),
    tradingAPR: "0.00",
    borrowAPR: "1.63",
    totalAPR: String(busdUsdtApr)
  }));

  cache.set("leaverage-datapoints-busd-usdc", JSON.stringify({
    supplyAPR: String(busdUsdcApr),
    tradingAPR: "0.00",
    borrowAPR: "1.63",
    totalAPR: String(busdUsdtApr)
  }));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  let data;
  switch (_req.query.collateral) {
    case 'USDCUSDT-QLP-S':
      data = cache.get("leaverage-datapoints");
      break;
    case 'BUSDUSDT-APE-LP-S':
      data = cache.get("leaverage-datapoints-busd-usdt")
      break;
    case 'BUSDUSDC-APE-LP-S':
      data = cache.get("leaverage-datapoints-busd-usdc")
      break;
    default:
      data = cache.get("leaverage-datapoints");
  }
  // 1 min cache
  if (cache.get("leaverage-datapoints")) {
    res.send(data);
  } else {
    await fetchAndCache();
    res.send(cache.get("leaverage-datapoints"));
  }
};
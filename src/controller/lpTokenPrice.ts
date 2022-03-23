import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

const fetchAndCache = async () => {
    let dummyLpPrice = {
        arthmaha: 5,
        "arth.usdc": 3,
        arthusdc: 2
    }
    // const qlpTvl = await usdcUsdtQLP(polygonTestnetProvider);
    cache.set("lp-price", JSON.stringify(dummyLpPrice));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("lp-price")) {
    res.send(cache.get("lp-price"));
  } else {
    await fetchAndCache();
    res.send(cache.get("lp-price"));
  }
  
};
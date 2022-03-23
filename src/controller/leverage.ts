import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

const fetchAndCache = async () => {
    // const qlpTvl = await usdcUsdtQLP(polygonTestnetProvider);
    cache.set("leaverage-datapoints", JSON.stringify({
        supplyAPR: "13",
        tradingAPR: "2",
        borrowAPR: "4",
        totalAPR: "19",
      }
    ));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("leaverage-datapoints")) {
    res.send(cache.get("leaverage-datapoints"));
  } else {
    await fetchAndCache();
    res.send(cache.get("leaverage-datapoints"));
  }
  
};
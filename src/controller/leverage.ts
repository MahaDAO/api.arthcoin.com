import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

const fetchAndCache = async () => {
    // const qlpTvl = await usdcUsdtQLP(polygonTestnetProvider);
    cache.set("leaverage-datapoints", JSON.stringify({
        supplyAPR: "6.5",
        tradingAPR: "0.00",
        borrowAPR: "6.5",
        totalAPR: "6.5",
      }
    ));
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
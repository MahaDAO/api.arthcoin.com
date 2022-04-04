import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

const fetchAndCache = async () => {
    // const qlpTvl = await usdcUsdtQLP(polygonTestnetProvider);
    cache.set("leaverage-datapoints-busd-usdt", JSON.stringify({
        supplyAPR: "11.48",
        tradingAPR: "0.00",
        borrowAPR: "1.06",
        totalAPR: "12.54",
      }
    ));

    cache.set("leaverage-datapoints", JSON.stringify({
      supplyAPR: "11.48",
      tradingAPR: "0.00",
      borrowAPR: "6.5",
      totalAPR: "6.5",
    }
  ));

  cache.set("leaverage-datapoints-busd-usdc", JSON.stringify({
    supplyAPR: "8.89",
    tradingAPR: "0.00",
    borrowAPR: "0.85",
    totalAPR: "9.74",
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
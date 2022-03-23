import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

const TroveManager = require("../abi/TroveManager.json");
const priceFeed = require("../abi/PriceFeed.json");

const polygon = {
  troveManager: "0xe5EfD185Bd7c288e270bA764E105f8964aAecd41",
  priceFeed: "0x935c70e4B9371f63A598BdA58BF1B2b270C8eBFe",
};

const wallet = new ethers.Wallet(
  process.env.WALLET_KEY,
  polygonTestnetProvider
);

const usdcUsdtQLP = async (provider: ethers.providers.Provider) => {
  const troveManager = new ethers.Contract(
    polygon.troveManager,
    TroveManager,
    polygonTestnetProvider
  );

  let decimal = BigNumber.from(10).pow(18);
  const collateralRaised = await troveManager.getEntireSystemColl();
  const collateral = collateralRaised.div(decimal);

  const priceFeedContract = new ethers.Contract(
    polygon.priceFeed,
    priceFeed,
    wallet
  );

  const fetchPrice = await priceFeedContract.callStatic.fetchPrice();
  const price = fetchPrice / 1e18;

  return { QlpTvl: collateral * (price * 2) };
};

const fetchAndCache = async () => {
  const qlpTvl = await usdcUsdtQLP(polygonTestnetProvider);
  cache.set("loans-qlp", JSON.stringify(qlpTvl));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("loans-qlp")) {
    res.send(cache.get("loans-qlp"));
  } else {
    await fetchAndCache();
    res.send(cache.get("loans-qlpr"));
  }
};

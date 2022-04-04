import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

const TroveManager = require("../abi/TroveManager.json");
const priceFeed = require("../abi/PriceFeed.json");

const polygon = {
  troveManager: "0x2d1F24127AE8670eB9A9a36E81420fb030Ea953D",
  priceFeed: "0xe40805D1eA67265Cce0315243F4DEAddD9c611a9",
};

const wallet = new ethers.Wallet(
  process.env.WALLET_KEY,
  polygonProvider
);

const usdcUsdtQLP = async (provider: ethers.providers.Provider) => {
  try {
    const troveManager = new ethers.Contract(
      polygon.troveManager,
      TroveManager,
      polygonProvider
    );
  
    let decimal = BigNumber.from(10).pow(18);
    const collateralRaised = await troveManager.getEntireSystemColl();    
    const collateral = collateralRaised / 10e18 ;
    
    //console.log('collateral', collateral);
    
    const priceFeedContract = new ethers.Contract(
      polygon.priceFeed,
      priceFeed,
      wallet
    );
  
    const fetchPrice = await priceFeedContract.callStatic.fetchPrice();
    const price = fetchPrice / 1e12;
    
    //console.log('price', price);
    
    return { QlpTvl: collateral * (price * 2) };
  } catch (e) {
    console.log(e);
  } 
};

const fetchAndCache = async () => {
  const qlpTvl = await usdcUsdtQLP(polygonProvider);
  console.log('qlpTvl', qlpTvl);
  
  cache.set("loans-qlp", JSON.stringify(qlpTvl));
  console.log('cache', cache.get("loans-qlp"));

  cache.set("loans-qlp-busd-usdc", JSON.stringify(4624713));
  //console.log('cache', cache.get("loans-qlp"));

  cache.set("loans-qlp-busd-usdt", JSON.stringify(4451492));
  //console.log('cache', cache.get("loans-qlp"));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  let data;
  switch (_req.query.collateral) {
    case 'USDCUSDT-QLP-S':
      data = cache.get("loans-qlp");
      break;
    case 'BUSDUSDT-APE-LP-S':
      data = cache.get("loans-qlp-busd-usdt")
      break;
    case 'BUSDUSDC-APE-LP-S':
      data = cache.get("loans-qlp-busd-usdc")
      break;
    default:
      data = cache.get("loans-qlp");
  }

  // 1 min cache
  if (cache.get("loans-qlp")) {
    res.send(data);
  } else {
    await fetchAndCache();
    res.send(cache.get("loans-qlp"));
  }
};

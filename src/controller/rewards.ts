import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "./coingecko";
import NodeCache from "node-cache";
import cron from "node-cron";

const cache = new NodeCache();

const main = async () => {
    const collateralPrices = await getCollateralPrices();
    let sclpPrice = collateralPrices["SCLP"]
    let mahaPrice = collateralPrices["MAHA"]

    let amountofMaha = ((sclpPrice * 9000) / mahaPrice) + 1000
    
    return { amountWorthMaha: amountofMaha }
}

const fetchAndCache = async () => {
    const data = await main();
    cache.set("rewards-worth", JSON.stringify(data));
};
  
cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);

    // 1 min cache
    if (cache.get("rewards-worth")) {
        //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
        res.send(cache.get("rewards-worth"));
    } else {
        await fetchAndCache();
        //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
        res.send(cache.get("rewards-worth"));
    }
}
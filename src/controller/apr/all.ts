import _ from "underscore";
import cron from "node-cron";

import * as gaugeLP from "./gaugeLP";
import * as gaugeV3 from "./gaugeV3";
import * as governance from "./governance";
import * as stabilityPool from "./stabiltyPool";
import * as mahalend from "./mahalend";
import * as vaults from "./vaults";
import cache from "../../utils/cache";

const getData = async () => {
  const a = await gaugeLP.getData();
  const b = await governance.getData();
  const c = await gaugeV3.getData();
  const d = await stabilityPool.getData();
  const e = await vaults.getData();
  const f = await mahalend.getData();

  return {
    ...f,
    ...a,
    ...b,
    ...c,
    ...d,
    ...e,
  };
};

const fetchAndCache = async () => {
  const data = await getData();
  cache.set("apr-all", JSON.stringify(data));
};

// 15 min cache
cron.schedule("0 */15 * * * *", fetchAndCache);
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (cache.get("apr-all")) {
    res.status(200);
    res.send(cache.get("apr-all"));
  } else {
    res.status(401);
    res.send("loading");
  }
};

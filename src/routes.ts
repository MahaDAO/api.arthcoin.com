import { Router } from "express";
import apicache from "apicache";

import all from "./controller/apr/all";
import ethProtocolCPIGraph from "./controller/graphs/CPI";
import ethProtocolGraph from "./controller/graphs/protocolEthGraphs";
import ethProtocolMAGraph from "./controller/graphs/MA";
import gaugeLP from "./controller/apr/gaugeLP";
import gmuPrice from "./controller/prices/gmu";
import governance from "./controller/apr/governance";
import guageV3Apy from "./controller/apr/gaugeV3";
import mahalend from "./controller/apr/mahalend";
import stability from "./controller/apr/stabiltyPool";
import vaults from "./controller/apr/vaults";
import assets from "./controller/prices/assets";

const router = Router();
router.get("/", (_req, res) => {
  res.json({
    status: "online",
  });
});

router.get("/apr/all", all);

// add a 15 min cache
const cache = apicache.middleware;
router.use(cache("15 minutes"));

router.get("/apr/gauges-lp-tokens", gaugeLP);
router.get("/apr/gauges-uniswap-v3", guageV3Apy);
router.get("/apr/governance", governance);
router.get("/apr/stability-pool-v2", stability);
router.get("/apr/mahalend", mahalend);
router.get("/apr/vaults", vaults);
router.get("/apr/mahalend", mahalend);

router.get("/prices/gmu", gmuPrice);
router.get("/prices/assets", assets);

router.get("/graph/protocol", ethProtocolGraph);
router.get("/graph/protocol/CPI", ethProtocolCPIGraph);
router.get("/graph/protocol/MA", ethProtocolMAGraph);

export default router;

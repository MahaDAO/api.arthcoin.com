import { Router } from "express";
import apicache from "apicache";

import ethProtocolCPIGraph from "./controller/graphs/CPI";
import ethProtocolGraph from "./controller/graphs/protocolEthGraphs";
import ethProtocolMAGraph from "./controller/graphs/MA";
import gaugeLP from "./controller/gaugeLP";
import governance from "./controller/governance";
import guageV3Apy from "./controller/gaugeV3";
import stability from "./controller/stabiltyPool";
import vaults from "./controller/vaults";
import all from "./controller/all";

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
router.get("/apr/vaults", vaults);

router.get("/graph/protocol", ethProtocolGraph);
router.get("/graph/protocol/CPI", ethProtocolCPIGraph);
router.get("/graph/protocol/MA", ethProtocolMAGraph);

export default router;

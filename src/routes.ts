import { Router } from "express";
import apicache from "apicache";

import governance from "./controller/governance";
import stability from "./controller/stabiltyPool";
import ethProtocolGraph from "./controller/graphs/protocolEthGraphs";
import ethProtocolMAGraph from "./controller/graphs/MA";
import ethProtocolCPIGraph from "./controller/graphs/CPI";
import guageV3Apy from "./controller/gaugeV3";
import gaugeLP from "./controller/gaugeLP";
import vaults from "./controller/vaults";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "online",
  });
});

// add a 5 min cache
const cache = apicache.middleware;
router.use(cache("5 minutes"));

router.get("/apr/governance", governance);
router.get("/apr/vaults", vaults);
router.get("/apr/stability-pool-v2", stability);
router.get("/apr/gauges-uniswap-v3", guageV3Apy);
router.get("/apr/gauges-lp-tokens", gaugeLP);

router.get("/graph/protocol", ethProtocolGraph);
router.get("/graph/protocol/MA", ethProtocolMAGraph);
router.get("/graph/protocol/CPI", ethProtocolCPIGraph);

export default router;

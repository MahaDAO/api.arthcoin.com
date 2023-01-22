import { Router } from "express";
import apicache from "apicache";

// import governance from "./controller/governance";
// import loans from "./controller/loans";
// import guage from "./controller/gauageApy";
import stability from "./controller/stabiltyPoolApy";
// import qlp from "./controller/lonasQlpTvl";
// import lpPrice from "./controller/lpTokenPrice";
// import leverage from "./controller/leverage";
// import ethProtocolGraph from "./controller/graphs/protocolEthGraphs";
// import ethProtocolMAGraph from "./controller/graphs/MA";
// import ethProtocolCPIGraph from "./controller/graphs/CPI";
import guageV3Apy from "./controller/guageV3";
// import rewards from "./controller/rewards";
// import mahalendApy from "./controller/mahalendApy";
// import arthCampaign from "./controller/arthCampaign";
// import * as signature from "./controller/signature";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "online",
  });
});

let cache = apicache.middleware;
router.use(cache("5 minutes"));

// const cacheMiddleware = new ExpressCache(
//   cacheManager.caching("memory", {
//     max: 10000,
//     ttl: 3600,
//   })
// );

// router.post("/apy/qlp", qlp);
// router.post("/apy/lp", lpPrice);

// router.post("/signature/check", signature.checkSignature);
// router.post("/signature/write", signature.writeSignature);

// cacheMiddleware.attach(router);

// router.get("/apy/governance", governance);
// router.get("/apy/loans", loans);
// router.get("/apy/guage", guage);
router.get("/apy/stability-pool-v2", stability);
router.get("/apy/gauges-unisawpv3", guageV3Apy);

// router.get("/apy/eth/protocol/graph", ethProtocolGraph);
// router.get("/apy/eth/protocol/graph/MA", ethProtocolMAGraph);
// router.get("/apy/eth/protocol/graph/CPI", ethProtocolCPIGraph);

// router.get("/apy/leverage", leverage);
// router.get("/apy/rewards", rewards);
// router.get("/apy/mahalend", mahalendApy);
// router.get("/apy/campaign", arthCampaign);

export default router;

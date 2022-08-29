import { Router } from "express";

import governance from "./controller/governance";
import loans from "./controller/loans";
import guage from "./controller/gauageApy";
import stability from "./controller/stabiltyPoolApy";
import qlp from "./controller/lonasQlpTvl";
import lpPrice from "./controller/lpTokenPrice";
import leverage from "./controller/leverage";
import ethProtocolGraph from "./controller/graphs/protocolEthGraphs"
import ethProtocolMAGraph from "./controller/graphs/MA"
import ethProtocolCPIGraph from "./controller/graphs/CPI"
import guageV3Apy from "./controller/guageV3"
import * as signature from "./controller/signature"

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "online",
  });
});

router.get("/apy/governance", governance);
router.get("/apy/loans", loans);
router.get("/apy/guage", guage);
router.get("/apy/stability", stability);

router.get("/apy/eth/protocol/graph", ethProtocolGraph);
router.get("/apy/eth/protocol/graph/MA", ethProtocolMAGraph);
router.get("/apy/eth/protocol/graph/CPI", ethProtocolCPIGraph);

router.post("/apy/qlp", (req, res) => { qlp(req, res) });
router.post("/apy/lp", (req, res) => { lpPrice(req, res) });
router.get("/apy/guageV3Apy", guageV3Apy);

router.get("/apy/leverage", (req, res) => { leverage(req, res) });

router.post("/apy/check/signature", (req, res) => { signature.checkSignature(req, res) })
router.post("/apy/singnature", (req, res) => { signature.writeSignature(req, res) })

export default router;

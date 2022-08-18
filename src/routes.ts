import { Router } from "express";
import governance from "./controller/governance";
import loans from "./controller/loans";
import guage from "./controller/gauageApy";
import stability from "./controller/stabiltyPoolApy";
import qlp from "./controller/lonasQlpTvl";
import lpPrice from "./controller/lpTokenPrice";
import leverage from "./controller/leverage";
import ethProtocolGraph from "./controller/graphs/protocolEthGraphs"

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

router.post("/apy/qlp", (req, res) => { qlp(req, res) });
router.post("/apy/lp", (req, res) => { lpPrice(req, res) });
router.get("/apy/leverage", (req, res) => { leverage(req, res) });

export default router;

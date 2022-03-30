import { Router } from "express";
import governance from "./controller/governance";
import loans from "./controller/loans";
import qlp from "./controller/lonasQlpTvl";
import lpPrice from "./controller/lpTokenPrice";
import leverage from "./controller/leverage";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "online",
  });
});

router.get("/apy/governance", governance);
router.get("/apy/loans", loans);
router.post("/apy/qlp", (req, res) => { qlp(req, res) });
router.post("/apy/lp", (req, res) => { lpPrice(req, res) });
router.post("/apy/leverage", (req, res) => { leverage(req, res) });

export default router;

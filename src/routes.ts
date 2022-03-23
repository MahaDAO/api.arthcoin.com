import { Router } from "express";
import governance from "./controller/governance";
import loans from "./controller/loans";
import qlp from "./controller/lonasQlpTvl";
import lpPrice from "./controller/lpTokenPrice";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "online",
  });
});

router.get("/apy/governance", governance);
router.get("/apy/loans", loans);
router.get("/apy/qlp", qlp);
router.get("/apy/lp", lpPrice);


export default router;

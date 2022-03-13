import { Router } from "express";
import governance from "./controller/governance";
import loans from "./controller/loans";
import qlp from "./controller/lonasQlpTvl";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "online",
  });
});

router.get("/apy/governance", governance);
router.get("/apy/loans", loans);
router.get("/apy/qlp", qlp);

export default router;

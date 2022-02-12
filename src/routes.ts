import { Router } from "express";
import governance from "./controller/governance";
import loans from "./controller/loans";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "online",
  });
});

router.get("/apy/governance", governance);
router.get("/apy/loans", loans);

export default router;

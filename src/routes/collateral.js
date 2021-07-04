import { Router } from 'express';
import * as collateral from '../controller/CollateralValue';

const router = Router();

router.get('/collateral/arthsupply', (req, res) => { (collateral.getArthSupply(req, res)); });
router.get('/collateral/totalCollateral', (req, res) => { (collateral.getCollateralValue(req, res)); });
router.get('/collateral/test', (req, res) => { (collateral.test(req, res)); });

export default router;
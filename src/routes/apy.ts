import { Router } from 'express'

import polygon from '../controller/apy/polygon'

const router = Router()
router.get('/polygon', polygon);
export default router;

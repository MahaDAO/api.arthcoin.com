import { Router } from 'express'
import * as apy from '../controller/APY'

const router = Router()

router.post('/ARTH/WETH/Apy', (req, res) => { (apy.getArthWethLPTokenPrice(req.body, res))})
router.get('/test', (req, res) => { res.send('true') })


export default router
import { Router } from 'express'
import * as apy from '../controller/APY'

const router = Router()

router.get('/ARTHX', (req, res) => { apy.arthxAPY(req.body, res) })
router.get('/request', (req, res) => { apy.sendResponse(req.query, res) })
router.get('/test', (req, res) => { res.send('true') })

export default router
import { Router } from 'express'
import collateral from './collateral'
import APY from './apy'

const router = Router()

router.use('/api', collateral)
router.use('/api/apy', APY)
router.use('/api/test', (req, res) => { res.send({ "msg": "test" })})

export default router
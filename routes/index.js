import { Router } from 'express'
import collateral from './collateral'

const router = Router()

router.use('/api', collateral)
router.use('/api/test', (req, res) => { res.send({ "msg": "test" })})

export default router
import { Router } from 'express';
import collateral from './collateral';
import APY from './apy';

const router = Router();

router.get('/', (req, res) => {
    res.json({
        status: 'online'
    });
});

router.use('/api', collateral);
router.use('/api/apy', APY);

export default router;

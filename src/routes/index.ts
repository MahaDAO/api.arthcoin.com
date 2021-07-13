import { Router } from 'express';
import apy from './apy';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'online'
  });
});

router.use('/apy', apy);

export default router;

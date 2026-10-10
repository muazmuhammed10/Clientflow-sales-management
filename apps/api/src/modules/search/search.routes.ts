import { Router } from 'express';
import { globalSearch } from './search.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', globalSearch);

export default router;

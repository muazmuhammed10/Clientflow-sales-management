import { Router } from 'express';
import { getDefaultPipeline, updateStageOrder } from './pipelines.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getDefaultPipeline);
router.put(
  '/stages/reorder',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER']),
  updateStageOrder
);

export default router;

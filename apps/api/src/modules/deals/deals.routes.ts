import { Router } from 'express';
import {
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from './deals.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  createDealSchema,
  updateDealSchema,
  updateDealStageSchema,
} from '@clientflow/shared';

const router = Router();

router.use(authenticate);

router.get('/', listDeals);
router.get('/:id', getDeal);
router.post(
  '/',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(createDealSchema),
  createDeal
);
router.patch(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(updateDealSchema),
  updateDeal
);
router.patch(
  '/:id/stage',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(updateDealStageSchema),
  updateDealStage
);
router.delete(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER']),
  deleteDeal
);

export default router;

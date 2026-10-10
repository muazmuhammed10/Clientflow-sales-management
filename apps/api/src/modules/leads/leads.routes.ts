import { Router } from 'express';
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
} from './leads.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  createLeadSchema,
  updateLeadSchema,
  convertLeadSchema,
} from '@clientflow/shared';

const router = Router();

router.use(authenticate);

router.get('/', listLeads);
router.get('/:id', getLead);
router.post(
  '/',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(createLeadSchema),
  createLead
);
router.patch(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(updateLeadSchema),
  updateLead
);
router.delete(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER']),
  deleteLead
);
router.post(
  '/:id/convert',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(convertLeadSchema),
  convertLead
);

export default router;

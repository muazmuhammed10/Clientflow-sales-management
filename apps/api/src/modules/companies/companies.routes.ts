import { Router } from 'express';
import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from './companies.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createCompanySchema, updateCompanySchema } from '@clientflow/shared';

const router = Router();

router.use(authenticate);

router.get('/', listCompanies);
router.get('/:id', getCompany);
router.post(
  '/',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(createCompanySchema),
  createCompany
);
router.patch(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(updateCompanySchema),
  updateCompany
);
router.delete(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER']),
  deleteCompany
);

export default router;

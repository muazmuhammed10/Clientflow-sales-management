import { Router } from 'express';
import { getOrganization, updateOrganization } from './organizations.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { updateOrganizationSchema } from '@clientflow/shared';

const router = Router();

router.use(authenticate);

router.get('/', getOrganization);
router.patch(
  '/',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN']),
  validateBody(updateOrganizationSchema),
  updateOrganization
);

export default router;

import { Router } from 'express';
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from './contacts.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createContactSchema, updateContactSchema } from '@clientflow/shared';

const router = Router();

router.use(authenticate);

router.get('/', listContacts);
router.get('/:id', getContact);
router.post(
  '/',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(createContactSchema),
  createContact
);
router.patch(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(updateContactSchema),
  updateContact
);
router.delete(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER']),
  deleteContact
);

export default router;

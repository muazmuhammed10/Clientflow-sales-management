import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} from './tasks.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '@clientflow/shared';

const router = Router();

router.use(authenticate);

router.get('/', listTasks);
router.post(
  '/',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(createTaskSchema),
  createTask
);
router.patch(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  validateBody(updateTaskSchema),
  updateTask
);
router.delete(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP']),
  deleteTask
);

export default router;

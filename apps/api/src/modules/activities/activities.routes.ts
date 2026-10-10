import { Router } from 'express';
import { listActivities, createActivityNote } from './activities.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createActivityNoteSchema } from '@clientflow/shared';

const router = Router();

router.use(authenticate);

router.get('/', listActivities);
router.post('/', validateBody(createActivityNoteSchema), createActivityNote);

export default router;

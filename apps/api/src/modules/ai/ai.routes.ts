import { Router } from 'express';
import {
  getLeadSummary,
  getSuggestedFollowUp,
  getNextAction,
} from './ai.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/lead-summary/:leadId', getLeadSummary);
router.get('/suggest-followup/:leadId', getSuggestedFollowUp);
router.get('/next-action/:type/:id', getNextAction);

export default router;

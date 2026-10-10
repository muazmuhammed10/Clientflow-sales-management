import { Router } from 'express';
import { getReportsData, exportDealsCsv, exportLeadsCsv } from './reports.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getReportsData);
router.get('/export/deals', exportDealsCsv);
router.get('/export/leads', exportLeadsCsv);

export default router;

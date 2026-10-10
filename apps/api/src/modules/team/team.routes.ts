import { Router } from 'express';
import {
  listMembers,
  inviteMember,
  listInvitations,
  updateMemberRole,
  toggleMemberStatus,
  acceptInvitation,
} from './team.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { inviteMemberSchema, updateMemberRoleSchema } from '@clientflow/shared';

const router = Router();

// Public route to accept invitation
router.post('/accept-invitation', acceptInvitation);

// Protected routes
router.use(authenticate);

router.get('/members', listMembers);
router.post(
  '/invite',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN']),
  validateBody(inviteMemberSchema),
  inviteMember
);
router.get(
  '/invitations',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN']),
  listInvitations
);
router.patch(
  '/members/:memberId/role',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN']),
  validateBody(updateMemberRoleSchema),
  updateMemberRole
);
router.patch(
  '/members/:userId/status',
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN']),
  toggleMemberStatus
);

export default router;

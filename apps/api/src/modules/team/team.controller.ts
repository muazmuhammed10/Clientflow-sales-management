import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export const listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const members = await prisma.membership.findMany({
      where: { organizationId: req.organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                assignedLeads: true,
                ownedDeals: true,
                assignedTasks: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        phone: m.user.phone,
        avatarUrl: m.user.avatarUrl,
        isActive: m.user.isActive,
        role: m.role,
        createdAt: m.createdAt,
        counts: m.user._count,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, role } = req.body;

    // Check if user is already a member of this organization
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          where: { organizationId: req.organizationId },
        },
      },
    });

    if (existingUser && existingUser.memberships.length > 0) {
      res.status(400).json({
        success: false,
        error: 'This user is already a member of your organization',
      });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        organizationId: req.organizationId!,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
        invitedById: req.user!.id,
      },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'TEAM_MEMBER_INVITED',
      entityType: 'INVITATION',
      entityId: invitation.id,
      details: { email, role },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`,
        devToken: token,
      },
      message: 'Invitation generated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const listInvitations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: req.organizationId,
        acceptedAt: null,
      },
      include: {
        invitedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    const membership = await prisma.membership.findFirst({
      where: {
        id: memberId,
        organizationId: req.organizationId,
      },
    });

    if (!membership) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    // Prevent changing your own role away from ORG_ADMIN if you are the last admin
    if (membership.userId === req.user!.id && membership.role === 'ORG_ADMIN' && role !== 'ORG_ADMIN') {
      const adminCount = await prisma.membership.count({
        where: { organizationId: req.organizationId, role: 'ORG_ADMIN' },
      });
      if (adminCount <= 1) {
        res.status(400).json({
          success: false,
          error: 'Cannot demote the last organization administrator',
        });
        return;
      }
    }

    const updated = await prisma.membership.update({
      where: { id: memberId },
      data: { role },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'MEMBER_ROLE_UPDATED',
      entityType: 'MEMBERSHIP',
      entityId: memberId,
      details: { previousRole: membership.role, newRole: role },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleMemberStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    if (userId === req.user!.id) {
      res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { organizationId: req.organizationId },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      res.status(404).json({ success: false, error: 'User not found in this organization' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: updated.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: userId,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        userId: updated.id,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, firstName, lastName, password } = req.body;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        error: 'Invitation is invalid, has expired, or has already been accepted',
      });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    await prisma.$transaction(async (tx) => {
      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        user = await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash,
            firstName,
            lastName,
            isActive: true,
          },
        });
      }

      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });

    res.json({
      success: true,
      message: 'Invitation accepted successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

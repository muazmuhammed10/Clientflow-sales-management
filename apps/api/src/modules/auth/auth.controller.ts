import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/db';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { logAudit } from '../../utils/audit';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { organizationName, firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'An account with this email address already exists',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    // Create Organization, Admin User, Membership, and Default Sales Pipeline in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          currency: 'USD',
          timezone: 'UTC',
        },
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          isActive: true,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'ORG_ADMIN',
        },
      });

      // Create default pipeline and standard stages
      const pipeline = await tx.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Standard Sales Pipeline',
          isDefault: true,
        },
      });

      const defaultStages = [
        { name: 'Qualification', order: 1, probability: 10, isWon: false, isLost: false },
        { name: 'Discovery', order: 2, probability: 30, isWon: false, isLost: false },
        { name: 'Proposal', order: 3, probability: 60, isWon: false, isLost: false },
        { name: 'Negotiation', order: 4, probability: 80, isWon: false, isLost: false },
        { name: 'Closed Won', order: 5, probability: 100, isWon: true, isLost: false },
        { name: 'Closed Lost', order: 6, probability: 0, isWon: false, isLost: true },
      ];

      for (const stage of defaultStages) {
        await tx.pipelineStage.create({
          data: {
            pipelineId: pipeline.id,
            name: stage.name,
            order: stage.order,
            probability: stage.probability,
            isWon: stage.isWon,
            isLost: stage.isLost,
          },
        });
      }

      return { org, user, membership };
    });

    const accessToken = signAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.membership.role,
      organizationId: result.org.id,
    });

    const refreshToken = signRefreshToken({ userId: result.user.id });
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await logAudit({
      organizationId: result.org.id,
      userId: result.user.id,
      action: 'ORGANIZATION_REGISTERED',
      entityType: 'ORGANIZATION',
      entityId: result.org.id,
      details: { organizationName, email },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.membership.role,
          organizationId: result.org.id,
          organizationName: result.org.name,
          currency: result.org.currency,
          timezone: result.org.timezone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid email address or password',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid email address or password',
      });
      return;
    }

    const primaryMembership = user.memberships[0];
    if (!primaryMembership) {
      res.status(403).json({
        success: false,
        error: 'No active organization membership found',
      });
      return;
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: primaryMembership.role,
      organizationId: primaryMembership.organizationId,
    });

    const refreshToken = signRefreshToken({ userId: user.id });
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await logAudit({
      organizationId: primaryMembership.organizationId,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: primaryMembership.role,
          organizationId: primaryMembership.organizationId,
          organizationName: primaryMembership.organization.name,
          currency: primaryMembership.organization.currency,
          timezone: primaryMembership.organization.timezone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: 'Refresh token is required' });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      res.status(401).json({ success: false, error: 'Refresh token has been revoked or expired' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!user || !user.isActive || !user.memberships[0]) {
      res.status(401).json({ success: false, error: 'User not active or organization not found' });
      return;
    }

    const membership = user.memberships[0];
    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: membership.role,
      organizationId: membership.organizationId,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        memberships: {
          where: { organizationId: req.organizationId },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const membership = user.memberships[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: membership.role,
        organizationId: membership.organizationId,
        organizationName: membership.organization.name,
        currency: membership.organization.currency,
        timezone: membership.organization.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Development-friendly: always return success message to avoid user enumeration
    if (!user) {
      res.json({
        success: true,
        message: 'If the email exists in our records, a reset token was generated.',
      });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    res.json({
      success: true,
      message: 'If the email exists in our records, a reset token was generated.',
      // Provide devToken in development for easy local testing
      ...(process.env.NODE_ENV === 'development' ? { devResetToken: rawToken } : {}),
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        error: 'Password reset token is invalid or has expired',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({
      success: true,
      message: 'Password has been successfully updated. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

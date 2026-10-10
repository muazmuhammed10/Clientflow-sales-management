import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export const getOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId },
    });

    if (!org) {
      res.status(404).json({ success: false, error: 'Organization not found' });
      return;
    }

    res.json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, currency, timezone } = req.body;

    const updated = await prisma.organization.update({
      where: { id: req.organizationId },
      data: {
        ...(name ? { name } : {}),
        ...(currency ? { currency } : {}),
        ...(timezone ? { timezone } : {}),
      },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'ORGANIZATION',
      entityId: req.organizationId,
      details: { name, currency, timezone },
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

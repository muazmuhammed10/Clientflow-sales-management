import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';

export const listActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leadId = req.query.leadId as string;
    const contactId = req.query.contactId as string;
    const companyId = req.query.companyId as string;
    const dealId = req.query.dealId as string;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 30));

    const where: any = {
      organizationId: req.organizationId,
    };

    if (leadId) where.leadId = leadId;
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (dealId) where.dealId = dealId;

    const activities = await prisma.activity.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

export const createActivityNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, type = 'NOTE', leadId, contactId, companyId, dealId } = req.body;

    const activity = await prisma.activity.create({
      data: {
        organizationId: req.organizationId!,
        userId: req.user!.id,
        type,
        title,
        description,
        leadId: leadId || null,
        contactId: contactId || null,
        companyId: companyId || null,
        dealId: dealId || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // If contactId is present, update lastInteractionAt
    if (contactId) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { lastInteractionAt: new Date() },
      });
    }

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export const listDeals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const search = (req.query.search as string)?.trim() || '';
    const stageId = req.query.stageId as string;
    const ownerId = req.query.ownerId as string;
    const companyId = req.query.companyId as string;
    const contactId = req.query.contactId as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: any = {
      organizationId: req.organizationId,
    };

    if (stageId) where.stageId = stageId;
    if (ownerId) where.ownerId = ownerId;
    if (companyId) where.companyId = companyId;
    if (contactId) where.contactId = contactId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, deals] = await Promise.all([
      prisma.deal.count({ where }),
      prisma.deal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          stage: true,
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: deals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id, organizationId: req.organizationId },
      include: {
        stage: true,
        pipeline: true,
        company: true,
        contact: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

export const createDeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body;

    // Fetch stage to get probability
    const stage = await prisma.pipelineStage.findUnique({
      where: { id: body.stageId },
    });

    if (!stage) {
      res.status(400).json({ success: false, error: 'Pipeline stage not found' });
      return;
    }

    let actualCloseDate: Date | null = null;
    let probability = body.probability !== undefined ? body.probability : stage.probability;

    if (stage.isWon) {
      actualCloseDate = new Date();
      probability = 100;
    } else if (stage.isLost) {
      actualCloseDate = new Date();
      probability = 0;
    }

    const deal = await prisma.deal.create({
      data: {
        organizationId: req.organizationId!,
        name: body.name,
        pipelineId: stage.pipelineId,
        stageId: stage.id,
        contactId: body.contactId || null,
        companyId: body.companyId || null,
        amount: body.amount,
        currency: body.currency || 'USD',
        probability,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        actualCloseDate,
        ownerId: body.ownerId || req.user!.id,
        source: body.source || 'OTHER',
        description: body.description || null,
      },
      include: {
        stage: true,
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.activity.create({
      data: {
        organizationId: req.organizationId!,
        userId: req.user!.id,
        dealId: deal.id,
        type: 'STAGE_CHANGE',
        title: 'Deal Created',
        description: `Deal created in stage "${stage.name}" with value of $${deal.amount}`,
      },
    });

    if (deal.ownerId && deal.ownerId !== req.user!.id) {
      await prisma.notification.create({
        data: {
          organizationId: req.organizationId!,
          userId: deal.ownerId,
          type: 'DEAL_ASSIGNED',
          title: 'New Deal Assigned',
          message: `Deal "${deal.name}" was assigned to you`,
          link: `/deals/${deal.id}`,
        },
      });
    }

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'DEAL_CREATED',
      entityType: 'DEAL',
      entityId: deal.id,
      details: { name: deal.name, amount: deal.amount, stage: stage.name },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.deal.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.amount !== undefined ? { amount: body.amount } : {}),
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.probability !== undefined ? { probability: body.probability } : {}),
        ...(body.expectedCloseDate !== undefined
          ? { expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null }
          : {}),
        ...(body.contactId !== undefined ? { contactId: body.contactId || null } : {}),
        ...(body.companyId !== undefined ? { companyId: body.companyId || null } : {}),
        ...(body.ownerId !== undefined ? { ownerId: body.ownerId || null } : {}),
        ...(body.source !== undefined ? { source: body.source } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
      },
      include: {
        stage: true,
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDealStage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { stageId, lossReason } = req.body;

    const deal = await prisma.deal.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { stage: true },
    });

    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    const newStage = await prisma.pipelineStage.findUnique({
      where: { id: stageId },
    });

    if (!newStage || newStage.pipelineId !== deal.pipelineId) {
      res.status(400).json({ success: false, error: 'Invalid target stage' });
      return;
    }

    let actualCloseDate: Date | null = deal.actualCloseDate;
    let probability = newStage.probability;
    let activityType = 'STAGE_CHANGE';

    if (newStage.isWon) {
      actualCloseDate = new Date();
      probability = 100;
      activityType = 'DEAL_WON';
    } else if (newStage.isLost) {
      actualCloseDate = new Date();
      probability = 0;
      activityType = 'DEAL_LOST';
    } else {
      // Reopening or moving through active stages
      actualCloseDate = null;
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        stageId: newStage.id,
        probability,
        actualCloseDate,
        lossReason: newStage.isLost ? lossReason || deal.lossReason : null,
      },
      include: {
        stage: true,
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        organizationId: req.organizationId!,
        userId: req.user!.id,
        dealId: deal.id,
        type: activityType,
        title: `Deal Moved to ${newStage.name}`,
        description: `Stage changed from "${deal.stage.name}" to "${newStage.name}"${
          newStage.isLost && lossReason ? ` (Reason: ${lossReason})` : ''
        }`,
      },
    });

    // Notify owner if deal is won or lost
    if (deal.ownerId && (newStage.isWon || newStage.isLost)) {
      await prisma.notification.create({
        data: {
          organizationId: req.organizationId!,
          userId: deal.ownerId,
          type: newStage.isWon ? 'DEAL_WON' : 'DEAL_LOST',
          title: newStage.isWon ? 'Deal Closed Won! 🎉' : 'Deal Closed Lost',
          message: `Deal "${deal.name}" ($${deal.amount}) marked as ${newStage.name}`,
          link: `/deals/${deal.id}`,
        },
      });
    }

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'DEAL_STAGE_UPDATED',
      entityType: 'DEAL',
      entityId: deal.id,
      details: {
        previousStage: deal.stage.name,
        newStage: newStage.name,
        amount: deal.amount,
      },
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

export const deleteDeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    await prisma.deal.delete({
      where: { id },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'DEAL_DELETED',
      entityType: 'DEAL',
      entityId: id,
      details: { name: deal.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Deal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

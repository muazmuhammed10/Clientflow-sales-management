import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export const listContacts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const search = (req.query.search as string)?.trim() || '';
    const companyId = req.query.companyId as string;
    const ownerId = req.query.ownerId as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: any = {
      organizationId: req.organizationId,
    };

    if (companyId) where.companyId = companyId;
    if (ownerId) where.ownerId = ownerId;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { deals: true, tasks: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: contacts,
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

export const getContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id, organizationId: req.organizationId },
      include: {
        company: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        deals: {
          include: {
            stage: true,
          },
          orderBy: { createdAt: 'desc' },
        },
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

    if (!contact) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body;

    const contact = await prisma.contact.create({
      data: {
        organizationId: req.organizationId!,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        jobTitle: body.jobTitle || null,
        companyId: body.companyId || null,
        ownerId: body.ownerId || req.user!.id,
        notes: body.notes || null,
        tags: body.tags || [],
      },
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'CONTACT_CREATED',
      entityType: 'CONTACT',
      entityId: contact.id,
      details: { name: `${contact.firstName} ${contact.lastName}`, email: contact.email },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.contact.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.jobTitle !== undefined ? { jobTitle: body.jobTitle || null } : {}),
        ...(body.companyId !== undefined ? { companyId: body.companyId || null } : {}),
        ...(body.ownerId !== undefined ? { ownerId: body.ownerId || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
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

export const deleteContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!contact) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }

    await prisma.contact.delete({
      where: { id },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'CONTACT_DELETED',
      entityType: 'CONTACT',
      entityId: id,
      details: { name: `${contact.firstName} ${contact.lastName}` },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
